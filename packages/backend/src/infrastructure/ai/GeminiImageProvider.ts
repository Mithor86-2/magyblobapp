import type { AILogger } from './FallbackProvider.js';

export interface GeminiImageProviderOptions {
  /** API key de Gemini (env `GEMINI_API_KEY`, leída de `config.cloudApiKeys.gemini`). */
  apiKey: string;
  /** Modelo de imagen de Imagen; por defecto `imagen-4.0-generate-001`. */
  model?: string;
  /** Base del endpoint de Imagen (sin barra final); por defecto el de Google. */
  baseUrl?: string;
  /** Aborta la petición si tarda más de esto (ms); por defecto 60 s. */
  timeoutMs?: number;
  /** Inyectable en tests; por defecto el `fetch` global de Node. */
  fetchFn?: typeof fetch;
  /** Logger para observabilidad (opcional). */
  logger?: AILogger;
}

const MODELO_DEFECTO = 'imagen-4.0-generate-001';
const BASE_URL_DEFECTO = 'https://generativelanguage.googleapis.com/v1beta';
const TIMEOUT_DEFECTO_MS = 60_000;

/** Forma mínima de la respuesta `:predict` de Imagen que nos interesa. */
interface ImagenResponse {
  predictions?: { bytesBase64Encoded?: unknown; mimeType?: unknown }[];
}

/**
 * Generador de imágenes contra **Gemini/Imagen** (US-59). Llama al endpoint REST
 * `POST {baseUrl}/models/{model}:predict` con la API key en la cabecera
 * `x-goog-api-key`, body `{instances:[{prompt}], parameters:{sampleCount:1}}`, y
 * devuelve la primera predicción como **data URL** (`data:<mime>;base64,...`).
 *
 * Es **best-effort**: ante cualquier fallo (red, timeout, HTTP, JSON inválido o
 * respuesta sin imagen) registra un aviso y **devuelve `null`** en vez de lanzar,
 * para no romper la creación del cuento/actividad. La app cae entonces al respaldo
 * local empaquetado.
 *
 * Cumplimiento (C-5): el `prompt` lo construye el llamador a partir de
 * tema/estilo/título, **sin** el nombre del niño ni identificadores.
 */
export class GeminiImageProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly logger?: AILogger;

  constructor(options: GeminiImageProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? MODELO_DEFECTO;
    this.baseUrl = (options.baseUrl ?? BASE_URL_DEFECTO).replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? TIMEOUT_DEFECTO_MS;
    this.fetchFn = options.fetchFn ?? fetch;
    this.logger = options.logger;
  }

  /** Genera una imagen para `prompt`; devuelve una data URL o `null` si no se pudo. */
  async generateImage(prompt: string): Promise<string | null> {
    try {
      const res = await this.fetchFn(`${this.baseUrl}/models/${this.model}:predict`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) {
        throw new Error(`Imagen respondió ${res.status} ${res.statusText}.`);
      }
      const payload = (await res.json()) as ImagenResponse;
      const prediction = payload.predictions?.[0];
      const bytes = prediction?.bytesBase64Encoded;
      if (typeof bytes !== 'string' || bytes === '') {
        throw new Error('Respuesta de Imagen sin imagen en base64.');
      }
      const mime = typeof prediction?.mimeType === 'string' ? prediction.mimeType : 'image/png';
      return `data:${mime};base64,${bytes}`;
    } catch (error) {
      this.logger?.warn(
        { error: error instanceof Error ? error.message : String(error), op: 'generateImage' },
        'La generación de imagen con Gemini/Imagen falló; se usará el respaldo local.',
      );
      return null;
    }
  }
}
