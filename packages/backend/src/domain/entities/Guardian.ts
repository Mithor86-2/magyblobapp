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
  /**
   * Hash de la contraseña (US-48). El dominio guarda solo el hash derivado por el
   * `PasswordHasher`; **nunca** la contraseña en claro. La validación de robustez
   * (longitud mínima) ocurre antes de hashear, en el caso de uso / la frontera HTTP.
   */
  passwordHash: string;
  consentimiento: Consentimiento;
  /**
   * Titularidad del email verificada por OTP (US-93). Por defecto `false`: con SMTP
   * configurado, pasa a `true` al validar el código; sin SMTP el alta lo pone `true`
   * (verificación omitida). Opcional en los props por retrocompatibilidad.
   */
  emailVerificado?: boolean;
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
  readonly passwordHash: string;
  readonly consentimiento: Consentimiento;
  readonly emailVerificado: boolean;
  readonly creadoEn: Date;

  constructor(props: GuardianProps) {
    const email = Guardian.normalizarEmail(props.email);
    if (props.nombre.trim() === '') throw new DomainError('El nombre del adulto es obligatorio.');
    if (props.apellidos.trim() === '')
      throw new DomainError('Los apellidos del adulto son obligatorios.');
    if (!Guardian.emailValido(email)) throw new DomainError(`Email inválido: "${props.email}".`);
    if (!esParentesco(props.parentesco))
      throw new DomainError(`Parentesco inválido: "${props.parentesco}".`);
    if (props.passwordHash.trim() === '')
      throw new DomainError('El hash de la contraseña es obligatorio.');

    this.id = props.id;
    this.nombre = props.nombre;
    this.apellidos = props.apellidos;
    this.email = email;
    this.parentesco = props.parentesco;
    this.telefono = props.telefono;
    this.passwordHash = props.passwordHash;
    this.consentimiento = props.consentimiento;
    this.emailVerificado = props.emailVerificado ?? false;
    this.creadoEn = props.creadoEn;
  }

  /** ¿El adulto ha otorgado el consentimiento? Requisito para crear perfiles. */
  haConsentido(): boolean {
    return this.consentimiento.dado;
  }

  /** Copia del guardián con el email marcado como verificado (US-93). */
  conEmailVerificado(): Guardian {
    return new Guardian({ ...this, consentimiento: this.consentimiento, emailVerificado: true });
  }

  /**
   * Forma canónica del email (recorte + minúsculas) para que el alta y el login
   * (y la unicidad por email) casen aunque el adulto teclee mayúsculas o espacios.
   */
  static normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private static emailValido(email: string): boolean {
    // Patrón anclado (^…$) con un único `\.` literal: el backtracking es lineal en la
    // práctica y el email se normaliza y tiene longitud acotada (no hay ReDoS catastrófico).
    // eslint-disable-next-line sonarjs/super-linear-regex -- formato básico, sin riesgo real de ReDoS
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
