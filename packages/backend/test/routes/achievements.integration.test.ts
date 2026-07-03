import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { altaGuardian, authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';

/**
 * Integración de `GET /profiles/:id/achievements` (US-68) con dobles en memoria:
 * un perfil nuevo tiene el catálogo bloqueado; tras leer un cuento se desbloquean
 * los logros correspondientes y quedan persistidos (reconciliación en la lectura).
 */
describe('GET /profiles/:profileId/achievements (integración)', () => {
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

  it('perfil sin actividad: catálogo completo y nada conseguido', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'GET',
      url: `/profiles/${profileId}/achievements`,
      headers: authHeaders(app),
    });
    expect(res.statusCode).toBe(200);
    const logros = res.json() as Array<{ clave: string; conseguido: boolean }>;
    expect(logros.length).toBeGreaterThan(0);
    expect(logros.every((l) => l.conseguido === false)).toBe(true);
  });

  it('tras generar y leer un cuento, desbloquea y persiste los logros', async () => {
    const profileId = await crearPerfil();

    const story = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['animales'], estilos: ['aventura'] },
    });
    const storyId = story.json().id as string;
    await app.inject({
      method: 'POST',
      url: `/stories/${storyId}/read`,
      headers: authHeaders(app),
    });

    const res = await app.inject({
      method: 'GET',
      url: `/profiles/${profileId}/achievements`,
      headers: authHeaders(app),
    });
    expect(res.statusCode).toBe(200);
    const logros = res.json() as Array<{
      clave: string;
      conseguido: boolean;
      desbloqueadoEn?: string;
    }>;
    const porClave = new Map(logros.map((l) => [l.clave, l]));
    expect(porClave.get('cuentos_leidos_1')?.conseguido).toBe(true);
    expect(porClave.get('cuentos_leidos_1')?.desbloqueadoEn).toBeTruthy();
    expect(porClave.get('tema_animales')?.conseguido).toBe(true);
    expect(porClave.get('cuentos_leidos_5')?.conseguido).toBe(false);

    // Persistido (reconciliación en la lectura).
    const persistidos = await handles.achievements.findByProfile(profileId);
    expect(persistidos.map((a) => a.clave).sort()).toEqual(['cuentos_leidos_1', 'tema_animales']);
  });

  it('A3: una actividad completada aparece en el historial y desbloquea su logro', async () => {
    const profileId = await crearPerfil();

    // Recomendar (persiste) → completar una con valoración.
    const rec = await app.inject({
      method: 'POST',
      url: '/activities/recommend',
      headers: authHeaders(app),
      payload: { profileId, cantidad: 1 },
    });
    expect(rec.statusCode).toBe(201);
    const activityId = (rec.json() as Array<{ id: string }>)[0]!.id;

    const done = await app.inject({
      method: 'POST',
      url: `/activities/${activityId}/complete`,
      headers: authHeaders(app),
      payload: { valoracion: 3 },
    });
    expect(done.statusCode).toBe(200);

    // Aparece en el historial con su valoración.
    const hist = await app.inject({
      method: 'GET',
      url: `/profiles/${profileId}/history`,
      headers: authHeaders(app),
    });
    const activities = (hist.json() as { activities: Array<{ id: string; valoracion?: number }> })
      .activities;
    const enHistorial = activities.find((a) => a.id === activityId);
    expect(enHistorial?.valoracion).toBe(3);

    // Desbloquea el logro de actividades completadas.
    const logros = await app.inject({
      method: 'GET',
      url: `/profiles/${profileId}/achievements`,
      headers: authHeaders(app),
    });
    const porClave = new Map(
      (logros.json() as Array<{ clave: string; conseguido: boolean }>).map((l) => [l.clave, l]),
    );
    expect(porClave.get('actividades_completadas_1')?.conseguido).toBe(true);
  });

  it('exige sesión (401 sin token)', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'GET',
      url: `/profiles/${profileId}/achievements`,
    });
    expect(res.statusCode).toBe(401);
  });
});
