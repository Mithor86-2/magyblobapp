import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import type {
  SynthesizeInput,
  SynthesizedAudio,
  TTSProvider,
} from '../../domain/tts/TTSProvider.js';

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

  constructor(options: ElevenLabsProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.voiceIdByLang = options.voiceIdByLang;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
    if (this.apiKey === undefined || this.apiKey.trim() === '') {
      throw new Error('Falta la API key de ElevenLabs (ELEVENT_LABS_API).');
    }
    const voiceId = this.voiceIdByLang[input.idioma];

    const res = await this.fetchFn(`${BASE_URL}/${voiceId}?output_format=${OUTPUT_FORMAT}`, {
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

    if (!res.ok) {
      throw new Error(`ElevenLabs respondió ${res.status} ${res.statusText}.`);
    }

    const buffer = await res.arrayBuffer();
    const mp3 = new Uint8Array(buffer);
    if (mp3.length === 0) {
      throw new Error('ElevenLabs devolvió un audio vacío.');
    }
    return { mp3, voiceId };
  }
}
