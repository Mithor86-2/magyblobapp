import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { altaGuardian, authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';

/**
 * Integración de favoritos (US-63) por HTTP con dobles en memoria: generar
 * contenido → marcar/desmarcar favorito → comprobar 200/404/400.
 */
describe('Favoritos (integración)', () => {
  let app: FastifyInstance;
  let handles: ReturnType<typeof makeInMemoryDeps>;

  beforeEach(async () => {
    handles = makeInMemoryDeps();
    app = await buildTestServer(handles.deps);
  });

  afterEach(async () => {
    await app.close();
  });

  async function crearPerfil(): Promise<string> {
    const guardian = await altaGuardian(app);
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
    return profile.json().id as string;
  }

  async function generarCuento(profileId: string): Promise<string> {
    const story = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['animales'], estilos: ['aventura'] },
    });
    return story.json().id as string;
  }

  async function generarActividad(profileId: string): Promise<string> {
    const rec = await app.inject({
      method: 'POST',
      url: '/activities/recommend',
      headers: authHeaders(app),
      payload: { profileId, cantidad: 1 },
    });
    return rec.json()[0].id as string;
  }

  it('marca y desmarca un cuento como favorito (200)', async () => {
    const profileId = await crearPerfil();
    const storyId = await generarCuento(profileId);

    const marcar = await app.inject({
      method: 'POST',
      url: `/stories/${storyId}/favorite`,
      headers: authHeaders(app),
      payload: { favorito: true },
    });
    expect(marcar.statusCode).toBe(200);
    expect(marcar.json().favorito).toBe(true);

    const desmarcar = await app.inject({
      method: 'POST',
      url: `/stories/${storyId}/favorite`,
      headers: authHeaders(app),
      payload: { favorito: false },
    });
    expect(desmarcar.statusCode).toBe(200);
    expect(desmarcar.json().favorito).toBe(false);
  });

  it('marca una actividad como favorita (200)', async () => {
    const profileId = await crearPerfil();
    const activityId = await generarActividad(profileId);

    const res = await app.inject({
      method: 'POST',
      url: `/activities/${activityId}/favorite`,
      headers: authHeaders(app),
      payload: { favorito: true },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().favorito).toBe(true);
  });

  it('devuelve 404 si el cuento no existe', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/stories/no-existe/favorite',
      headers: authHeaders(app),
      payload: { favorito: true },
    });
    expect(res.statusCode).toBe(404);
  });

  it('devuelve 404 si la actividad no existe', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/activities/no-existe/favorite',
      headers: authHeaders(app),
      payload: { favorito: true },
    });
    expect(res.statusCode).toBe(404);
  });

  it('devuelve 400 si el body es inválido (favorito no booleano)', async () => {
    const profileId = await crearPerfil();
    const storyId = await generarCuento(profileId);
    const res = await app.inject({
      method: 'POST',
      url: `/stories/${storyId}/favorite`,
      headers: authHeaders(app),
      payload: { favorito: 'sí' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('devuelve 400 si falta el campo favorito', async () => {
    const profileId = await crearPerfil();
    const activityId = await generarActividad(profileId);
    const res = await app.inject({
      method: 'POST',
      url: `/activities/${activityId}/favorite`,
      headers: authHeaders(app),
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});
