import type { Config } from '../../config.js';
import type { AIProvider } from '../../domain/ai/AIProvider.js';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import { FallbackProvider, type AILogger } from './FallbackProvider.js';
import { MockProvider } from './MockProvider.js';
import { OllamaProvider } from './OllamaProvider.js';

export interface CreateAIProviderOptions {
  logger?: AILogger;
  /** Config en caliente (AppSetting) para el OllamaProvider. */
  settings?: SettingsRepository;
}

/**
 * Selecciona la implementación de `AIProvider` según `config.aiProvider`
 * (`mock | local | cloud`) y la envuelve en `FallbackProvider` cuando hay un
 * proveedor real, de modo que cualquier fallo cae a `MockProvider`.
 *
 * - `mock`  → MockProvider directo (sin red, determinista).
 * - `local` → OllamaProvider (gemma:2b) con fallback a mock.
 * - `cloud` → todavía no implementado (CloudProvider llega en la Fase 5);
 *             por ahora se avisa y se usa mock para no romper el arranque.
 */
export function createAIProvider(
  config: Config,
  options: CreateAIProviderOptions = {},
): AIProvider {
  const logger = options.logger ?? NO_OP_LOGGER;
  const mock = new MockProvider();

  switch (config.aiProvider) {
    case 'local': {
      const ollama = new OllamaProvider({
        baseUrl: config.ollamaBaseUrl,
        model: config.ollamaModel,
        timeoutMs: config.aiTimeoutMs,
        settings: options.settings,
      });
      return new FallbackProvider(ollama, mock, logger);
    }
    case 'cloud':
      logger.warn(
        { aiProvider: 'cloud' },
        'AI_PROVIDER=cloud aún no está implementado (Fase 5); usando MockProvider.',
      );
      return mock;
    case 'mock':
    default:
      return mock;
  }
}

const NO_OP_LOGGER: AILogger = { warn: () => {} };
