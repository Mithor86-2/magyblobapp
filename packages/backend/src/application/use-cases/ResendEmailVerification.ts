import { DomainError, NotFoundError, TooManyRequestsError } from '../../domain/errors.js';
import type { GuardianRepository } from '../../domain/repositories/GuardianRepository.js';
import type { EmailVerificationRepository } from '../../domain/repositories/EmailVerificationRepository.js';
import type { SendEmailVerification } from '../services/SendEmailVerification.js';
import type { Clock } from '../ports.js';
import type { ResendEmailVerificationInput } from '../dto.js';

export interface ResendEmailVerificationDeps {
  guardians: GuardianRepository;
  verifications: EmailVerificationRepository;
  sender: SendEmailVerification;
  now: Clock;
  /** Cooldown mínimo entre reenvíos en ms (de `config.email.otp.resendCooldownMs`). */
  cooldownMs: number;
}

/**
 * Reenvía el código OTP de verificación (US-93) cuando el adulto no lo recibió o
 * caducó. Aplica un **cooldown** desde el último envío para no permitir spam de
 * correos. Si el email ya está verificado no reenvía (nada que hacer); si no hay
 * cuenta, `NotFoundError`. Regenera el código (invalida el anterior) y lo envía.
 */
export class ResendEmailVerification {
  constructor(private readonly deps: ResendEmailVerificationDeps) {}

  async execute(input: ResendEmailVerificationInput): Promise<void> {
    const guardian = await this.deps.guardians.findById(input.guardianId);
    if (!guardian) {
      throw new NotFoundError('No existe la cuenta.');
    }
    if (guardian.emailVerificado) {
      throw new DomainError('El email ya está verificado.');
    }

    const previa = await this.deps.verifications.buscarPorGuardian(input.guardianId);
    if (previa) {
      const transcurrido = this.deps.now().getTime() - previa.creadoEn.getTime();
      if (transcurrido < this.deps.cooldownMs) {
        throw new TooManyRequestsError('Espera un momento antes de pedir otro código.');
      }
    }

    await this.deps.sender.enviar({ id: guardian.id, email: guardian.email });
  }
}
