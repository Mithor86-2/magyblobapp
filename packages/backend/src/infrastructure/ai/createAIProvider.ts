import type { Config } from '../../config.js';
import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateImageInput,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import { CloudProvider } from './CloudProvider.js';
import { CLOUD_PRESETS } from './cloudPresets.js';
import { readCloudSetting } from './cloudSettings.js';
import { FallbackProvider, type AILogger } from './FallbackProvider.js';
import { GeminiImageProvider } from './GeminiImageProvider.js';
import { ImageCapableProvider } from './ImageCapableProvider.js';
import { MockProvider } from './MockProvider.js';
import { OllamaProvider } from './OllamaProvider.js';

export interface CreateAIProviderOptions {
  logger?: AILogger;
  /** Config en caliente (AppSetting): prompts/temperatura y selección de `cloud`. */
  settings?: SettingsRepository;
}

/**
 * Selecciona la implementación de `AIProvider`.
 *
 * - El **modo base** lo fija `config.aiProvider` (`mock | local`): `mock` directo,
 *   o `local` (Ollama) envuelto en `FallbackProvider` (cae a mock ante fallo).
 * - El **modo `cloud` es opt-in y se resuelve por petición** desde la BD (clave
 *   `ai.cloud` de `AppSetting`): si está `activo` y hay API key para su `target`,
 *   cada generación usa el `CloudProvider` (con fallback a mock); si no, usa el
 *   modo base. Esto permite **conmutar en caliente** sin reiniciar y mantiene la
 *   privacidad por defecto (cloud no se enciende por env, solo por decisión en BD).
 *
 * Sin `settings` (p. ej. tests con dobles, o mock puro) no hay hot-swap: se
 * devuelve el modo base tal cual.
 */
export function createAIProvider(
  config: Config,
  options: CreateAIProviderOptions = {},
): AIProvider {
  const logger = options.logger ?? NO_OP_LOGGER;
  const mock = new MockProvider();
  const base = buildBase(config, mock, logger, options.settings);

  // Proveedor de texto (con su hot-swap/fallback). El `mock` directo se devuelve sin
  // hot-swap cuando no hay `settings` (igual que antes).
  const text = options.settings
    ? new HotSwapAIProvider(base, mock, options.settings, config, logger)
    : base;

  // Portadas (US-59), ortogonales al modo de texto: solo cuando hay `GEMINI_API_KEY`
  // se envuelve el proveedor de texto en `ImageCapableProvider` para generar la
  // imagen con Gemini/Imagen. Sin clave NO se envuelve: `generateImage` de los
  // proveedores de texto devuelve `null` y la app usa el respaldo local (privacidad
  // por diseño, sin red). Así el tipo devuelto en mock/local sin clave no cambia.
  const image = buildImageProvider(config, logger);
  return image === null ? text : new ImageCapableProvider(text, image);
}

/**
 * Construye el generador de imágenes Gemini/Imagen si hay `GEMINI_API_KEY`
 * (`config.cloudApiKeys.gemini`); si no, `null` (no se genera, se usa respaldo).
 */
function buildImageProvider(config: Config, logger: AILogger): GeminiImageProvider | null {
  const apiKey = config.cloudApiKeys.gemini;
  if (apiKey === undefined) return null;
  return new GeminiImageProvider({ apiKey, timeoutMs: config.aiTimeoutMs, logger });
}

function buildBase(
  config: Config,
  mock: MockProvider,
  logger: AILogger,
  settings?: SettingsRepository,
): AIProvider {
  if (config.aiProvider === 'local') {
    const ollama = new OllamaProvider({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
      timeoutMs: config.aiTimeoutMs,
      settings,
      logger,
    });
    return new FallbackProvider(ollama, mock, logger);
  }
  return mock;
}

/**
 * Decide en cada llamada qué proveedor usar: el `cloud` (si `ai.cloud` está activo
 * y tiene key) o el `base`. Construir el `CloudProvider` por petición es barato
 * (solo config) y es lo que da el cambio en caliente desde BD.
 */
class HotSwapAIProvider implements AIProvider {
  constructor(
    private readonly base: AIProvider,
    private readonly mock: MockProvider,
    private readonly settings: SettingsRepository,
    private readonly config: Config,
    private readonly logger: AILogger,
  ) {}

  async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
    return (await this.resolver()).generateStory(input);
  }

  async recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]> {
    return (await this.resolver()).recommendActivities(input);
  }

  /**
   * Las portadas (US-59) son ortogonales al hot-swap de texto: las añade el
   * decorador `ImageCapableProvider` que envuelve a este proveedor. Aquí se delega
   * en el base (devuelve `null`) para cumplir la interfaz sin duplicar lógica.
   */
  generateImage(input: GenerateImageInput): Promise<string | null> {
    return this.base.generateImage(input);
  }

  /**
   * Proveedor activo para esta petición. Construye la **cascada** de `ai.cloud`
   * (US-99): el `target` primario más sus `fallbacks`, en orden, descartando los
   * pasos sin API key en env; anida `FallbackProvider` (cada paso cae al siguiente
   * ante fallo) y termina en el **mock**. Sin ningún paso con key, o con cloud
   * inactivo, cae al modo base (privacidad por defecto).
   */
  private async resolver(): Promise<AIProvider> {
    const cfg = await readCloudSetting(this.settings);
    if (cfg === null || !cfg.activo) return this.base;

    // Cadena ordenada: primario + fallbacks. Se conserva solo lo que tenga API key.
    const pasos = [{ target: cfg.target, model: cfg.model }, ...(cfg.fallbacks ?? [])];
    const disponibles = pasos.filter((paso) => {
      if (this.config.cloudApiKeys[paso.target] !== undefined) return true;
      this.logger.warn(
        { target: paso.target, env: CLOUD_PRESETS[paso.target].apiKeyEnv },
        'ai.cloud: falta la API key del target; se omite de la cascada.',
      );
      return false;
    });
    if (disponibles.length === 0) return this.base;

    // Se anida de derecha a izquierda: cloud_1 → cloud_2 → … → mock.
    return disponibles.reduceRight<AIProvider>((siguiente, paso) => {
      const cloud = new CloudProvider({
        baseUrl: CLOUD_PRESETS[paso.target].baseUrl,
        apiKey: this.config.cloudApiKeys[paso.target]!,
        model: paso.model,
        proveedor: paso.target,
        timeoutMs: this.config.aiTimeoutMs,
        settings: this.settings,
        logger: this.logger,
      });
      return new FallbackProvider(cloud, siguiente, this.logger);
    }, this.mock);
  }
}

const NO_OP_LOGGER: AILogger = { warn: () => {} };
