import type { AIProvider } from '../../domain/ai/AIProvider.js';
import { ChildProfile } from '../../domain/entities/ChildProfile.js';
import { DomainError } from '../../domain/errors.js';
import { Edad } from '../../domain/value-objects/Edad.js';
import { Idioma } from '../../domain/value-objects/Idioma.js';
import { esEstilo, esTema } from '../../domain/vocabulary.js';
import type { AnonymousStoryOutput, GenerateStoryAnonymousRequest } from '../dto.js';

export interface GenerateStoryAnonymousDeps {
  ai: AIProvider;
}

/**
 * Genera un cuento en **modo anónimo efímero** (US-50): sin sesión, sin perfil
 * persistido y **sin guardar nada**. Recibe datos mínimos (edad, idioma, temas,
 * estilos) y construye un `ChildProfile` **transitorio** —con un nombre genérico
 * no identificativo y sin id/guardián reales— solo para reusar el `AIProvider`. El
 * perfil y el cuento se descartan al devolver la respuesta: no se crea dato de
 * menor sin consentimiento (coherente con C-1). No toca repositorios ni el modelo
 * de datos.
 */
export class GenerateStoryAnonymous {
  /** Nombre genérico no identificativo del protagonista (no es PII de un menor real). */
  private static readonly NOMBRE_GENERICO = 'el explorador';

  constructor(private readonly deps: GenerateStoryAnonymousDeps) {}

  async execute(input: GenerateStoryAnonymousRequest): Promise<AnonymousStoryOutput> {
    const temas = this.validarVocabulario(input.temas, esTema, 'tema');
    const estilos = this.validarVocabulario(input.estilos, esEstilo, 'estilo');

    // Perfil transitorio: value-objects validan edad/idioma; nombre genérico para
    // que el provider tenga a quién dirigir el cuento. No se persiste.
    const idioma = Idioma.create(input.idioma);
    const perfilEfimero = new ChildProfile({
      id: 'anon',
      guardianId: 'anon',
      nombre: GenerateStoryAnonymous.NOMBRE_GENERICO,
      edad: Edad.create(input.edad),
      idioma,
      avatar: 'anon',
      intereses: [temas[0]!],
      creadoEn: new Date(0),
    });

    const generado = await this.deps.ai.generateStory({ perfil: perfilEfimero, temas, estilos });

    return {
      tema: temas[0]!,
      estilo: estilos[0]!,
      titulo: generado.titulo,
      cuerpo: generado.cuerpo,
      idioma: idioma.value,
      proveedor: generado.proveedor,
    };
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
