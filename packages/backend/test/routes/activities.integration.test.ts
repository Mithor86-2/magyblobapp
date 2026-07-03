import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { altaGuardian, authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';

/**
 * Test de integración de `POST /activities/recommend`: genera actividades para un
 * perfil vía HTTP con dobles en memoria (MockProvider), sin abrir puerto ni DB.
 */
describe('POST /activities/recommend (integración)', () => {
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

  it('recomienda y persiste actividades para el perfil', async () => {
    const profileId = await crearPerfil();

    const res = await app.inject({
      method: 'POST',
      url: '/activities/recommend',
      headers: authHeaders(app),
      payload: { profileId, cantidad: 3 },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as Array<{
      profileId: string;
      categoria: string;
      instrucciones?: string;
    }>;
    expect(body).toHaveLength(3);
    expect(body.every((a) => a.profileId === profileId)).toBe(true);
    expect(body.every((a) => ['arte', 'musica', 'logica'].includes(a.categoria))).toBe(true);
    // US-54: cada actividad trae instrucciones (paso a paso) en la salida HTTP.
    expect(
      body.every((a) => typeof a.instrucciones === 'string' && a.instrucciones.length > 0),
    ).toBe(true);

    // Persistidas en el repositorio de actividades.
    const guardadas = await handles.activities.findByProfile(profileId);
    expect(guardadas).toHaveLength(3);
  });

  it('devuelve 404 si el perfil no existe', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/activities/recommend',
      headers: authHeaders(app),
      payload: { profileId: 'inexistente' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.tipo).toBe('NotFoundError');
  });

  it('devuelve 400 ante una categoría fuera del vocabulario', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'POST',
      url: '/activities/recommend',
      headers: authHeaders(app),
      payload: { profileId, categoria: 'deportes' },
    });
    expect(res.statusCode).toBe(400);
  });
});
