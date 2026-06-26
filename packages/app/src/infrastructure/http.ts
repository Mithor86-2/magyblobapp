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
import type { z } from 'zod';
import { ApiError } from '../domain/errors';
import { trackApi } from './telemetry';
import {
  activityListSchema,
  activitySchema,
  childProfileListSchema,
  childProfileSchema,
  guardianSchema,
  historySchema,
  storySchema,
} from './schemas';
import type { Api } from '../domain/gateways';
import type {
  CreateChildProfileInput,
  GenerateStoryRequest,
  LoginGuardianInput,
  RecommendActivitiesRequest,
  RegisterGuardianInput,
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
  schema: z.ZodType<TResponse>,
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

/** Composition de los gateways HTTP. `baseUrl` inyectable (tests); por defecto, el env. */
export function createApiGateways(baseUrl: string = getBaseUrl()): Api {
  return {
    guardians: {
      register: (input: RegisterGuardianInput) =>
        request(baseUrl, '/guardians', { method: 'POST', body: input }, guardianSchema),
      login: (input: LoginGuardianInput) =>
        request(baseUrl, '/guardians/login', { method: 'POST', body: input }, guardianSchema),
    },
    profiles: {
      create: (input: CreateChildProfileInput) =>
        request(baseUrl, '/profiles', { method: 'POST', body: input }, childProfileSchema),
      list: (guardianId: string) =>
        request(
          baseUrl,
          `/guardians/${guardianId}/profiles`,
          { method: 'GET' },
          childProfileListSchema,
        ),
    },
    stories: {
      generate: (req: GenerateStoryRequest) =>
        request(
          baseUrl,
          '/stories',
          { method: 'POST', body: req, timeoutMs: GENERATION_TIMEOUT_MS },
          storySchema,
        ),
      markRead: (storyId: string) =>
        request(baseUrl, `/stories/${storyId}/read`, { method: 'POST' }, storySchema),
      narrationUrl: (storyId: string) => `${baseUrl}/stories/${storyId}/narration`,
    },
    activities: {
      recommend: (req: RecommendActivitiesRequest) =>
        request(
          baseUrl,
          '/activities/recommend',
          { method: 'POST', body: req, timeoutMs: GENERATION_TIMEOUT_MS },
          activityListSchema,
        ),
      complete: (activityId: string, valoracion: number) =>
        request(
          baseUrl,
          `/activities/${activityId}/complete`,
          { method: 'POST', body: { valoracion } },
          activitySchema,
        ),
    },
    history: {
      get: (profileId: string) =>
        request(baseUrl, `/profiles/${profileId}/history`, { method: 'GET' }, historySchema),
    },
  };
}
