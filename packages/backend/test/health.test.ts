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
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 con estado ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', service: 'magyblob-backend' });
  });
});
