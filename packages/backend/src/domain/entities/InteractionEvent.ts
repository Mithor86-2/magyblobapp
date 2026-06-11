import { DomainError } from '../errors.js';
import { esTipoEvento, type TipoEvento } from '../vocabulary.js';

export interface InteractionEventProps {
  id: string;
  profileId: string;
  tipo: TipoEvento;
  /** Datos del evento. NUNCA debe contener PII (ver Docs/cumplimiento-menores.md). */
  payload?: Record<string, unknown>;
  creadoEn: Date;
}

/**
 * Evento de uso de primera parte. El niño se referencia por `profileId` interno
 * (pseudónimo); jamás alimenta analítica/publicidad de terceros ni identificadores
 * de dispositivo. El `payload` va sin PII.
 */
export class InteractionEvent {
  readonly id: string;
  readonly profileId: string;
  readonly tipo: TipoEvento;
  readonly payload?: Record<string, unknown>;
  readonly creadoEn: Date;

  constructor(props: InteractionEventProps) {
    if (!esTipoEvento(props.tipo))
      throw new DomainError(`Tipo de evento inválido: "${props.tipo}".`);
    if (props.profileId.trim() === '') throw new DomainError('El evento necesita un profileId.');

    this.id = props.id;
    this.profileId = props.profileId;
    this.tipo = props.tipo;
    this.payload = props.payload;
    this.creadoEn = props.creadoEn;
  }
}
