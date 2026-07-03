import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { altaGuardian, buildTestServer, makeInMemoryDeps } from '../support/server.js';
import { CLAVE_DE_PRUEBA } from '../support/doubles.js';
import type { TokenPayload } from '../../src/auth.js';

/**
 * Autenticación de la sesión con JWT (US-45): el login emite access + refresh,
 * las rutas de datos exigen un access token válido (401 si falta o es inválido),
 * y `/guardians/refresh` renueva el access desde un refresh válido.
 */
describe('autenticación JWT (US-45)', () => {
  let app: FastifyInstance;
  let handles: ReturnType<typeof makeInMemoryDeps>;

  const PASSWORD = CLAVE_DE_PRUEBA;
  const altaValida = {
    nombre: 'Ana',
    apellidos: 'García',
    email: 'ana@example.com',
    parentesco: 'madre',
    password: PASSWORD,
    consentimientoAceptado: true,
    consentimientoVersion: 'v1',
  };

  beforeEach(async () => {
    handles = makeInMemoryDeps();
    app = await buildTestServer(handles.deps);
    await altaGuardian(app, altaValida);
  });

  afterEach(async () => {
    await app.close();
  });

  async function login(): Promise<{ id: string; accessToken: string; refreshToken: string }> {
    const res = await app.inject({
      method: 'POST',
      url: '/guardians/login',
      payload: { email: altaValida.email, password: PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    return res.json();
  }

  it('el login emite un access token y un refresh token con su claim type', async () => {
    const sesion = await login();
    expect(typeof sesion.accessToken).toBe('string');
    expect(typeof sesion.refreshToken).toBe('string');

    const access = app.jwt.decode<TokenPayload>(sesion.accessToken);
    const refresh = app.jwt.decode<TokenPayload>(sesion.refreshToken);
    expect(access).toMatchObject({
      guardianId: sesion.id,
      email: altaValida.email,
      type: 'access',
    });
    expect(refresh?.type).toBe('refresh');
  });

  it('una ruta protegida responde 401 sin token', async () => {
    const res = await app.inject({ method: 'GET', url: `/guardians/${'x'}/profiles` });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.tipo).toBe('UnauthorizedError');
  });

  it('una ruta protegida responde 401 con un token inválido', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/guardians/${'x'}/profiles`,
      headers: { authorization: 'Bearer no-es-un-jwt' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('una ruta protegida responde 200 con un access token válido', async () => {
    const sesion = await login();
    const res = await app.inject({
      method: 'GET',
      url: `/guardians/${sesion.id}/profiles`,
      headers: { authorization: `Bearer ${sesion.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('rechaza (401) usar un refresh token como access token', async () => {
    const sesion = await login();
    const res = await app.inject({
      method: 'GET',
      url: `/guardians/${sesion.id}/profiles`,
      headers: { authorization: `Bearer ${sesion.refreshToken}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('renueva el access token con un refresh válido (200) y el nuevo access funciona', async () => {
    const sesion = await login();
    const refrescado = await app.inject({
      method: 'POST',
      url: '/guardians/refresh',
      payload: { refreshToken: sesion.refreshToken },
    });
    expect(refrescado.statusCode).toBe(200);
    const nuevo = refrescado.json() as { accessToken: string; refreshToken: string };
    expect(typeof nuevo.accessToken).toBe('string');
    expect(app.jwt.decode<TokenPayload>(nuevo.accessToken)?.type).toBe('access');

    const protegido = await app.inject({
      method: 'GET',
      url: `/guardians/${sesion.id}/profiles`,
      headers: { authorization: `Bearer ${nuevo.accessToken}` },
    });
    expect(protegido.statusCode).toBe(200);
  });

  it('rechaza el refresh con un token inválido (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/guardians/refresh',
      payload: { refreshToken: 'no-es-un-jwt' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rechaza el refresh usando un access token como refresh (401)', async () => {
    const sesion = await login();
    const res = await app.inject({
      method: 'POST',
      url: '/guardians/refresh',
      payload: { refreshToken: sesion.accessToken },
    });
    expect(res.statusCode).toBe(401);
  });
});
