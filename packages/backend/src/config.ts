import { CLOUD_PRESETS, type CloudTarget } from './infrastructure/ai/cloudPresets.js';
import type { CodigoIdioma } from './domain/value-objects/Idioma.js';

/**
 * Configuración derivada de variables de entorno, con valores por defecto
 * seguros para desarrollo. Centralizada aquí para no leer process.env disperso.
 */
export interface Config {
  nodeEnv: string;
  port: number;
  logLevel: string;
  aiProvider: 'mock' | 'local';
  ollamaBaseUrl: string;
  ollamaModel: string;
  /** Tiempo máximo de espera al proveedor de IA antes de caer a mock (ms). */
  aiTimeoutMs: number;
  /**
   * API keys de los proveedores cloud, por `target`, leídas de env (nunca de BD).
   * El modo cloud no se activa por env: se activa desde `AppSetting` (`ai.cloud`),
   * pero la key del target elegido debe estar presente aquí para poder usarlo.
   */
  cloudApiKeys: Partial<Record<CloudTarget, string>>;
  /** Síntesis de voz (ElevenLabs). La API key es secreta y se lee de env. */
  tts: TtsConfig;
}

export interface TtsConfig {
  /** `xi-api-key` de ElevenLabs (env `ELEVENT_LABS_API`); `undefined` ⇒ voz nativa. */
  apiKey: string | undefined;
  /** Modelo de síntesis (env `ELEVENLABS_MODEL`). */
  model: string;
  /** Voz por idioma (env `ELEVENLABS_VOICE_ID_ES` / `_EN`). */
  voiceIdByLang: Record<CodigoIdioma, string>;
  /** Timeout de la petición a ElevenLabs en ms (env `ELEVENLABS_TIMEOUT_MS`). */
  timeoutMs: number;
}

/** Voces premade de ElevenLabs por defecto (multilingual_v2); sobreescribibles por env. */
const VOZ_DEFECTO_ES = 'JBFqnCBsd6RMkjVDRZzb';
const VOZ_DEFECTO_EN = '21m00Tcm4TlvDq8ikWAM';

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseAiProvider(value: string | undefined): Config['aiProvider'] {
  return value === 'local' ? 'local' : 'mock';
}

function loadCloudApiKeys(env: NodeJS.ProcessEnv): Partial<Record<CloudTarget, string>> {
  const keys: Partial<Record<CloudTarget, string>> = {};
  for (const [target, preset] of Object.entries(CLOUD_PRESETS)) {
    const value = env[preset.apiKeyEnv];
    if (value !== undefined && value.trim() !== '') {
      keys[target as CloudTarget] = value.trim();
    }
  }
  return keys;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: parsePort(env.PORT, 3000),
    logLevel: env.LOG_LEVEL ?? 'info',
    aiProvider: parseAiProvider(env.AI_PROVIDER),
    ollamaBaseUrl: env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    ollamaModel: env.OLLAMA_MODEL ?? 'gemma:2b',
    aiTimeoutMs: parsePort(env.AI_TIMEOUT_MS, 60_000),
    cloudApiKeys: loadCloudApiKeys(env),
    tts: loadTtsConfig(env),
  };
}

function loadTtsConfig(env: NodeJS.ProcessEnv): TtsConfig {
  const apiKey = env.ELEVENT_LABS_API?.trim();
  return {
    apiKey: apiKey === undefined || apiKey === '' ? undefined : apiKey,
    model: env.ELEVENLABS_MODEL?.trim() || 'eleven_multilingual_v2',
    voiceIdByLang: {
      es: env.ELEVENLABS_VOICE_ID_ES?.trim() || VOZ_DEFECTO_ES,
      en: env.ELEVENLABS_VOICE_ID_EN?.trim() || VOZ_DEFECTO_EN,
    },
    timeoutMs: parsePort(env.ELEVENLABS_TIMEOUT_MS, 30_000),
  };
}
