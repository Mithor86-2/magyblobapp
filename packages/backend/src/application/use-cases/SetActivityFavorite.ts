import { NotFoundError } from '../../domain/errors.js';
import type { ActivityRepository } from '../../domain/repositories/ActivityRepository.js';
import type { ActivityOutput, SetActivityFavoriteRequest } from '../dto.js';
import { toActivityOutput } from '../mappers.js';

export interface SetActivityFavoriteDeps {
  activities: ActivityRepository;
}

/** Marca o desmarca una actividad como favorita (US-63). Idempotente. */
export class SetActivityFavorite {
  constructor(private readonly deps: SetActivityFavoriteDeps) {}

  async execute(input: SetActivityFavoriteRequest): Promise<ActivityOutput> {
    const activity = await this.deps.activities.findById(input.activityId);
    if (!activity) {
      throw new NotFoundError(`No existe la actividad con id "${input.activityId}".`);
    }
    activity.marcarFavorito(input.favorito);
    await this.deps.activities.save(activity);
    return toActivityOutput(activity);
  }
}
