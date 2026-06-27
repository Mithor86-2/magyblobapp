/**
 * Adaptador HTTP: implementación concreta de los gateways de `domain` contra la
 * API REST del backend. Único punto de contacto del app con la red.
 *
 * La URL base llega por env de Expo (`EXPO_PUBLIC_API_URL`); en simulador iOS
 * `localhost` sirve, en dispositivo físico hay que usar la IP LAN del host.
 *
 * El app es agnóstico del proveedor de IA: solo llama a `POST /stories` y el
 * backend decide (mock | local) según su propia configuración.
 *
 * Sesión autenticada (US-45): las peticiones a rutas protegidas adjuntan
 * `Authorization: Bearer <accessToken>`. Ante un 401, se intenta **una** renovación
 * con el refresh token (`POST /guardians/refresh`) y se reintenta; si la renovación
 * falla, se cierra la sesión (`onAuthExpired`). Los tokens los provee un
 * `SessionStore` inyectado desde el composition root (sin acoplar la app al store).
 */
import type { z } from 'zod';
import { ApiError } from '../domain/errors';
import { trackApi } from './telemetry';
import {
  activityListSchema,
  activitySchema,
  anonymousActivityListSchema,
  anonymousStorySchema,
  childProfileListSchema,
  childProfileSchema,
  guardianSessionSchema,
  historySchema,
  sessionTokensSchema,
  storySchema,
} from './schemas';
import type { Api } from '../domain/gateways';
import type {
  CreateChildProfileInput,
  GenerateStoryAnonymousRequest,
  GenerateStoryRequest,
  LoginGuardianInput,
  RecommendActivitiesAnonymousRequest,
  RecommendActivitiesRequest,
  RegisterGuardianInput,
  SessionTokens,
} from '../domain/types';

const DEFAULT_BASE_URL = 'http://localhost:3000';

/**
 * Timeout por defecto de las peticiones. Sin él, `fetch` queda a merced del
 * timeout del SO (~300 s en móvil): un backend que no responde dejaría el spinner
 * indefinido. La generación de cuento/actividades usa un margen mayor (la IA tarda).
 *
 * Márgenes holgados para producción (US-53): el backend en Render arranca **en frío**
 * y la primera petición tarda; 30 s de base y 90 s para la generación de IA evitan
 * abortar una petición que sí iba a responder.
 */
const DEFAULT_TIMEOUT_MS = 30_000;
const GENERATION_TIMEOUT_MS = 90_000;

/**
 * Reintento con backoff ante fallos transitorios (US-53): un `timeout` o un fallo
 * de `network` puede deberse al cold start del servidor o a una red intermitente, no
 * a un error real. Se reintenta hasta 2 veces con una espera creciente; los errores
 * HTTP (4xx/5xx con cuerpo) y `malformed` no se reintentan (no son transitorios).
 */
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Puerto de sesión que el adaptador HTTP usa para leer los tokens, guardarlos tras
 * una renovación y cerrar sesión cuando el refresh falla. Lo implementa el
 * composition root sobre el store; el adaptador no conoce el store ni Zustand.
 */
export interface SessionStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: SessionTokens): void;
  onAuthExpired(): void;
}

export function getBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
}

/**
 * Ping de warm-up al arrancar (US-53): despierta el backend en frío de Render con
 * una petición a `/health` para que la primera acción del usuario no pague el cold
 * start. No bloquea la interfaz ni propaga errores (si falla, la petición real lo
 * reintentará con su propio backoff); fija un timeout amplio acorde al arranque.
 */
export function warmUp(baseUrl: string = getBaseUrl()): void {
  if (typeof fetch !== 'function') return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  void fetch(`${baseUrl}/health`, { signal: controller.signal })
    .catch(() => undefined)
    .finally(() => clearTimeout(timer));
}

interface RequestOptions {
  method: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
  /** La ruta exige access token: adjunta Bearer y aplica refresh-on-401 (US-45). */
  auth?: boolean;
}

/** Renueva el par de tokens contra `POST /guardians/refresh`. Lanza `ApiError` si falla. */
async function postRefresh(baseUrl: string, refreshToken: string): Promise<SessionTokens> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/guardians/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'network', 'No se pudo renovar la sesión.');
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new ApiError(response.status, 'unauthorized', 'La sesión ha caducado.');
  }
  const data = (await response.json().catch(() => null)) as unknown;
  const parsed = sessionTokensSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(response.status, 'malformed', 'Respuesta de renovación inesperada.');
  }
  return parsed.data;
}

