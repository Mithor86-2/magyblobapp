import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import { CATEGORIAS, type Categoria } from '../../domain/vocabulary.js';

/**
 * Proveedor de IA determinista que NO necesita Ollama ni red. Cumple tres papeles:
 *
 * 1. Modo por defecto (`AI_PROVIDER=mock`): un evaluador sin GPU puede ejecutar
 *    todo el flujo (crear perfil → ver cuento) sin descargar modelos.
 * 2. Red de seguridad: es el fallback automático cuando el proveedor activo
 *    (Ollama/cloud) no responde — ver `FallbackProvider`.
 * 3. Base de los tests rápidos del dominio/aplicación.
 *
 * El contenido sale en el idioma del perfil y es estable para una misma entrada.
 */
export class MockProvider implements AIProvider {
  async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
    const idioma = input.perfil.idioma.value;
    const { nombre } = input.perfil;
    const tema = input.tema;
    if (idioma === 'es') {
      return {
        titulo: `${nombre} y la aventura de ${tema}`,
        cuerpo:
          `Había una vez ${nombre}, que soñaba con ${tema}. ` +
          `Un día partió en un viaje lleno de color y risas. ` +
          `Por el camino hizo nuevos amigos que le ayudaron a ser valiente. ` +
          `Juntos descubrieron que lo más bonito de ${tema} es compartirlo. ` +
          `Y ${nombre} volvió a casa feliz, listo para soñar otra aventura.`,
      };
    }
    return {
      titulo: `${nombre} and the ${tema} adventure`,
      cuerpo:
        `Once upon a time there was ${nombre}, who dreamed about ${tema}. ` +
        `One day they set off on a journey full of color and laughter. ` +
        `Along the way they made new friends who helped them be brave. ` +
        `Together they discovered that the best part of ${tema} is sharing it. ` +
        `And ${nombre} came back home happy, ready to dream up another adventure.`,
    };
  }

  async recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]> {
    const idioma = input.perfil.idioma.value;
    return Array.from({ length: input.cantidad }, (_unused, i): GeneratedActivity => {
      const categoria: Categoria = input.categoria ?? CATEGORIAS[i % CATEGORIAS.length]!;
      return {
        categoria,
        ...PLANTILLAS_ACTIVIDAD[idioma](categoria, i + 1),
        duracionMin: 10 + (i % 3) * 5,
        nivel: (i % 3) + 1,
      };
    });
  }
}

type DatosActividad = { titulo: string; descripcion: string };

const PLANTILLAS_ACTIVIDAD: Record<
  CodigoIdioma,
  (categoria: Categoria, n: number) => DatosActividad
> = {
  es: (categoria, n) => ({
    titulo: `Actividad de ${categoria} nº ${n}`,
    descripcion: `Una propuesta sencilla de ${categoria} para jugar y aprender en casa.`,
  }),
  en: (categoria, n) => ({
    titulo: `${categoria} activity #${n}`,
    descripcion: `A simple ${categoria} idea to play and learn at home.`,
  }),
};
