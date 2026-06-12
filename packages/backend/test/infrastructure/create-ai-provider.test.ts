import { describe, expect, it } from 'vitest';
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

  it('ante un AI_PROVIDER desconocido, loadConfig cae a mock', () => {
    expect(loadConfig({ AI_PROVIDER: 'desconocido' }).aiProvider).toBe('mock');
    expect(createAIProvider(loadConfig({ AI_PROVIDER: 'desconocido' }))).toBeInstanceOf(
      MockProvider,
    );
  });
});