async function request<TResponse>(
  baseUrl: string,
  path: string,
  options: RequestOptions,
  schema: z.ZodType<TResponse>,
  session?: SessionStore,
): Promise<TResponse> {
  const auth = options.auth ?? false;

  async function fetchOnce(token: string | null): Promise<Response> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {};
    if (options.body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: options.method,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch {
      trackApi({ method: options.method, path, ok: false });
      // `abort` por timeout vs. fallo de red genérico: ambos reintentables, mensajes distintos.
      if (controller.signal.aborted) {
        throw new ApiError(0, 'timeout', 'El servidor tardó demasiado en responder.');
      }
      throw new ApiError(0, 'network', 'No se pudo conectar con el servidor.');
    } finally {
      clearTimeout(timer);
    }
    return response;
  }

  // Reintento con backoff (US-53) solo ante fallos transitorios (`timeout`/`network`):
  // el cold start de Render o una red intermitente se recuperan con un segundo intento.
  // Los errores HTTP llegan como `response` (no lanzan aquí) y no se reintentan.
  async function fetchWithRetry(token: string | null): Promise<Response> {
    for (let intento = 0; ; intento++) {
      try {
        return await fetchOnce(token);
      } catch (error) {
        const transitorio =
          error instanceof ApiError && (error.tipo === 'timeout' || error.tipo === 'network');
        if (!transitorio || intento >= MAX_RETRIES) throw error;
        await delay(RETRY_BASE_DELAY_MS * 2 ** intento);
      }
    }
  }

  let response = await fetchWithRetry(auth ? (session?.getAccessToken() ?? null) : null);

  // Refresh-on-401 (US-45): un access token caducado → renovar una vez y reintentar;
  // si no hay refresh o la renovación falla, cerrar la sesión.
  if (auth && response.status === 401 && session) {
    const refreshToken = session.getRefreshToken();
    let renovados: SessionTokens | null = null;
    if (refreshToken !== null) {
      try {
        renovados = await postRefresh(baseUrl, refreshToken);
        session.setTokens(renovados);
      } catch {
        renovados = null;
      }
    }
    if (renovados !== null) {
      response = await fetchOnce(renovados.accessToken);
    } else {
      session.onAuthExpired();
    }
  }

  // Breadcrumb del recorrido (US-42): método, ruta y resultado, sin cuerpo ni PII.
  trackApi({ method: options.method, path, status: response.status, ok: response.ok });

  if (!response.ok) {
    const fallback = `Error ${response.status}`;
    const body = (await response.json().catch(() => null)) as {
      error?: { tipo?: string; mensaje?: string };
    } | null;
    throw new ApiError(
      response.status,
      body?.error?.tipo ?? 'http',
      body?.error?.mensaje ?? fallback,
    );
  }

  // Validación de la respuesta en la frontera: el backend puede cambiar o devolver
  // algo inesperado; en vez de propagar un objeto malformado por un cast `as`, se
  // produce un `ApiError` controlado que la UI trata como el resto de errores.
  const data = (await response.json().catch(() => null)) as unknown;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      response.status,
      'malformed',
      'El servidor devolvió una respuesta inesperada.',
    );
  }
  return parsed.data;
}

/**
 * Composition de los gateways HTTP. `baseUrl` y `session` inyectables (tests);
 * por defecto, el env y sin sesión (el composition root cablea el store).
 */
export function createApiGateways(baseUrl: string = getBaseUrl(), session?: SessionStore): Api {
  return {
    guardians: {
      register: (input: RegisterGuardianInput) =>
        request(baseUrl, '/guardians', { method: 'POST', body: input }, guardianSessionSchema),
      login: (input: LoginGuardianInput) =>
        request(
          baseUrl,
          '/guardians/login',
          { method: 'POST', body: input },
          guardianSessionSchema,
        ),
      refresh: (refreshToken: string) => postRefresh(baseUrl, refreshToken),
    },
    profiles: {
      create: (input: CreateChildProfileInput) =>
        request(
          baseUrl,
          '/profiles',
          { method: 'POST', body: input, auth: true },
          childProfileSchema,
          session,
        ),
      list: (guardianId: string) =>
        request(
          baseUrl,
          `/guardians/${guardianId}/profiles`,
          { method: 'GET', auth: true },
          childProfileListSchema,
          session,
        ),
    },
    stories: {
      generate: (req: GenerateStoryRequest) =>
        request(
          baseUrl,
          '/stories',
          { method: 'POST', body: req, timeoutMs: GENERATION_TIMEOUT_MS, auth: true },
          storySchema,
          session,
        ),
      // Modo anónimo efímero (US-50): ruta pública (sin `auth`); no persiste nada.
      generateAnonymous: (req: GenerateStoryAnonymousRequest) =>
        request(
          baseUrl,
          '/stories/anonymous',
          { method: 'POST', body: req, timeoutMs: GENERATION_TIMEOUT_MS },
          anonymousStorySchema,
        ),
      markRead: (storyId: string) =>
        request(
          baseUrl,
          `/stories/${storyId}/read`,
          { method: 'POST', auth: true },
          storySchema,
          session,
        ),
      narrationUrl: (storyId: string) => `${baseUrl}/stories/${storyId}/narration`,
    },
    activities: {
      recommend: (req: RecommendActivitiesRequest) =>
        request(
          baseUrl,
          '/activities/recommend',
          { method: 'POST', body: req, timeoutMs: GENERATION_TIMEOUT_MS, auth: true },
          activityListSchema,
          session,
        ),
      // Modo anónimo efímero (US-50): ruta pública (sin `auth`); no persiste nada.
      recommendAnonymous: (req: RecommendActivitiesAnonymousRequest) =>
        request(
          baseUrl,
          '/activities/recommend/anonymous',
          { method: 'POST', body: req, timeoutMs: GENERATION_TIMEOUT_MS },
          anonymousActivityListSchema,
        ),
      complete: (activityId: string, valoracion: number) =>
        request(
          baseUrl,
          `/activities/${activityId}/complete`,
          { method: 'POST', body: { valoracion }, auth: true },
          activitySchema,
          session,
        ),
    },
    history: {
      get: (profileId: string) =>
        request(
          baseUrl,
          `/profiles/${profileId}/history`,
          { method: 'GET', auth: true },
          historySchema,
          session,
        ),
    },
  };
}
