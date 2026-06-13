import type { AIProvider } from '../../domain/ai/AIProvider.js';
import { Story } from '../../domain/entities/Story.js';
import { DomainError, NotFoundError } from '../../domain/errors.js';
import type { ChildProfileRepository } from '../../domain/repositories/ChildProfileRepository.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import { esEstilo, esTema, type Estilo, type Tema } from '../../domain/vocabulary.js';
import type { Clock, IdGenerator } from '../ports.js';
import type { GenerateStoryRequest, StoryOutput } from '../dto.js';
import { toStoryOutput } from '../mappers.js';

export interface GenerateStoryDeps {
  profiles: ChildProfileRepository;
  stories: StoryRepository;
  ai: AIProvider;
  newId: IdGenerator;
  now: Clock;
}

/**
 * Genera un cuento para un perfil delegando en `AIProvider`, lo persiste y lo
 * devuelve. El cuento sale en el idioma del perfil.
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
      throw new NotFoundError(`No existe el perfil con id "${input.profileId}".`);
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
      proveedor: generado.proveedor,
      estado: 'nuevo',
      creadoEn: this.deps.now(),
    });

    await this.deps.stories.save(story);

    return toStoryOutput(story);
  }
}
