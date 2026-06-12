/**
 * Adaptador HTTP: implementación concreta de los gateways de `domain` contra la
 * API REST del backend. Único punto de contacto del app con la red.
 *
 * La URL base llega por env de Expo (`EXPO_PUBLIC_API_URL`); en simulador iOS
 * `localhost` sirve, en dispositivo físico hay que usar la IP LAN del host.
 *
 * El app es agnóstico del proveedor de IA: solo llama a `POST /stories` y el
 * backend decide (mock | local | cloud) según su propia configuración.
 */
import { ApiError } from '../domain/errors';
import type { Api } from '../domain/gateways';
import type {
  ChildProfile,
  CreateChildProfileInput,
  GenerateStoryRequest,
  Guardian,
  RegisterGuardianInput,
  Story,
} from '../domain/types';

const DEFAULT_BASE_URL = 'http://localhost:3000';

export function getBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
}

async function request<TResponse>(
  baseUrl: string,
  path: string,
  options: { method: 'GET' | 'POST'; body?: unknown },
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // Fallo de red (backend caído, host inalcanzable): la UI lo trata como reintentable.
    throw new ApiError(0, 'network', 'No se pudo conectar con el servidor.');
  }

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
    },
    profiles: {
      create: (input: CreateChildProfileInput) =>
        request<ChildProfile>(baseUrl, '/profiles', { method: 'POST', body: input }),
    },
    stories: {
      generate: (req: GenerateStoryRequest) =>
        request<Story>(baseUrl, '/stories', { method: 'POST', body: req }),
    },
  };
}
