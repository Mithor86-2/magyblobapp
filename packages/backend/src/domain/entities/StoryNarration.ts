import { DomainError } from '../errors.js';
import type { CodigoIdioma } from '../value-objects/Idioma.js';

export interface StoryNarrationProps {
  id: string;
  storyId: string;
  /** MP3 sintetizado (bytes). */
  mp3: Uint8Array;
  /** Voz de ElevenLabs usada para esta narración. */
  voiceId: string;
  idioma: CodigoIdioma;
  creadoEn: Date;
}

/**
 * Narración (audio) de un cuento. Relación 1-1 con `Story`: se sintetiza una vez
 * y se cachea para reescuchar sin re-generar (ni gastar créditos). Se borra en
 * cascada con el cuento (y por tanto con el perfil → GDPR).
 */
export class StoryNarration {
  readonly id: string;
  readonly storyId: string;
  readonly mp3: Uint8Array;
  readonly voiceId: string;
  readonly idioma: CodigoIdioma;
  readonly creadoEn: Date;

  constructor(props: StoryNarrationProps) {
    if (props.mp3.length === 0) throw new DomainError('La narración no puede estar vacía.');
    if (props.voiceId.trim() === '') throw new DomainError('La narración necesita una voz.');

    this.id = props.id;
    this.storyId = props.storyId;
    this.mp3 = props.mp3;
    this.voiceId = props.voiceId;
    this.idioma = props.idioma;
    this.creadoEn = props.creadoEn;
  }
}
