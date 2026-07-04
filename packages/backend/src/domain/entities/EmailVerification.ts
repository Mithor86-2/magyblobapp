import { DomainError } from '../errors.js';

export interface EmailVerificationProps {
  id: string;
  guardianId: string;
  /** Hash bcrypt del código OTP; el dominio nunca ve el código en claro. */
  codigoHash: string;
  expiraEn: Date;
  intentos: number;
  verificadoEn?: Date;
  creadoEn: Date;
}

/**
 * Verificación de titularidad del email por OTP (US-93). Estado transitorio de
 * seguridad 1-1 con un `Guardian`. Es **inmutable**: los cambios de estado (un
 * intento fallido, el consumo) devuelven una copia nueva, coherente con el resto
 * de entidades del dominio.
 *
 * Guarda solo el **hash** del código (nunca el código en claro). Las políticas de
 * caducidad y de intentos máximos son parámetros de configuración: la entidad
 * expone los predicados (`estaExpirado`, `superaIntentos`) y el caso de uso decide
 * con los valores del `config`.
 */
export class EmailVerification {
  readonly id: string;
  readonly guardianId: string;
  readonly codigoHash: string;
  readonly expiraEn: Date;
  readonly intentos: number;
  readonly verificadoEn?: Date;
  readonly creadoEn: Date;

  constructor(props: EmailVerificationProps) {
    if (props.codigoHash.trim() === '')
      throw new DomainError('El hash del código de verificación es obligatorio.');
    if (props.intentos < 0) throw new DomainError('Los intentos no pueden ser negativos.');

    this.id = props.id;
    this.guardianId = props.guardianId;
    this.codigoHash = props.codigoHash;
    this.expiraEn = props.expiraEn;
    this.intentos = props.intentos;
    this.verificadoEn = props.verificadoEn;
    this.creadoEn = props.creadoEn;
  }

  /** ¿El código ha caducado respecto al instante dado? */
  estaExpirado(ahora: Date): boolean {
    return ahora.getTime() >= this.expiraEn.getTime();
  }

  /** ¿Ya se consumió (el email quedó verificado)? */
  estaVerificado(): boolean {
    return this.verificadoEn !== undefined;
  }

  /** ¿Se ha alcanzado el máximo de intentos fallidos permitidos? */
  superaIntentos(maxIntentos: number): boolean {
    return this.intentos >= maxIntentos;
  }

  /** Copia con un intento fallido más (tras un código incorrecto). */
  conIntentoFallido(): EmailVerification {
    return new EmailVerification({ ...this, intentos: this.intentos + 1 });
  }

  /** Copia marcada como verificada en el instante dado (consumo del código). */
  marcarVerificado(ahora: Date): EmailVerification {
    return new EmailVerification({ ...this, verificadoEn: ahora });
  }
}
