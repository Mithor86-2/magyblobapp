import { describe, expect, it, vi } from 'vitest';
import { ConfigError, loadConfig } from '../src/config.js';

/** Parseo/validación de la configuración por variables de entorno (US-46). */
describe('loadConfig — defaults de desarrollo', () => {
  it('aplica todos los defaults seguros cuando no hay variables de entorno', () => {
    const config = loadConfig({});
    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3000);
    expect(config.logLevel).toBe('info');
    expect(config.aiProvider).toBe('mock');
    expect(config.ollamaBaseUrl).toBe('http://localhost:11434');
    expect(config.ollamaModel).toBe('gemma:2b');
    expect(config.aiTimeoutMs).toBe(60_000);
    expect(config.cloudApiKeys).toEqual({});
    expect(config.tts.apiKey).toBeUndefined();
    expect(config.tts.model).toBe('eleven_multilingual_v2');
    expect(config.tts.voiceIdByLang.es.length).toBeGreaterThan(0);
    expect(config.tts.voiceIdByLang.en.length).toBeGreaterThan(0);
    expect(config.tts.timeoutMs).toBe(30_000);
  });
});

describe('loadConfig — override por env', () => {
  it('toma los valores de las variables de entorno cuando están presentes', () => {
    const config = loadConfig({
      NODE_ENV: 'staging',
      PORT: '8080',
      LOG_LEVEL: 'debug',
      AI_PROVIDER: 'local',
      OLLAMA_BASE_URL: 'http://ollama:11434',
      OLLAMA_MODEL: 'llama3.2:3b',
      AI_TIMEOUT_MS: '90000',
      ELEVENT_LABS_API: 'xi-key',
      ELEVENLABS_MODEL: 'eleven_turbo_v2',
      ELEVENLABS_VOICE_ID_ES: 'voz-es',
      ELEVENLABS_VOICE_ID_EN: 'voz-en',
      ELEVENLABS_TIMEOUT_MS: '15000',
    });
    expect(config.nodeEnv).toBe('staging');
    expect(config.port).toBe(8080);
    expect(config.logLevel).toBe('debug');
    expect(config.aiProvider).toBe('local');
    expect(config.ollamaBaseUrl).toBe('http://ollama:11434');
    expect(config.ollamaModel).toBe('llama3.2:3b');
    expect(config.aiTimeoutMs).toBe(90_000);
    expect(config.tts.apiKey).toBe('xi-key');
    expect(config.tts.model).toBe('eleven_turbo_v2');
    expect(config.tts.voiceIdByLang).toEqual({ es: 'voz-es', en: 'voz-en' });
    expect(config.tts.timeoutMs).toBe(15_000);
  });

  it('recorta los valores con espacios alrededor', () => {
    const config = loadConfig({ OLLAMA_MODEL: '  gemma:2b  ', ELEVENT_LABS_API: '  xi-key  ' });
    expect(config.ollamaModel).toBe('gemma:2b');
    expect(config.tts.apiKey).toBe('xi-key');
  });
});

describe('loadConfig — claves cloud', () => {
  it('recoge solo las API keys presentes y no vacías, por target', () => {
    const config = loadConfig({
      GROQ_API_KEY: 'groq-key',
      GEMINI_API_KEY: '   ',
      CEREBRAS_API_KEY: 'cerebras-key',
    });
    expect(config.cloudApiKeys).toEqual({ groq: 'groq-key', cerebras: 'cerebras-key' });
  });
});

describe('loadConfig — normalización de tipos (tolerante)', () => {
  it('cae al puerto por defecto cuando PORT no es numérico', () => {
    expect(loadConfig({ PORT: 'no-numero' }).port).toBe(3000);
  });

  it('cae al puerto por defecto cuando PORT no es entero positivo', () => {
    expect(loadConfig({ PORT: '0' }).port).toBe(3000);
    expect(loadConfig({ PORT: '-1' }).port).toBe(3000);
    expect(loadConfig({ PORT: '3.5' }).port).toBe(3000);
  });

  it('cae al timeout por defecto cuando AI_TIMEOUT_MS es inválido', () => {
    expect(loadConfig({ AI_TIMEOUT_MS: 'abc' }).aiTimeoutMs).toBe(60_000);
  });

  it('cae a mock cuando AI_PROVIDER está fuera de mock|local', () => {
    expect(loadConfig({ AI_PROVIDER: 'cloud' }).aiProvider).toBe('mock');
    expect(loadConfig({ AI_PROVIDER: '' }).aiProvider).toBe('mock');
  });

  it('acepta local como AI_PROVIDER válido', () => {
    expect(loadConfig({ AI_PROVIDER: 'local' }).aiProvider).toBe('local');
  });
});

