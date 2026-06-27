import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateImageInput,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import type { GeminiImageProvider } from './GeminiImageProvider.js';
import { buildImagePrompt } from './prompts.js';

/**
 * Decora un `AIProvider` de **texto** (mock | local | cloud, ya con su fallback)
 * añadiéndole la generación de **portadas** (US-59), que es ortogonal al modo de
 * texto: la imagen siempre se genera con Gemini/Imagen si hay clave, sin importar
 * qué proveedor escriba el cuento.
 *
 * `text.generateImage` se ignora (los proveedores de texto devuelven `null`); aquí
 * se construye el prompt a partir de tema/estilo/título (**sin** nombre del niño,
 * C-5) con `buildImagePrompt` y se delega en el `image` provider. Si no hay `image`
 * (sin `GEMINI_API_KEY`), devuelve `null` y la app usa el respaldo local.
 */
export class ImageCapableProvider implements AIProvider {
  constructor(
    private readonly text: AIProvider,
    private readonly image: GeminiImageProvider | null,
  ) {}

  generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
    return this.text.generateStory(input);
  }

  recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]> {
    return this.text.recommendActivities(input);
  }

  async generateImage(input: GenerateImageInput): Promise<string | null> {
    if (this.image === null) return null;
    const prompt = buildImagePrompt(input.tema, input.estilo, input.titulo);
    return this.image.generateImage(prompt);
  }
}
