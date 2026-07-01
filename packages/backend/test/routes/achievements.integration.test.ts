import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';
import { CLAVE_DE_PRUEBA } from '../support/doubles.js';

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

  it('exige sesión (401 sin token)', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'GET',
      url: `/profiles/${profileId}/achievements`,
    });
    expect(res.statusCode).toBe(401);
  });
});
