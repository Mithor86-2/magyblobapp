import { DomainError } from '../errors.js';
import { esParentesco, type Parentesco } from '../vocabulary.js';

/** Registro del consentimiento parental (ver Docs/cumplimiento-menores.md). */
export interface Consentimiento {
  readonly dado: boolean;
  readonly fecha: Date;
  readonly version: string;
}

export interface GuardianProps {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  parentesco: Parentesco;
  telefono?: string;
  consentimiento: Consentimiento;
  creadoEn: Date;
}

/**
 * Adulto responsable. Todo ChildProfile cuelga de un Guardian, que es quien presta
 * el consentimiento (los niños 2-6 son menores de 14/13 y no pueden consentir).
 */
export class Guardian {
  readonly id: string;
  readonly nombre: string;
  readonly apellidos: string;
  readonly email: string;
  readonly parentesco: Parentesco;
  readonly telefono?: string;
  readonly consentimiento: Consentimiento;
  readonly creadoEn: Date;

  constructor(props: GuardianProps) {
    if (props.nombre.trim() === '') throw new DomainError('El nombre del adulto es obligatorio.');
    if (props.apellidos.trim() === '')
      throw new DomainError('Los apellidos del adulto son obligatorios.');
    if (!Guardian.emailValido(props.email))
      throw new DomainError(`Email inválido: "${props.email}".`);
    if (!esParentesco(props.parentesco))
      throw new DomainError(`Parentesco inválido: "${props.parentesco}".`);

    this.id = props.id;
    this.nombre = props.nombre;
    this.apellidos = props.apellidos;
    this.email = props.email;
    this.parentesco = props.parentesco;
    this.telefono = props.telefono;
    this.consentimiento = props.consentimiento;
    this.creadoEn = props.creadoEn;
  }

  /** ¿El adulto ha otorgado el consentimiento? Requisito para crear perfiles. */
  haConsentido(): boolean {
    return this.consentimiento.dado;
  }

  private static emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
