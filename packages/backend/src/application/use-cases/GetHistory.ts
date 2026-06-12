import type { ActivityRepository } from '../../domain/repositories/ActivityRepository.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import type { GetHistoryRequest, HistoryOutput } from '../dto.js';
import { toActivityOutput, toStoryOutput } from '../mappers.js';

export interface GetHistoryDeps {
  stories: StoryRepository;
  activities: ActivityRepository;
}

/**
 * Devuelve el historial de un perfil: sus cuentos y actividades, cada lista
 * ordenada por fecha descendente (lo aportan los repositorios).
 */
export class GetHistory {
  constructor(private readonly deps: GetHistoryDeps) {}

  async execute(input: GetHistoryRequest): Promise<HistoryOutput> {
    const [stories, activities] = await Promise.all([
      this.deps.stories.findByProfile(input.profileId),
      this.deps.activities.findByProfile(input.profileId),
    ]);
    return {
      stories: stories.map(toStoryOutput),
      activities: activities.map(toActivityOutput),
    };
  }
}
