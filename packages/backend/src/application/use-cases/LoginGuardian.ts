import { Guardian } from '../../domain/entities/Guardian.js';
import { InvalidCredentialsError } from '../../domain/errors.js';
import type { GuardianRepository } from '../../domain/repositories/GuardianRepository.js';
import type { PasswordHasher } from '../../domain/auth/PasswordHasher.js';
import type { GuardianOutput, LoginGuardianInput } from '../dto.js';

export interface LoginGuardianDeps {
  guardians: GuardianRepository;
  hasher: PasswordHasher;
}

/**
 * Inicia sesión del adulto verificando **email + contraseña** (US-48): normaliza el
 * email, busca la cuenta y compara la contraseña contra su `passwordHash` mediante el
 * `PasswordHasher`. Revierte la antigua "identificación ligera por email sin
 * contraseña" (ver Docs/cumplimiento-menores.md, C-1/C-10).
 *
 * Ante credenciales inválidas lanza un `InvalidCredentialsError` (HTTP 401) **genérico**
 * que NO distingue entre email inexistente y contraseña errónea, para no filtrar qué
 * emails están registrados. La contraseña en claro nunca se registra en logs.
 */
export class LoginGuardian {
  constructor(private readonly deps: LoginGuardianDeps) {}

  async execute(input: LoginGuardianInput): Promise<GuardianOutput> {
    const email = Guardian.normalizarEmail(input.email);
    const guardian = await this.deps.guardians.findByEmail(email);

    // Mismo error tanto si el email no existe como si la contraseña no casa.
    if (!guardian) {
      throw new InvalidCredentialsError();
    }

    const coincide = await this.deps.hasher.verify(input.password, guardian.passwordHash);
    if (!coincide) {
      throw new InvalidCredentialsError();
    }

    return {
      id: guardian.id,
      nombre: guardian.nombre,
      apellidos: guardian.apellidos,
      email: guardian.email,
      parentesco: guardian.parentesco,
      consentimientoDado: guardian.haConsentido(),
      emailVerificado: guardian.emailVerificado,
    };
  }
}
