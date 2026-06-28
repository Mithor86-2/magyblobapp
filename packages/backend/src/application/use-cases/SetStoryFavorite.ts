import { NotFoundError } from '../../domain/errors.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import type { SetStoryFavoriteRequest, StoryOutput } from '../dto.js';
import { toStoryOutput } from '../mappers.js';

export interface SetStoryFavoriteDeps {
  stories: StoryRepository;
}

/** Marca o desmarca un cuento como favorito (US-63). Idempotente. */
export class SetStoryFavorite {
  constructor(private readonly deps: SetStoryFavoriteDeps) {}

  async execute(input: SetStoryFavoriteRequest): Promise<StoryOutput> {
    const story = await this.deps.stories.findById(input.storyId);
    if (!story) {
      throw new NotFoundError(`No existe el cuento con id "${input.storyId}".`);
    }
    story.marcarFavorito(input.favorito);
    await this.deps.stories.save(story);
    return toStoryOutput(story);
  }
}
