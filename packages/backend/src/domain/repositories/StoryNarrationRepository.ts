import type { StoryNarration } from '../entities/StoryNarration.js';

/** Puerto de persistencia de narraciones (caché de audio). Impl en infraestructura. */
export interface StoryNarrationRepository {
  /** Narración cacheada de un cuento, o `null` si aún no se ha sintetizado. */
  findByStory(storyId: string): Promise<StoryNarration | null>;
  save(narration: StoryNarration): Promise<void>;
}
