import type { AIProvider } from '../../domain/ai/AIProvider.js';
import { Story } from '../../domain/entities/Story.js';
import { DomainError, NotFoundError } from '../../domain/errors.js';
import type { ChildProfileRepository } from '../../domain/repositories/ChildProfileRepository.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import { esEstilo, esTema } from '../../domain/vocabulary.js';
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
    // US-47: tema/estilo son listas (multi-selección). Se valida ≥1 elemento, sin
    // duplicados y todos dentro del vocabulario cerrado.
    const temas = this.validarVocabulario(input.temas, esTema, 'tema');
    const estilos = this.validarVocabulario(input.estilos, esEstilo, 'estilo');

    const perfil = await this.deps.profiles.findById(input.profileId);
    if (!perfil) {
      throw new NotFoundError(`No existe el perfil con id "${input.profileId}".`);
    }

    const generado = await this.deps.ai.generateStory({ perfil, temas, estilos });

    // Persistencia sin migración (decisión del lote): `Story` conserva las columnas
    // singulares `tema`/`estilo`; se guarda el primero de cada lista como valor
    // representativo de la selección.
    const story = new Story({
      id: this.deps.newId(),
      profileId: perfil.id,
      tema: temas[0]!,
      estilo: estilos[0]!,
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

  /**
   * Valida una lista de selección múltiple contra un vocabulario cerrado: no vacía,
   * sin duplicados y con todos sus elementos válidos. Devuelve la lista tipada.
   */
  private validarVocabulario<T extends string>(
    valores: string[],
    esValido: (v: string) => v is T,
    nombre: 'tema' | 'estilo',
  ): T[] {
    if (!Array.isArray(valores) || valores.length === 0) {
      throw new DomainError(`Hay que elegir al menos un ${nombre}.`);
    }
    if (new Set(valores).size !== valores.length) {
      throw new DomainError(`No se admiten ${nombre}s duplicados.`);
    }
    for (const v of valores) {
      if (!esValido(v))
        throw new DomainError(`${nombre === 'tema' ? 'Tema' : 'Estilo'} inválido: "${v}".`);
    }
    return valores as T[];
  }
}
