import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { altaGuardian, authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';

describe('rutas de profiles', () => {
  let app: FastifyInstance;
  let handles: ReturnType<typeof makeInMemoryDeps>;

  beforeEach(async () => {
    handles = makeInMemoryDeps();
    app = await buildTestServer(handles.deps);
  });

  afterEach(async () => {
    await app.close();
  });

  async function altaAdulto(): Promise<string> {
    const res = await altaGuardian(app);
    return res.json().id as string;
  }

  const perfil = (guardianId: string) => ({
    guardianId,
    nombre: 'Mateo',
    edad: 4,
    idioma: 'es',
    avatar: 'a1',
    intereses: ['animales', 'espacio'],
  });

  it('crea un perfil (201) y registra la acción en el audit log', async () => {
    const guardianId = await altaAdulto();
    const res = await app.inject({
      method: 'POST',
      url: '/profiles',
      headers: authHeaders(app),
      payload: perfil(guardianId),
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().edad).toBe(4);
    expect(handles.audit.items.some((a) => a.accion === 'crear')).toBe(true);
  });

  it('devuelve 404 si el adulto no existe', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/profiles',
      headers: authHeaders(app),
      payload: perfil('inexistente'),
    });
    expect(res.statusCode).toBe(404);
  });

  it('rechaza una edad fuera de rango (400, validación de esquema)', async () => {
    const guardianId = await altaAdulto();
    const res = await app.inject({
      method: 'POST',
      url: '/profiles',
      headers: authHeaders(app),
      payload: { ...perfil(guardianId), edad: 9 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rechaza un interés fuera del vocabulario (400)', async () => {
    const guardianId = await altaAdulto();
    const res = await app.inject({
      method: 'POST',
      url: '/profiles',
      headers: authHeaders(app),
      payload: { ...perfil(guardianId), intereses: ['dinosaurios'] },
    });
    expect(res.statusCode).toBe(400);
  });
});
