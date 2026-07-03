import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server.js';
import type { Config } from '../../src/config.js';
import { buildTestServer, makeInMemoryDeps } from '../support/server.js';

const SECRETO_XI = 'sk_secreto_que_no_debe_filtrarse';

/** Config con clave de ElevenLabs presente (para el caso `hasApiKey: true`). */
function configConClave(): Config {
  return {
    nodeEnv: 'test',
    port: 0,
    logLevel: 'silent',
    aiProvider: 'mock',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'gemma:2b',
    aiTimeoutMs: 1000,
    cloudApiKeys: {},
    tts: {
      apiKey: SECRETO_XI,
      model: 'eleven_multilingual_v2',
      voiceIdByLang: { es: 'voz-es', en: 'voz-en' },
      timeoutMs: 1000,
    },
    auth: { secret: 'test-secret-no-usar-en-produccion', accessTtl: '15m', refreshTtl: '7d' },
    security: {
      trustProxy: false,
      corsOrigins: [],
      rateLimit: {
        registro: { max: 100, ventanaMs: 60_000 },
        login: { max: 100, ventanaMs: 60_000 },
        refresh: { max: 100, ventanaMs: 60_000 },
      },
      parentalGate: { ttlMs: 300_000 },
    },
  };
}

/**
 * Integración de los ajustes de narración (US-55): `GET /settings/tts/voices`
 * devuelve la voz configurada por idioma y el modelo, sin secretos ni llamar a
 * ElevenLabs. La config de test usa voces `voz-es`/`voz-en` y sin `apiKey`.
 */
describe('GET /settings/tts/voices (integración)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestServer(makeInMemoryDeps().deps);
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve la voz por idioma y el modelo (público, sin secretos)', async () => {
    const res = await app.inject({ method: 'GET', url: '/settings/tts/voices' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      model: 'eleven_multilingual_v2',
      hasApiKey: false, // TEST_CONFIG no fija ELEVENT_LABS_API
      voices: { es: 'voz-es', en: 'voz-en' },
    });
  });

  it('expone solo el flag hasApiKey, nunca la clave (apiKey)', async () => {
    const res = await app.inject({ method: 'GET', url: '/settings/tts/voices' });

    const body = res.json();
    // El secreto no se filtra: solo el flag booleano, nunca el valor de la clave.
    expect(body).not.toHaveProperty('apiKey');
    expect(typeof body.hasApiKey).toBe('boolean');
  });

  it('con clave presente, hasApiKey es true y el secreto no aparece en el cuerpo', async () => {
    const conClave = await buildServer(configConClave(), makeInMemoryDeps().deps);
    try {
      const res = await conClave.inject({ method: 'GET', url: '/settings/tts/voices' });

      expect(res.json().hasApiKey).toBe(true);
      expect(res.payload).not.toContain(SECRETO_XI);
    } finally {
      await conClave.close();
    }
  });
});
