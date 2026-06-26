/**
 * Adaptador HTTP: implementación concreta de los gateways de `domain` contra la
 * API REST del backend. Único punto de contacto del app con la red.
 *
 * La URL base llega por env de Expo (`EXPO_PUBLIC_API_URL`); en simulador iOS
 * `localhost` sirve, en dispositivo físico hay que usar la IP LAN del host.
 *
 * El app es agnóstico del proveedor de IA: solo llama a `POST /stories` y el
 * backend decide (mock | local) según su propia configuración.
 */
import { ApiError } from '../domain/errors';
import { trackApi } from './telemetry';
import type { Api } from '../domain/gateways';
import type {
  Activity,
  ChildProfile,
  CreateChildProfileInput,
  GenerateStoryRequest,
  Guardian,
  History,
  LoginGuardianInput,
  RecommendActivitiesRequest,
  RegisterGuardianInput,
  Story,
} from '../domain/types';

const DEFAULT_BASE_URL = 'http://localhost:3000';

/**
 * Timeout por defecto de las peticiones. Sin él, `fetch` queda a merced del
 * timeout del SO (~300 s en móvil): un backend que no responde dejaría el spinner
 * indefinido. La generación de cuento/actividades usa un margen mayor (la IA tarda).
 */
const DEFAULT_TIMEOUT_MS = 15_000;
const GENERATION_TIMEOUT_MS = 30_000;

export function getBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
}

async function request<TResponse>(
  baseUrl: string,
  path: string,
  options: { method: 'GET' | 'POST'; body?: unknown; timeoutMs?: number },
): Promise<TResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    trackApi({ method: options.method, path, ok: false });
    // `abort` por timeout vs. fallo de red genérico: ambos reintentables, mensajes distintos.
    if (controller.signal.aborted) {
      throw new ApiError(0, 'timeout', 'El servidor tardó demasiado en responder.');
    }
    throw new ApiError(0, 'network', 'No se pudo conectar con el servidor.');
  } finally {
    clearTimeout(timer);
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

  return (await response.json()) as TResponse;
}

/** Composition de los gateways HTTP. `baseUrl` inyectable (tests); por defecto, el env. */
export function createApiGateways(baseUrl: string = getBaseUrl()): Api {
  return {
    guardians: {
      register: (input: RegisterGuardianInput) =>
        request<Guardian>(baseUrl, '/guardians', { method: 'POST', body: input }),
      login: (input: LoginGuardianInput) =>
        request<Guardian>(baseUrl, '/guardians/login', { method: 'POST', body: input }),
    },
    profiles: {
      create: (input: CreateChildProfileInput) =>
        request<ChildProfile>(baseUrl, '/profiles', { method: 'POST', body: input }),
      list: (guardianId: string) =>
        request<ChildProfile[]>(baseUrl, `/guardians/${guardianId}/profiles`, { method: 'GET' }),
    },
    stories: {
      generate: (req: GenerateStoryRequest) =>
        request<Story>(baseUrl, '/stories', {
          method: 'POST',
          body: req,
          timeoutMs: GENERATION_TIMEOUT_MS,
        }),
      markRead: (storyId: string) =>
        request<Story>(baseUrl, `/stories/${storyId}/read`, { method: 'POST' }),
      narrationUrl: (storyId: string) => `${baseUrl}/stories/${storyId}/narration`,
    },
    activities: {
      recommend: (req: RecommendActivitiesRequest) =>
        request<Activity[]>(baseUrl, '/activities/recommend', {
          method: 'POST',
          body: req,
          timeoutMs: GENERATION_TIMEOUT_MS,
        }),
      complete: (activityId: string, valoracion: number) =>
        request<Activity>(baseUrl, `/activities/${activityId}/complete`, {
          method: 'POST',
          body: { valoracion },
        }),
    },
    history: {
      get: (profileId: string) =>
        request<History>(baseUrl, `/profiles/${profileId}/history`, { method: 'GET' }),
    },
  };
}
