import { Guardian } from '../../domain/entities/Guardian.js';
import { ConflictError, DomainError } from '../../domain/errors.js';
import type { GuardianRepository } from '../../domain/repositories/GuardianRepository.js';
import type { Clock, IdGenerator } from '../ports.js';
import type { GuardianOutput, RegisterGuardianInput } from '../dto.js';

export interface RegisterGuardianDeps {
  guardians: GuardianRepository;
  newId: IdGenerator;
  now: Clock;
}

/**
 * Da de alta al adulto responsable y registra su consentimiento. Es el paso previo
 * obligatorio a crear perfiles de niños (ver Docs/cumplimiento-menores.md).
 */
export class RegisterGuardian {
  constructor(private readonly deps: RegisterGuardianDeps) {}

  async execute(input: RegisterGuardianInput): Promise<GuardianOutput> {
    if (!input.consentimientoAceptado) {
      throw new DomainError('Hay que aceptar el consentimiento para registrarse.');
    }

    const existente = await this.deps.guardians.findByEmail(input.email);
    if (existente) {
      throw new ConflictError(`Ya existe una cuenta con el email "${input.email}".`);
    }

    const guardian = new Guardian({
      id: this.deps.newId(),
      nombre: input.nombre,
      apellidos: input.apellidos,
      email: input.email,
      parentesco: input.parentesco,
      telefono: input.telefono,
      consentimiento: {
        dado: true,
        fecha: this.deps.now(),
        version: input.consentimientoVersion,
      },
      creadoEn: this.deps.now(),
    });

    await this.deps.guardians.save(guardian);

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
