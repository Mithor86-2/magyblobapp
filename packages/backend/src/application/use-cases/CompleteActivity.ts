import { NotFoundError } from '../../domain/errors.js';
import type { ActivityRepository } from '../../domain/repositories/ActivityRepository.js';
import type { Clock } from '../ports.js';
import type { ActivityOutput, CompleteActivityRequest } from '../dto.js';
import { toActivityOutput } from '../mappers.js';

export interface CompleteActivityDeps {
  activities: ActivityRepository;
  now: Clock;
}

/**
 * Registra que una actividad se completó con una valoración (1-3 estrellas) (US-10).
 * La validación de la valoración la hace la entidad (`Activity.completar`).
 */
export class CompleteActivity {
  constructor(private readonly deps: CompleteActivityDeps) {}

  async execute(input: CompleteActivityRequest): Promise<ActivityOutput> {
    const activity = await this.deps.activities.findById(input.activityId);
    if (!activity) {
      throw new NotFoundError(`No existe la actividad con id "${input.activityId}".`);
    }
    activity.completar(input.valoracion, this.deps.now());
    await this.deps.activities.save(activity);
    return toActivityOutput(activity);
  }
}
