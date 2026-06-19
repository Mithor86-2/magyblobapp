import type { CodigoIdioma } from '../value-objects/Idioma.js';

export interface SynthesizeInput {
  /** Texto a narrar (el cuerpo del cuento). */
  texto: string;
  /** Idioma del cuento; selecciona la voz adecuada. */
  idioma: CodigoIdioma;
}

/** Audio sintetizado: MP3 crudo más la voz usada (para trazabilidad/caché). */
export interface SynthesizedAudio {
  /** MP3 como bytes; el dominio no conoce `Buffer` (Node) → `Uint8Array`. */
  mp3: Uint8Array;
  voiceId: string;
}

/**
 * Puerto de síntesis de voz (text-to-speech). Una sola interfaz, espejo del
 * `AIProvider`: la implementación real (ElevenLabs) vive en infraestructura y la
 * `xi-api-key` nunca sale del backend (proxy). Si la síntesis falla, el caso de
 * uso propaga el error y la **app** degrada a la voz nativa del dispositivo.
 */
export interface TTSProvider {
  synthesize(input: SynthesizeInput): Promise<SynthesizedAudio>;
}
