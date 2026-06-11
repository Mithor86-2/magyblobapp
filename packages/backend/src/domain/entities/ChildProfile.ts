import { DomainError } from '../errors.js';
import { esTema, type Tema } from '../vocabulary.js';
import type { Edad } from '../value-objects/Edad.js';
import type { Idioma } from '../value-objects/Idioma.js';

export interface ChildProfileProps {
  id: string;
  guardianId: string;
  nombre: string;
  edad: Edad;
  idioma: Idioma;
  avatar: string;
  intereses: Tema[];
  creadoEn: Date;
}

/**
 * Perfil de un niño. Pertenece a un Guardian (`guardianId`). Sus intereses
 * pertenecen al vocabulario único de temática y pre-seleccionan el tema del cuento.
 */
export class ChildProfile {
  readonly id: string;
  readonly guardianId: string;
  readonly nombre: string;
  readonly edad: Edad;
  readonly idioma: Idioma;
  readonly avatar: string;
  readonly intereses: readonly Tema[];
  readonly creadoEn: Date;

  constructor(props: ChildProfileProps) {
    if (props.nombre.trim() === '') throw new DomainError('El nombre del niño es obligatorio.');
    if (props.avatar.trim() === '') throw new DomainError('Hay que elegir un avatar.');
    if (props.intereses.length === 0) throw new DomainError('Hay que elegir al menos un interés.');
    for (const interes of props.intereses) {
      if (!esTema(interes)) throw new DomainError(`Interés inválido: "${interes}".`);
    }

    this.id = props.id;
    this.guardianId = props.guardianId;
    this.nombre = props.nombre;
    this.edad = props.edad;
    this.idioma = props.idioma;
    this.avatar = props.avatar;
    this.intereses = [...props.intereses];
    this.creadoEn = props.creadoEn;
  }
}
