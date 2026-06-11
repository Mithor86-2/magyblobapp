import type { AIProvider } from '../../domain/ai/AIProvider.js';
import { Story } from '../../domain/entities/Story.js';
import { DomainError } from '../../domain/errors.js';
import type { ChildProfileRepository } from '../../domain/repositories/ChildProfileRepository.js';
import { esEstilo, esTema, type Estilo, type Tema } from '../../domain/vocabulary.js';
import type { Clock, IdGenerator } from '../ports.js';
import type { GenerateStoryRequest, StoryOutput } from '../dto.js';

export interface GenerateStoryDeps {
  profiles: ChildProfileRepository;
  ai: AIProvider;
  newId: IdGenerator;
  now: Clock;
}

/**
 * Genera un cuento para un perfil delegando en `AIProvider` (cuya implementación
 * concreta llega en la Fase 2). El cuento sale en el idioma del perfil. La
 * persistencia del cuento se conecta en la Fase 3.
 */
export class GenerateStory {
  constructor(private readonly deps: GenerateStoryDeps) {}

  async execute(input: GenerateStoryRequest): Promise<StoryOutput> {
    if (!esTema(input.tema)) throw new DomainError(`Tema inválido: "${input.tema}".`);
    if (!esEstilo(input.estilo)) throw new DomainError(`Estilo inválido: "${input.estilo}".`);
    const tema: Tema = input.tema;
    const estilo: Estilo = input.estilo;

    const perfil = await this.deps.profiles.findById(input.profileId);
    if (!perfil) {
      throw new DomainError(`No existe el perfil con id "${input.profileId}".`);
    }

    const generado = await this.deps.ai.generateStory({ perfil, tema, estilo });

    const story = new Story({
      id: this.deps.newId(),
      profileId: perfil.id,
      tema,
      estilo,
      titulo: generado.titulo,
      cuerpo: generado.cuerpo,
      idioma: perfil.idioma.value,
      estado: 'nuevo',
      creadoEn: this.deps.now(),
    });

    return {
      id: story.id,
      profileId: story.profileId,
      tema: story.tema,
      estilo: story.estilo,
      titulo: story.titulo,
      cuerpo: story.cuerpo,
      idioma: story.idioma,
      estado: story.estado,
    };
  }
}
