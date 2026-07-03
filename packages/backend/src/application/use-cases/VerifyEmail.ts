import {
  DomainError,
  NotFoundError,
  TooManyRequestsError,
  VerificationCodeError,
} from '../../domain/errors.js';
import type { GuardianRepository } from '../../domain/repositories/GuardianRepository.js';
import type { EmailVerificationRepository } from '../../domain/repositories/EmailVerificationRepository.js';
import type { PasswordHasher } from '../../domain/auth/PasswordHasher.js';
import type { Clock } from '../ports.js';
import type { GuardianOutput, VerifyEmailInput } from '../dto.js';

export interface VerifyEmailDeps {
  guardians: GuardianRepository;
  verifications: EmailVerificationRepository;
  /** Reutiliza el hasher de contraseñas (bcrypt) para comparar el OTP en tiempo constante. */
  hasher: PasswordHasher;
  now: Clock;
  /** Máximo de intentos fallidos antes de exigir reenvío (de `config.email.otp.maxIntentos`). */
  maxIntentos: number;
}

/**
 * Valida el código OTP de verificación de email (US-93). Si el código es correcto y
 * está vigente, marca el email del guardián como verificado y devuelve sus datos
 * (la ruta emite entonces la sesión JWT). Distingue los fallos:
 * caducado/incorrecto → `VerificationCodeError` (400); intentos agotados →
 * `TooManyRequestsError` (429); sin verificación pendiente → `NotFoundError` (404).
 * Nunca revela el código ni cuántos intentos quedan.
 */
export class VerifyEmail {
  constructor(private readonly deps: VerifyEmailDeps) {}

  async execute(input: VerifyEmailInput): Promise<GuardianOutput> {
    const guardian = await this.deps.guardians.findById(input.guardianId);
    if (!guardian) {
      throw new NotFoundError('No existe la cuenta a verificar.');
    }

    const verificacion = await this.deps.verifications.buscarPorGuardian(input.guardianId);
    if (!verificacion) {
      throw new NotFoundError('No hay una verificación pendiente para esta cuenta.');
    }
    if (verificacion.estaVerificado()) {
      throw new DomainError('Este email ya ha sido verificado.');
    }
    if (verificacion.estaExpirado(this.deps.now())) {
      throw new VerificationCodeError('El código ha caducado. Solicita uno nuevo.');
    }
    if (verificacion.superaIntentos(this.deps.maxIntentos)) {
      throw new TooManyRequestsError('Demasiados intentos. Solicita un código nuevo.');
    }

    const coincide = await this.deps.hasher.verify(input.codigo, verificacion.codigoHash);
    if (!coincide) {
      await this.deps.verifications.guardar(verificacion.conIntentoFallido());
      throw new VerificationCodeError('El código no es correcto.');
    }

    await this.deps.guardians.marcarEmailVerificado(input.guardianId);
    await this.deps.verifications.guardar(verificacion.marcarVerificado(this.deps.now()));

    return {
      id: guardian.id,
      nombre: guardian.nombre,
      apellidos: guardian.apellidos,
      email: guardian.email,
      parentesco: guardian.parentesco,
      consentimientoDado: guardian.haConsentido(),
      emailVerificado: true,
    };
  }
}
