import type { Story } from '../entities/Story.js';

/** Puerto de persistencia de cuentos. Implementación en infraestructura. */
export interface StoryRepository {
  save(story: Story): Promise<void>;
  findById(id: string): Promise<Story | null>;
  /** Cuentos de un perfil, del más reciente al más antiguo. */
  findByProfile(profileId: string): Promise<Story[]>;
}
