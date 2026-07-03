import { EmailVerification } from '../../domain/entities/EmailVerification.js';
import type { EmailVerificationRepository } from '../../domain/repositories/EmailVerificationRepository.js';
import type { EmailService } from '../../domain/services/EmailService.js';
import type { CodeGenerator } from '../../domain/services/CodeGenerator.js';
import type { PasswordHasher } from '../../domain/auth/PasswordHasher.js';
import type { Clock, IdGenerator } from '../ports.js';

export interface SendEmailVerificationDeps {
  emailService: EmailService;
  codeGenerator: CodeGenerator;
  /** Reutiliza el hasher de contraseñas (bcrypt) para hashear también el OTP. */
  hasher: PasswordHasher;
  verifications: EmailVerificationRepository;
  newId: IdGenerator;
  now: Clock;
  /** Vida del código en ms (de `config.email.otp.ttlMs`). */
  ttlMs: number;
}

/**
 * Servicio de aplicación que genera y envía un código OTP de verificación (US-93).
 * Lo comparten el alta (`RegisterGuardian`) y el reenvío (`ResendEmailVerification`):
 * genera un código de 6 dígitos, guarda solo su **hash** (nunca el código en claro)
 * con caducidad e intentos a cero, y lo envía por email. Al reemplazar la
 * verificación por `guardianId` (upsert), un reenvío invalida el código anterior.
 */
export class SendEmailVerification {
  constructor(private readonly deps: SendEmailVerificationDeps) {}

  /** Genera, persiste (hasheado) y envía un nuevo código al email del guardián. */
  async enviar(guardian: { id: string; email: string }): Promise<void> {
    const codigo = this.deps.codeGenerator.generar();
    const codigoHash = await this.deps.hasher.hash(codigo);
    const ahora = this.deps.now();

    const verificacion = new EmailVerification({
      id: this.deps.newId(),
      guardianId: guardian.id,
      codigoHash,
      expiraEn: new Date(ahora.getTime() + this.deps.ttlMs),
      intentos: 0,
      creadoEn: ahora,
    });
    await this.deps.verifications.guardar(verificacion);

    await this.deps.emailService.enviarCodigoVerificacion({ email: guardian.email, codigo });
  }
}
