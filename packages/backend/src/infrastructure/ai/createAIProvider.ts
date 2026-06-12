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
 * (`mock | local`) y la envuelve en `FallbackProvider` cuando hay un proveedor
 * real, de modo que cualquier fallo cae a `MockProvider`.
 *
 * - `mock`  → MockProvider directo (sin red, determinista).
 * - `local` → OllamaProvider (gemma:2b) con fallback a mock.
 */
export function createAIProvider(
  config: Config,
  options: CreateAIProviderOptions = {},
): AIProvider {
  const logger = options.logger ?? NO_OP_LOGGER;
  const mock = new MockProvider();

  if (config.aiProvider === 'local') {
    const ollama = new OllamaProvider({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
      timeoutMs: config.aiTimeoutMs,
      settings: options.settings,
    });
    return new FallbackProvider(ollama, mock, logger);
  }
  return mock;
}

const NO_OP_LOGGER: AILogger = { warn: () => {} };
