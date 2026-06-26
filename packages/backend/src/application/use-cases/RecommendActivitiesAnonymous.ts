import type { AIProvider } from '../../domain/ai/AIProvider.js';
import { ChildProfile } from '../../domain/entities/ChildProfile.js';
import { DomainError } from '../../domain/errors.js';
import { Edad } from '../../domain/value-objects/Edad.js';
import { Idioma } from '../../domain/value-objects/Idioma.js';
import { CATEGORIAS, type Categoria } from '../../domain/vocabulary.js';
import type { AnonymousActivityOutput, RecommendActivitiesAnonymousRequest } from '../dto.js';

export interface RecommendActivitiesAnonymousDeps {
  ai: AIProvider;
}

const CANTIDAD_POR_DEFECTO = 3;

/**
 * Recomienda actividades en **modo anónimo efímero** (US-50): sin sesión, sin
 * perfil persistido y **sin guardar nada**. Recibe datos mínimos (edad, idioma,
 * categoría, cantidad) y construye un `ChildProfile` **transitorio** —nombre
 * genérico no identificativo, sin id/guardián reales— solo para reusar el
 * `AIProvider`. Las actividades se devuelven y se descartan: no se crea dato de
 * menor sin consentimiento (coherente con C-1). No toca repositorios.
 */
export class RecommendActivitiesAnonymous {
  /** Nombre genérico no identificativo (no es PII de un menor real). */
  private static readonly NOMBRE_GENERICO = 'el explorador';

  constructor(private readonly deps: RecommendActivitiesAnonymousDeps) {}

  async execute(input: RecommendActivitiesAnonymousRequest): Promise<AnonymousActivityOutput[]> {
    let categoria: Categoria | undefined;
    if (input.categoria !== undefined) {
      if (!(CATEGORIAS as readonly string[]).includes(input.categoria)) {
        throw new DomainError(`Categoría inválida: "${input.categoria}".`);
      }
      categoria = input.categoria as Categoria;
    }

    const perfilEfimero = new ChildProfile({
      id: 'anon',
      guardianId: 'anon',
      nombre: RecommendActivitiesAnonymous.NOMBRE_GENERICO,
      edad: Edad.create(input.edad),
      idioma: Idioma.create(input.idioma),
      avatar: 'anon',
      intereses: ['animales'],
      creadoEn: new Date(0),
    });

    const cantidad = input.cantidad ?? CANTIDAD_POR_DEFECTO;
    const generadas = await this.deps.ai.recommendActivities({
      perfil: perfilEfimero,
      categoria,
      cantidad,
    });

    // Sin dedup ni persistencia (no hay historial efímero): se devuelven tal cual.
    return generadas.map((g) => ({
      categoria: g.categoria,
      titulo: g.titulo,
      descripcion: g.descripcion,
      duracionMin: g.duracionMin,
      nivel: g.nivel,
      proveedor: g.proveedor,
    }));
  }
}
