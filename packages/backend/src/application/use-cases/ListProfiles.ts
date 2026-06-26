import type { ChildProfile } from '../../domain/entities/ChildProfile.js';
import type { ChildProfileRepository } from '../../domain/repositories/ChildProfileRepository.js';
import type { ChildProfileOutput, ListProfilesInput } from '../dto.js';

export interface ListProfilesDeps {
  profiles: ChildProfileRepository;
}

/** Lista los perfiles que tutela un adulto (soporte multi-niño). */
export class ListProfiles {
  constructor(private readonly deps: ListProfilesDeps) {}

  async execute(input: ListProfilesInput): Promise<ChildProfileOutput[]> {
    const profiles = await this.deps.profiles.findByGuardian(input.guardianId);
    return profiles.map(ListProfiles.toOutput);
  }

  private static toOutput(profile: ChildProfile): ChildProfileOutput {
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
