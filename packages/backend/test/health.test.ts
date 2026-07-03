import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({
      nodeEnv: 'test',
      port: 0,
      logLevel: 'silent',
      aiProvider: 'mock',
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'gemma:2b',
      aiTimeoutMs: 1000,
      cloudApiKeys: {},
      tts: {
        apiKey: undefined,
        model: 'eleven_multilingual_v2',
        voiceIdByLang: { es: 'voz-es', en: 'voz-en' },
        timeoutMs: 1000,
      },
      auth: { secret: 'test-secret', accessTtl: '15m', refreshTtl: '7d' },
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
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 con estado ok y la versión del paquete', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; service: string; version: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('magyblob-backend');
    // `version` la usa el smoke post-deploy para confirmar la versión desplegada.
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
