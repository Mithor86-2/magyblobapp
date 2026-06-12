import type { Config } from '../../config.js';
import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import { CloudProvider } from './CloudProvider.js';
import { CLOUD_PRESETS } from './cloudPresets.js';
import { readCloudSetting } from './cloudSettings.js';
import { FallbackProvider, type AILogger } from './FallbackProvider.js';
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

  if (!options.settings) return base;
  return new HotSwapAIProvider(base, mock, options.settings, config, logger);
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

  /** Proveedor activo para esta petición; cae al base si cloud no aplica. */
  private async resolver(): Promise<AIProvider> {
    const cfg = await readCloudSetting(this.settings);
    if (cfg === null || !cfg.activo) return this.base;

    const apiKey = this.config.cloudApiKeys[cfg.target];
    if (apiKey === undefined) {
      this.logger.warn(
        { target: cfg.target, env: CLOUD_PRESETS[cfg.target].apiKeyEnv },
        'ai.cloud activo pero falta la API key en env; usando el modo base.',
      );
      return this.base;
    }

    const cloud = new CloudProvider({
      baseUrl: CLOUD_PRESETS[cfg.target].baseUrl,
      apiKey,
      model: cfg.model,
      timeoutMs: this.config.aiTimeoutMs,
      settings: this.settings,
    });
    return new FallbackProvider(cloud, this.mock, this.logger);
  }
}

const NO_OP_LOGGER: AILogger = { warn: () => {} };
