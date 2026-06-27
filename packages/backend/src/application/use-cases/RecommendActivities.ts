import type { AIProvider } from '../../domain/ai/AIProvider.js';
import { Activity } from '../../domain/entities/Activity.js';
import { DomainError, NotFoundError } from '../../domain/errors.js';
import type { ActivityRepository } from '../../domain/repositories/ActivityRepository.js';
import type { ChildProfileRepository } from '../../domain/repositories/ChildProfileRepository.js';
import { CATEGORIAS, type Categoria } from '../../domain/vocabulary.js';
import type { Clock, IdGenerator } from '../ports.js';
import type { ActivityOutput, RecommendActivitiesRequest } from '../dto.js';
import { toActivityOutput } from '../mappers.js';

export interface RecommendActivitiesDeps {
  profiles: ChildProfileRepository;
  activities: ActivityRepository;
  ai: AIProvider;
  newId: IdGenerator;
  now: Clock;
}

const CANTIDAD_POR_DEFECTO = 3;

/**
 * Recomienda actividades para un perfil delegando en `AIProvider`, las persiste y
 * las devuelve. Aplica un dedup simple por título (case-insensitive) frente a las
 * actividades ya generadas del perfil: evita repeticiones sin necesidad de una base
 * vectorial (Chroma descartada — ADR 0004).
 */
export class RecommendActivities {
  constructor(private readonly deps: RecommendActivitiesDeps) {}

  async execute(input: RecommendActivitiesRequest): Promise<ActivityOutput[]> {
    let categoria: Categoria | undefined;
    if (input.categoria !== undefined) {
      if (!(CATEGORIAS as readonly string[]).includes(input.categoria)) {
        throw new DomainError(`Categoría inválida: "${input.categoria}".`);
      }
      categoria = input.categoria as Categoria;
    }

    const perfil = await this.deps.profiles.findById(input.profileId);
    if (!perfil) {
      throw new NotFoundError(`No existe el perfil con id "${input.profileId}".`);
    }

    const cantidad = input.cantidad ?? CANTIDAD_POR_DEFECTO;
    const generadas = await this.deps.ai.recommendActivities({ perfil, categoria, cantidad });

    // Dedup simple: descartar las que ya existan para el perfil (por título) y las
    // repetidas dentro del propio lote generado.
    const previas = await this.deps.activities.findByProfile(perfil.id);
    const vistos = new Set(previas.map((a) => a.titulo.trim().toLowerCase()));

    const guardadas: Activity[] = [];
    for (const g of generadas) {
      const clave = g.titulo.trim().toLowerCase();
      if (vistos.has(clave)) continue;
      vistos.add(clave);

      // Las actividades no llevan portada de imagen (ajuste feature 65): los respaldos
      // locales de la app se organizan por tema (concepto de cuentos), no por categoría.
      // Solo los cuentos (`GenerateStory`) generan imagen. `Activity.imagen` queda en desuso.
      const activity = new Activity({
        id: this.deps.newId(),
        profileId: perfil.id,
        categoria: g.categoria,
        titulo: g.titulo,
        descripcion: g.descripcion,
        instrucciones: g.instrucciones,
        duracionMin: g.duracionMin,
        nivel: g.nivel,
        proveedor: g.proveedor,
      });
      await this.deps.activities.save(activity);
      guardadas.push(activity);
    }

    return guardadas.map(toActivityOutput);
  }
}
