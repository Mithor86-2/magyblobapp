import { NotFoundError } from '../../domain/errors.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import type { MarkStoryReadRequest, StoryOutput } from '../dto.js';
import { toStoryOutput } from '../mappers.js';

export interface MarkStoryReadDeps {
  stories: StoryRepository;
}

/** Marca un cuento como leído (US-07). El progreso es estado de la propia entidad. */
export class MarkStoryRead {
  constructor(private readonly deps: MarkStoryReadDeps) {}

  async execute(input: MarkStoryReadRequest): Promise<StoryOutput> {
    const story = await this.deps.stories.findById(input.storyId);
    if (!story) {
      throw new NotFoundError(`No existe el cuento con id "${input.storyId}".`);
    }
    story.marcarLeido();
    await this.deps.stories.save(story);
    return toStoryOutput(story);
  }
}
