import { NotFoundError } from '../../domain/errors.js';
import type { GuardianRepository } from '../../domain/repositories/GuardianRepository.js';
import type { GuardianOutput, LoginGuardianInput } from '../dto.js';

export interface LoginGuardianDeps {
  guardians: GuardianRepository;
}

/**
 * Identifica al adulto por su email (login ligero, sin contraseña: la autenticación
 * robusta queda fuera del alcance del TFM, ver Docs/historias-usuario/epic-a-perfil.md).
 * Lanza NotFoundError si no existe una cuenta con ese email.
 */
export class LoginGuardian {
  constructor(private readonly deps: LoginGuardianDeps) {}

  async execute(input: LoginGuardianInput): Promise<GuardianOutput> {
    const guardian = await this.deps.guardians.findByEmail(input.email);
    if (!guardian) {
      throw new NotFoundError(`No hay ninguna cuenta con el email "${input.email}".`);
    }

    return {
      id: guardian.id,
      nombre: guardian.nombre,
      apellidos: guardian.apellidos,
      email: guardian.email,
      parentesco: guardian.parentesco,
      consentimientoDado: guardian.haConsentido(),
    };
  }
}
