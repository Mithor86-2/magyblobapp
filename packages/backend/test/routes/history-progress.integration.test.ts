import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';
import { CLAVE_DE_PRUEBA } from '../support/doubles.js';

/**
 * Integración de F2 (historial + progreso) por HTTP con dobles en memoria:
 * generar contenido → marcar cuento leído / completar actividad → ver historial.
 */
describe('Historial y progreso (integración)', () => {
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
    const guardian = await app.inject({
      method: 'POST',
      url: '/guardians',
      payload: {
        nombre: 'Ana',
        apellidos: 'García',
        email: 'ana@example.com',
        parentesco: 'madre',
        password: CLAVE_DE_PRUEBA,
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
    return profile.json().id as string;
  }

  it('marca un cuento como leído', async () => {
    const profileId = await crearPerfil();
    const story = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, tema: 'animales', estilo: 'aventura' },
    });
    const storyId = story.json().id as string;

    const res = await app.inject({
      method: 'POST',
      url: `/stories/${storyId}/read`,
      headers: authHeaders(app),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().estado).toBe('leido');
  });

  it('completa una actividad con valoración y registra el evento', async () => {
    const profileId = await crearPerfil();
    const rec = await app.inject({
      method: 'POST',
      url: '/activities/recommend',
      headers: authHeaders(app),
      payload: { profileId, cantidad: 1 },
    });
    const activityId = rec.json()[0].id as string;

    const res = await app.inject({
      method: 'POST',
      url: `/activities/${activityId}/complete`,
      headers: authHeaders(app),
      payload: { valoracion: 2 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().valoracion).toBe(2);
    expect(res.json().completadaEn).toBeTruthy();

    const evento = handles.events.items.find((e) => e.tipo === 'actividad_completada');
    expect(evento?.profileId).toBe(profileId);
  });

  it('rechaza una valoración fuera de 1-3 (400)', async () => {
    const profileId = await crearPerfil();
    const rec = await app.inject({
      method: 'POST',
      url: '/activities/recommend',
      headers: authHeaders(app),
      payload: { profileId, cantidad: 1 },
    });
    const activityId = rec.json()[0].id as string;
    const res = await app.inject({
      method: 'POST',
      url: `/activities/${activityId}/complete`,
      headers: authHeaders(app),
      payload: { valoracion: 9 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('devuelve el historial del perfil (cuentos + actividades)', async () => {
    const profileId = await crearPerfil();
    await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, tema: 'animales', estilo: 'aventura' },
    });
    await app.inject({
      method: 'POST',
      url: '/activities/recommend',
      headers: authHeaders(app),
      payload: { profileId, cantidad: 2 },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/profiles/${profileId}/history`,
      headers: authHeaders(app),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { stories: unknown[]; activities: unknown[] };
    expect(body.stories).toHaveLength(1);
    expect(body.activities).toHaveLength(2);
  });
});
