import { ChildProfile } from '../../domain/entities/ChildProfile.js';
import { DomainError, NotFoundError } from '../../domain/errors.js';
import type { ChildProfileRepository } from '../../domain/repositories/ChildProfileRepository.js';
import type { GuardianRepository } from '../../domain/repositories/GuardianRepository.js';
import { Edad } from '../../domain/value-objects/Edad.js';
import { Idioma } from '../../domain/value-objects/Idioma.js';
import { esTema, type Tema } from '../../domain/vocabulary.js';
import type { Clock, IdGenerator } from '../ports.js';
import type { ChildProfileOutput, CreateChildProfileInput } from '../dto.js';

export interface CreateChildProfileDeps {
  profiles: ChildProfileRepository;
  guardians: GuardianRepository;
  newId: IdGenerator;
  now: Clock;
}

/**
 * Crea el perfil de un niño asociado a un adulto que ya ha consentido. Valida la
 * edad y el idioma vía value-objects y los intereses contra el vocabulario.
 */
export class CreateChildProfile {
  constructor(private readonly deps: CreateChildProfileDeps) {}

  async execute(input: CreateChildProfileInput): Promise<ChildProfileOutput> {
    const guardian = await this.deps.guardians.findById(input.guardianId);
    if (!guardian) {
      throw new NotFoundError(`No existe el adulto con id "${input.guardianId}".`);
    }
    if (!guardian.haConsentido()) {
      throw new DomainError('El adulto no ha otorgado el consentimiento.');
    }

    const intereses = input.intereses.map((i) => {
      if (!esTema(i)) throw new DomainError(`Interés inválido: "${i}".`);
      return i as Tema;
    });

    const profile = new ChildProfile({
      id: this.deps.newId(),
      guardianId: guardian.id,
      nombre: input.nombre,
      edad: Edad.create(input.edad),
      idioma: Idioma.create(input.idioma),
      avatar: input.avatar,
      intereses,
      creadoEn: this.deps.now(),
    });

    await this.deps.profiles.save(profile);

    return {
      id: profile.id,
      guardianId: profile.guardianId,
      nombre: profile.nombre,
      edad: profile.edad.value,
      idioma: profile.idioma.value,
      avatar: profile.avatar,
      intereses: [...profile.intereses],
    };
  }
}
