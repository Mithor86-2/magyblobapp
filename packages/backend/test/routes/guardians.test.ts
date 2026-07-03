import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  altaGuardian,
  authHeaders,
  buildTestServer,
  makeInMemoryDeps,
  retoParental,
  TEST_CONFIG,
} from '../support/server.js';
import { CLAVE_DE_PRUEBA } from '../support/doubles.js';

describe('rutas de guardians', () => {
  let app: FastifyInstance;
  let handles: ReturnType<typeof makeInMemoryDeps>;

  const PASSWORD = CLAVE_DE_PRUEBA;
  const EMAIL = 'ana@example.com';

  beforeEach(async () => {
    handles = makeInMemoryDeps();
    app = await buildTestServer(handles.deps);
  });

  afterEach(async () => {
    await app.close();
  });

  it('da de alta al adulto (201) y registra el consentimiento en el audit log', async () => {
    const res = await altaGuardian(app);
    expect(res.statusCode).toBe(201);
    expect(res.json().consentimientoDado).toBe(true);

    const consentimiento = handles.audit.items.find((a) => a.accion === 'consentimiento');
    expect(consentimiento?.entidad).toBe('Guardian');
  });

  it('rechaza el alta sin consentimiento (400)', async () => {
    const res = await altaGuardian(app, { consentimientoAceptado: false });
    expect(res.statusCode).toBe(400);
  });

  it('devuelve 409 si el email ya está registrado', async () => {
    await altaGuardian(app);
    const dup = await altaGuardian(app);
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error.tipo).toBe('ConflictError');
  });

  it('rechaza un parentesco fuera del vocabulario (400, validación de esquema)', async () => {
    const res = await altaGuardian(app, { parentesco: 'vecino' });
    expect(res.statusCode).toBe(400);
  });

  it('rechaza el alta con una contraseña demasiado corta (400, validación de esquema)', async () => {
    const res = await altaGuardian(app, { password: 'corta' });
    expect(res.statusCode).toBe(400);
  });

  it('rechaza el alta con una contraseña sin número (US-53: letra + número)', async () => {
    const res = await altaGuardian(app, { password: 'sololetras' });
    expect(res.statusCode).toBe(400);
  });

  it('rechaza el alta con una contraseña sin letra (US-53: letra + número)', async () => {
    const res = await altaGuardian(app, { password: '12345678' });
    expect(res.statusCode).toBe(400);
  });

  it('rechaza el alta con un email de formato inválido (400, validación de esquema US-53)', async () => {
    const res = await altaGuardian(app, { email: 'no-es-email' });
    expect(res.statusCode).toBe(400);
  });

  it('emite un reto de puerta parental (US-92)', async () => {
    const res = await app.inject({ method: 'GET', url: '/guardians/challenge' });
    expect(res.statusCode).toBe(200);
    const { pregunta, challengeToken } = res.json();
    expect(pregunta).toMatch(/\d{1,2} \+ \d{1,2}/);
    expect(typeof challengeToken).toBe('string');
    expect(challengeToken).toContain('.');
  });

  it('rechaza el alta sin la puerta parental (400, validación de esquema US-92)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/guardians',
      payload: {
        nombre: 'Ana',
        apellidos: 'García',
        email: 'sinreto@example.com',
        parentesco: 'madre',
        password: PASSWORD,
        consentimientoAceptado: true,
        consentimientoVersion: 'v1',
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rechaza el alta con la respuesta del reto incorrecta (400, US-92)', async () => {
    const { challengeToken, challengeRespuesta } = await retoParental(app);
    const res = await app.inject({
      method: 'POST',
      url: '/guardians',
      payload: {
        nombre: 'Ana',
        apellidos: 'García',
        email: 'malreto@example.com',
        parentesco: 'madre',
        password: PASSWORD,
        consentimientoAceptado: true,
        consentimientoVersion: 'v1',
        challengeToken,
        challengeRespuesta: challengeRespuesta + 1,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.tipo).toBe('ParentalChallengeError');
  });

  it('inicia sesión con email + contraseña correctos (200) y registra el login en el audit log', async () => {
    await altaGuardian(app);

    const res = await app.inject({
      method: 'POST',
      url: '/guardians/login',
      payload: { email: EMAIL, password: PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe(EMAIL);

    const login = handles.audit.items.find((a) => a.accion === 'login');
    expect(login?.entidad).toBe('Guardian');
    expect(login?.guardianId).toBe(res.json().id);
  });

  it('devuelve 401 genérico al iniciar sesión con la contraseña incorrecta', async () => {
    await altaGuardian(app);

    const res = await app.inject({
      method: 'POST',
      url: '/guardians/login',
      payload: { email: EMAIL, password: 'incorrecta' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.tipo).toBe('InvalidCredentialsError');
  });

  it('devuelve el mismo 401 al iniciar sesión con un email no registrado (no filtra cuál falló)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/guardians/login',
      payload: { email: 'desconocido@example.com', password: PASSWORD },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.tipo).toBe('InvalidCredentialsError');
  });

  it('rechaza un email con formato inválido al iniciar sesión (400, validación de esquema)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/guardians/login',
      payload: { email: 'no-es-email', password: PASSWORD },
    });
    expect(res.statusCode).toBe(400);
  });

  it('aplica rate limiting al login: 429 al superar el umbral (US-92)', async () => {
    // Servidor con un límite de login minúsculo para ejercitar el 429.
    const config = {
      ...TEST_CONFIG,
      security: {
        ...TEST_CONFIG.security,
        rateLimit: {
          ...TEST_CONFIG.security.rateLimit,
          login: { max: 3, ventanaMs: 60_000 },
        },
      },
    };
    const appLimitado = await buildTestServer(handles.deps, config);
    try {
      const intento = () =>
        appLimitado.inject({
          method: 'POST',
          url: '/guardians/login',
          payload: { email: 'nadie@example.com', password: 'incorrecta' },
        });
      // Los primeros `max` intentos se procesan (401); el siguiente se corta con 429.
      for (let i = 0; i < 3; i++) {
        const r = await intento();
        expect(r.statusCode).toBe(401);
      }
      const bloqueado = await intento();
      expect(bloqueado.statusCode).toBe(429);
      expect(bloqueado.json().error.tipo).toBe('TooManyRequestsError');
    } finally {
      await appLimitado.close();
    }
  });

  it('lista los perfiles de un adulto', async () => {
    const guardian = await altaGuardian(app, { email: 'lista@example.com' });
    const guardianId = guardian.json().id as string;
    await app.inject({
      method: 'POST',
      url: '/profiles',
      headers: authHeaders(app),
      payload: { guardianId, nombre: 'Leo', edad: 3, avatar: 'a2', intereses: ['espacio'] },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/guardians/${guardianId}/profiles`,
      headers: authHeaders(app),
    });
    expect(res.statusCode).toBe(200);
    const perfiles = res.json();
    expect(perfiles).toHaveLength(1);
    expect(perfiles[0].nombre).toBe('Leo');
  });
});
