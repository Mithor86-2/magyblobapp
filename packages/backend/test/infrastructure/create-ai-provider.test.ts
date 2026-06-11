import { describe, expect, it, vi } from 'vitest';
import { createAIProvider } from '../../src/infrastructure/ai/createAIProvider.js';
import { MockProvider } from '../../src/infrastructure/ai/MockProvider.js';
import { FallbackProvider } from '../../src/infrastructure/ai/FallbackProvider.js';
import { loadConfig, type Config } from '../../src/config.js';

function config(overrides: Partial<Config> = {}): Config {
  return { ...loadConfig({}), ...overrides };
}

describe('createAIProvider', () => {
  it('en modo mock devuelve un MockProvider', () => {
    expect(createAIProvider(config({ aiProvider: 'mock' }))).toBeInstanceOf(MockProvider);
  });

  it('en modo local devuelve un FallbackProvider (Ollama con red de seguridad)', () => {
    expect(createAIProvider(config({ aiProvider: 'local' }))).toBeInstanceOf(FallbackProvider);
  });

  it('en modo cloud avisa y cae a MockProvider (CloudProvider es Fase 5)', () => {
    const logger = { warn: vi.fn() };
    const provider = createAIProvider(config({ aiProvider: 'cloud' }), logger);
    expect(provider).toBeInstanceOf(MockProvider);
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});
