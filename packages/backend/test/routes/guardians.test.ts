import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestServer, makeInMemoryDeps } from '../support/server.js';

describe('rutas de guardians', () => {
  let app: FastifyInstance;
  let handles: ReturnType<typeof makeInMemoryDeps>;

  const altaValida = {
    nombre: 'Ana',
    apellidos: 'García',
    email: 'ana@example.com',
    parentesco: 'madre',
    consentimientoAceptado: true,
    consentimientoVersion: 'v1',
  };

  beforeEach(async () => {
    handles = makeInMemoryDeps();
    app = await buildTestServer(handles.deps);
  });

  afterEach(async () => {
    await app.close();
  });

  it('da de alta al adulto (201) y registra el consentimiento en el audit log', async () => {
    const res = await app.inject({ method: 'POST', url: '/guardians', payload: altaValida });
    expect(res.statusCode).toBe(201);
    expect(res.json().consentimientoDado).toBe(true);

    const consentimiento = handles.audit.items.find((a) => a.accion === 'consentimiento');
    expect(consentimiento?.entidad).toBe('Guardian');
  });

  it('rechaza el alta sin consentimiento (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/guardians',
      payload: { ...altaValida, email: 'otra@example.com', consentimientoAceptado: false },
    });
    expect(res.statusCode).toBe(400);
  });

  it('devuelve 409 si el email ya está registrado', async () => {
    await app.inject({ method: 'POST', url: '/guardians', payload: altaValida });
    const dup = await app.inject({ method: 'POST', url: '/guardians', payload: altaValida });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error.tipo).toBe('ConflictError');
  });

  it('rechaza un parentesco fuera del vocabulario (400, validación de esquema)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/guardians',
      payload: { ...altaValida, email: 'x@example.com', parentesco: 'vecino' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('lista los perfiles de un adulto', async () => {
    const guardian = await app.inject({
      method: 'POST',
      url: '/guardians',
      payload: { ...altaValida, email: 'lista@example.com' },
    });
    const guardianId = guardian.json().id as string;
    await app.inject({
      method: 'POST',
      url: '/profiles',
      payload: { guardianId, nombre: 'Leo', edad: 3, avatar: 'a2', intereses: ['espacio'] },
    });

    const res = await app.inject({ method: 'GET', url: `/guardians/${guardianId}/profiles` });
    expect(res.statusCode).toBe(200);
    const perfiles = res.json();
    expect(perfiles).toHaveLength(1);
    expect(perfiles[0].nombre).toBe('Leo');
  });
});