describe('loadConfig — auth (JWT)', () => {
  it('aplica defaults de desarrollo cuando no hay variables de entorno', () => {
    const { auth } = loadConfig({});
    expect(auth.secret.length).toBeGreaterThan(0);
    expect(auth.accessTtl).toBe('15m');
    expect(auth.refreshTtl).toBe('7d');
  });

  it('toma el secreto y los TTL de las variables de entorno', () => {
    const { auth } = loadConfig({
      JWT_SECRET: 'secreto-de-produccion',
      JWT_ACCESS_TTL: '5m',
      JWT_REFRESH_TTL: '30d',
    });
    expect(auth.secret).toBe('secreto-de-produccion');
    expect(auth.accessTtl).toBe('5m');
    expect(auth.refreshTtl).toBe('30d');
  });

  it('ignora un JWT_SECRET en blanco y cae al default', () => {
    const { auth } = loadConfig({ JWT_SECRET: '   ' });
    expect(auth.secret).not.toBe('   ');
    expect(auth.secret.length).toBeGreaterThan(0);
  });
});

describe('loadConfig — producción (validación estricta)', () => {
  const baseProd = { NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@db:5432/x' };

  it('aborta si falta DATABASE_URL en producción', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(ConfigError);
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/);
  });

  it('aborta si DATABASE_URL está vacía en producción', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', DATABASE_URL: '   ' })).toThrow(ConfigError);
  });

  it('arranca en producción con DATABASE_URL y JWT_SECRET presentes', () => {
    const config = loadConfig({ ...baseProd, JWT_SECRET: 'secreto-fuerte-y-largo' });
    expect(config.nodeEnv).toBe('production');
    expect(config.auth.secret).toBe('secreto-fuerte-y-largo');
  });

  it('NO aborta sin DATABASE_URL fuera de producción (development/test)', () => {
    expect(() => loadConfig({ NODE_ENV: 'development' })).not.toThrow();
    expect(() => loadConfig({ NODE_ENV: 'test' })).not.toThrow();
  });

  it('degrada al secreto JWT de desarrollo con WARNING si falta en producción', () => {
    const warn = vi.fn();
    const config = loadConfig(baseProd, warn);
    expect(config.auth.secret.length).toBeGreaterThan(0);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/JWT_SECRET/);
  });

  it('avisa (sin abortar) si JWT_SECRET es el de desarrollo en producción', () => {
    const warn = vi.fn();
    const config = loadConfig(
      { ...baseProd, JWT_SECRET: 'dev-insecure-jwt-secret-change-me-in-production' },
      warn,
    );
    expect(config.auth.secret.length).toBeGreaterThan(0);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('no avisa cuando JWT_SECRET está bien fijado en producción', () => {
    const warn = vi.fn();
    loadConfig({ ...baseProd, JWT_SECRET: 'secreto-fuerte-y-largo' }, warn);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('loadConfig — selección de proveedor de email (US-93)', () => {
  it('sin credenciales, la verificación queda desactivada (auto-verificado)', () => {
    const { email } = loadConfig({});
    expect(email.enabled).toBe(false);
    expect(email.provider).toBeUndefined();
  });

  it('elige Brevo cuando hay BREVO_API_KEY y EMAIL_FROM', () => {
    const { email } = loadConfig({ BREVO_API_KEY: 'k-brevo', EMAIL_FROM: 'remitente@dominio.com' });
    expect(email.enabled).toBe(true);
    expect(email.provider).toBe('brevo');
    expect(email.brevo?.apiKey).toBe('k-brevo');
    expect(email.from).toBe('remitente@dominio.com');
  });

  it('Brevo tiene prioridad sobre SMTP cuando ambos están presentes', () => {
    const { email } = loadConfig({
      BREVO_API_KEY: 'k-brevo',
      EMAIL_FROM: 'remitente@dominio.com',
      SMTP_HOST: 'smtp.dominio.com',
      SMTP_USER: 'user@dominio.com',
      SMTP_PASSWORD: 'secreto',
    });
    expect(email.provider).toBe('brevo');
    expect(email.smtp).toBeUndefined();
  });

  it('cae a SMTP y avisa si hay BREVO_API_KEY pero falta EMAIL_FROM', () => {
    const warn = vi.fn();
    const { email } = loadConfig(
      {
        BREVO_API_KEY: 'k-brevo',
        SMTP_HOST: 'smtp.dominio.com',
        SMTP_USER: 'user@dominio.com',
        SMTP_PASSWORD: 'secreto',
      },
      warn,
    );
    expect(email.provider).toBe('smtp');
    expect(email.from).toBe('user@dominio.com');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('usa SMTP cuando solo hay credenciales SMTP', () => {
    const { email } = loadConfig({
      SMTP_HOST: 'smtp.dominio.com',
      SMTP_USER: 'user@dominio.com',
      SMTP_PASSWORD: 'secreto',
    });
    expect(email.enabled).toBe(true);
    expect(email.provider).toBe('smtp');
    expect(email.smtp?.host).toBe('smtp.dominio.com');
  });
});
