/**
 * Cliente HTTP del backend. Único punto de contacto de la app con la red.
 * La URL base llega por env de Expo (`EXPO_PUBLIC_API_URL`); en simulador iOS
 * `localhost` sirve, en dispositivo físico hay que usar la IP LAN del host.
 *
 * La app es agnóstica del proveedor de IA: solo llama a `POST /stories` y el
 * backend decide (mock | local | cloud) según su propia configuración.
 */
import type {
  ChildProfileOutput,
  CreateChildProfileInput,
  GenerateStoryRequest,
  GuardianOutput,
  RegisterGuardianInput,
  StoryOutput,
} from './types';

const DEFAULT_BASE_URL = 'http://localhost:3000';

export function getBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
}

/** Error de API con el `tipo` de dominio del backend, para que la UI reaccione. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly tipo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }
}

async function request<TResponse>(
  path: string,
  options: { method: 'GET' | 'POST'; body?: unknown },
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
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

export function registerGuardian(input: RegisterGuardianInput): Promise<GuardianOutput> {
  return request<GuardianOutput>('/guardians', { method: 'POST', body: input });
}

export function createProfile(input: CreateChildProfileInput): Promise<ChildProfileOutput> {
  return request<ChildProfileOutput>('/profiles', { method: 'POST', body: input });
}

export function generateStory(input: GenerateStoryRequest): Promise<StoryOutput> {
  return request<StoryOutput>('/stories', { method: 'POST', body: input });
}
