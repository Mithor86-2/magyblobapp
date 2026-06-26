import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';

/**
 * Integración de la narración (US-22): flujo completo por HTTP
 * (adulto → perfil → cuento → GET narración) con dobles en memoria
 * (`FakeTTSProvider`), sin llamar a ElevenLabs ni abrir puerto.
 */
describe('GET /stories/:id/narration (integración)', () => {
  let app: FastifyInstance;
  let handles: ReturnType<typeof makeInMemoryDeps>;

  beforeEach(async () => {
    handles = makeInMemoryDeps();
    app = await buildTestServer(handles.deps);
  });

  afterEach(async () => {
    await app.close();
  });

  async function crearCuento(): Promise<string> {
    const guardian = await app.inject({
      method: 'POST',
      url: '/guardians',
      payload: {
        nombre: 'Ana',
        apellidos: 'García',
        email: 'ana@example.com',
        parentesco: 'madre',
        consentimientoAceptado: true,
        consentimientoVersion: 'v1',
      },
    });
    const guardianId = guardian.json().id as string;

    const profile = await app.inject({
      method: 'POST',
      url: '/profiles',
      headers: authHeaders(app),
      payload: {
        guardianId,
        nombre: 'Mateo',
        edad: 4,
        idioma: 'es',
        avatar: 'a1',
        intereses: ['animales'],
      },
    });
    const profileId = profile.json().id as string;

    const story = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, tema: 'animales', estilo: 'aventura' },
    });
    return story.json().id as string;
  }

  it('devuelve el audio del cuento como audio/mpeg', async () => {
    const storyId = await crearCuento();

    const res = await app.inject({
      method: 'GET',
      url: `/stories/${storyId}/narration`,
      headers: authHeaders(app),
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('audio/mpeg');
    expect(res.rawPayload.length).toBeGreaterThan(0);

    // Registró el evento de uso en cache-miss.
    const evento = handles.events.items.find((e) => e.tipo === 'cuento_narrado');
    expect(evento?.profileId).toBeDefined();
  });

  it('sirve de caché en la segunda llamada (sin re-sintetizar)', async () => {
    const storyId = await crearCuento();

    await app.inject({
      method: 'GET',
      url: `/stories/${storyId}/narration`,
      headers: authHeaders(app),
    });
    await app.inject({
      method: 'GET',
      url: `/stories/${storyId}/narration`,
      headers: authHeaders(app),
    });

    expect(handles.tts.llamadas).toBe(1); // ElevenLabs se llamó una sola vez
    const eventos = handles.events.items.filter((e) => e.tipo === 'cuento_narrado');
    expect(eventos).toHaveLength(1); // solo el cache-miss registra evento
  });

  it('devuelve 404 si el cuento no existe', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/stories/inexistente/narration',
      headers: authHeaders(app),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.tipo).toBe('NotFoundError');
  });
});
