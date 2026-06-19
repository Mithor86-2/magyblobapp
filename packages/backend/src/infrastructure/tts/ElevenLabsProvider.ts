import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import type {
  SynthesizeInput,
  SynthesizedAudio,
  TTSProvider,
} from '../../domain/tts/TTSProvider.js';

/** Logger mínimo (estructural) para trazas; en producción es el pino de Fastify. */
export interface TTSLogger {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
}

export interface ElevenLabsProviderOptions {
  /** `xi-api-key`. Si falta, `synthesize` lanza (la app degrada a voz nativa). */
  apiKey: string | undefined;
  /** Modelo de síntesis (por defecto `eleven_multilingual_v2`). */
  model: string;
  /** Voz por idioma. ES/EN comparten modelo multilingüe; cambia la voz. */
  voiceIdByLang: Record<CodigoIdioma, string>;
  /** Aborta la petición si ElevenLabs tarda más de esto (ms). */
  timeoutMs?: number;
  /** Inyectable en tests; por defecto el `fetch` global de Node. */
  fetchFn?: typeof fetch;
  /** Trazas de la síntesis (qué se envía a ElevenLabs y qué responde). Opcional. */
  logger?: TTSLogger;
}

const BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
/** Formato pedido por query: MP3 44.1 kHz / 128 kbps. */
const OUTPUT_FORMAT = 'mp3_44100_128';

/**
 * Síntesis de voz contra ElevenLabs (`POST /v1/text-to-speech/{voice_id}`). La
 * `xi-api-key` vive solo aquí (backend como proxy); el binario MP3 se devuelve
 * como `Uint8Array`. Lanza ante clave ausente, error HTTP o timeout: el caso de
 * uso propaga el fallo y la app narra con la voz nativa del dispositivo.
 */
export class ElevenLabsProvider implements TTSProvider {
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly voiceIdByLang: Record<CodigoIdioma, string>;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly logger?: TTSLogger;

  constructor(options: ElevenLabsProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.voiceIdByLang = options.voiceIdByLang;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchFn = options.fetchFn ?? fetch;
    this.logger = options.logger;
  }

  async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
    if (this.apiKey === undefined || this.apiKey.trim() === '') {
      this.logger?.warn(
        { proveedor: 'elevenlabs' },
        'TTS: falta ELEVENT_LABS_API; la app usará la voz nativa.',
      );
      throw new Error('Falta la API key de ElevenLabs (ELEVENT_LABS_API).');
    }
    const voiceId = this.voiceIdByLang[input.idioma];

    // Qué se envía a ElevenLabs (sin volcar el texto íntegro: solo tamaño + extracto).
    this.logger?.info(
      {
        proveedor: 'elevenlabs',
        voiceId,
        model: this.model,
        idioma: input.idioma,
        textoChars: input.texto.length,
        textoPreview: input.texto.slice(0, 80),
      },
      'TTS: solicitando síntesis a ElevenLabs',
    );

    const inicio = Date.now();
    let res: Response;
    try {
      res = await this.fetchFn(`${BASE_URL}/${voiceId}?output_format=${OUTPUT_FORMAT}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'content-type': 'application/json',
          accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: input.texto,
          model_id: this.model,
          language_code: input.idioma,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      this.logger?.warn(
        { proveedor: 'elevenlabs', voiceId, error: descripcion(error) },
        'TTS: ElevenLabs no respondió (red/timeout); se usará la voz nativa.',
      );
      throw error;
    }

    if (!res.ok) {
      // ElevenLabs devuelve el detalle del error como JSON/texto en el cuerpo.
      const detalle = await res.text().catch(() => '');
      this.logger?.warn(
        { proveedor: 'elevenlabs', voiceId, status: res.status, detalle: detalle.slice(0, 300) },
        'TTS: ElevenLabs respondió con error; se usará la voz nativa.',
      );
      throw new Error(`ElevenLabs respondió ${res.status} ${res.statusText}.`);
    }

    const buffer = await res.arrayBuffer();
    const mp3 = new Uint8Array(buffer);
    if (mp3.length === 0) {
      this.logger?.warn(
        { proveedor: 'elevenlabs', voiceId },
        'TTS: ElevenLabs devolvió audio vacío.',
      );
      throw new Error('ElevenLabs devolvió un audio vacío.');
    }

    // Qué respondió ElevenLabs.
    this.logger?.info(
      {
        proveedor: 'elevenlabs',
        voiceId,
        status: res.status,
        bytes: mp3.length,
        ms: Date.now() - inicio,
      },
      'TTS: ElevenLabs devolvió el audio',
    );
    return { mp3, voiceId };
  }
}

function descripcion(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
