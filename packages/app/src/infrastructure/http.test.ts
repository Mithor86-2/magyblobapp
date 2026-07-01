import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../domain/errors';
import { createApiGateways, getBaseUrl, warmUp } from './http';

/**
 * Tests del adaptador HTTP (implementación de los gateways de domain). Se mockea
 * `fetch` global y se inyecta `baseUrl`: verificamos que cada operación arma la
 * petición correcta (URL, método, cabecera, cuerpo) y que el cuerpo de error del
 * backend se mapea a `ApiError` con su `tipo`.
 */

const BASE = 'http://localhost:3000';
const api = createApiGateways(BASE);

// Fixtures completos: desde US-44 el adaptador valida las respuestas con Zod, así que
// los cuerpos mockeados deben cumplir el contrato del backend (no valen objetos parciales).
const GUARDIAN = {
  id: 'g1',
  nombre: 'Ana',
  apellidos: 'Pérez',
  email: 'ana@example.com',
  parentesco: 'madre',
  consentimientoDado: true,
} as const;
// Alta/login devuelven el guardián + la sesión JWT (US-45).
const GUARDIAN_SESSION = { ...GUARDIAN, accessToken: 'at-1', refreshToken: 'rt-1' } as const;
const PROFILE = {
  id: 'p1',
  guardianId: 'g1',
  nombre: 'Leo',
  edad: 4,
  idioma: 'es',
  avatar: 'zorro',
  intereses: ['animales'],
} as const;
const STORY = {
  id: 's1',
  profileId: 'p1',
  tema: 'magia',
  estilo: 'aventura',
  titulo: 'Hola',
  cuerpo: 'Érase una vez.',
  idioma: 'es',
  estado: 'nuevo',
  proveedor: 'mock',
} as const;
const ACTIVITY = {
  id: 'a1',
  profileId: 'p1',
  categoria: 'arte',
  titulo: 'Pintar',
  descripcion: 'Pinta con los dedos.',
  proveedor: 'mock',
} as const;

function okResponse(body: unknown): Response {
  return { ok: true, status: 201, json: async () => body } as unknown as Response;
}

function errorResponse(status: number, tipo: string, mensaje: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error: { tipo, mensaje } }),
  } as unknown as Response;
}

describe('getBaseUrl', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = original;
  });

  it('usa EXPO_PUBLIC_API_URL cuando está definida', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://10.0.0.5:3000';
    expect(getBaseUrl()).toBe('http://10.0.0.5:3000');
  });

  it('cae a localhost:3000 cuando no está definida', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });
});

describe('createApiGateways (adaptador HTTP)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guardians.register hace POST /guardians con cuerpo JSON y devuelve la sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(GUARDIAN_SESSION));
    vi.stubGlobal('fetch', fetchMock);

    const input = {
      nombre: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.com',
      parentesco: 'madre' as const,
      password: 'Contrasena123',
      consentimientoAceptado: true,
      consentimientoVersion: '1.0',
    };
    const result = await api.guardians.register(input);

    expect(result).toEqual(GUARDIAN_SESSION);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/guardians`);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body)).toEqual(input);
  });

  it('guardians.login hace POST /guardians/login con email + contraseña y devuelve la sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(GUARDIAN_SESSION));
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.guardians.login({
      email: 'ana@example.com',
      password: 'Contrasena123',
    });

    expect(result).toEqual(GUARDIAN_SESSION);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/guardians/login`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      email: 'ana@example.com',
      password: 'Contrasena123',
    });
  });

  it('profiles.list hace GET /guardians/:id/profiles', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([PROFILE]));
    vi.stubGlobal('fetch', fetchMock);

    const out = await api.profiles.list('g1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/guardians/g1/profiles`);
    expect(options.method).toBe('GET');
    expect(out).toEqual([PROFILE]);
  });

  it('profiles.create hace POST /profiles', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(PROFILE));
    vi.stubGlobal('fetch', fetchMock);

    await api.profiles.create({
      guardianId: 'g1',
      nombre: 'Leo',
      edad: 4,
      avatar: 'zorro',
      intereses: ['animales'],
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/profiles`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).intereses).toEqual(['animales']);
  });

  it('stories.generate hace POST /stories', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(STORY));
    vi.stubGlobal('fetch', fetchMock);

    await api.stories.generate({ profileId: 'p1', temas: ['magia'], estilos: ['aventura'] });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/stories`);
    expect(JSON.parse(options.body)).toEqual({
      profileId: 'p1',
      temas: ['magia'],
      estilos: ['aventura'],
    });
  });

  it('stories.generateAnonymous hace POST /stories/anonymous sin token (US-50)', async () => {
    const anonStory = {
      tema: 'magia',
      estilo: 'aventura',
      titulo: 'Hola',
      cuerpo: 'Érase una vez.',
      idioma: 'es',
      proveedor: 'mock',
    };
    const fetchMock = vi.fn().mockResolvedValue(okResponse(anonStory));
    vi.stubGlobal('fetch', fetchMock);

    const out = await api.stories.generateAnonymous({
      edad: 4,
      temas: ['magia'],
      estilos: ['aventura'],
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/stories/anonymous`);
    expect(options.method).toBe('POST');
    // Ruta pública: no se adjunta cabecera Authorization.
    expect(options.headers?.Authorization).toBeUndefined();
    expect(JSON.parse(options.body)).toEqual({ edad: 4, temas: ['magia'], estilos: ['aventura'] });
    expect(out).not.toHaveProperty('profileId');
  });

  it('activities.recommendAnonymous hace POST /activities/recommend/anonymous (US-50)', async () => {
    const anonActivity = {
      categoria: 'arte',
      titulo: 'Pintar',
      descripcion: 'Pinta con los dedos.',
      proveedor: 'mock',
    };
    const fetchMock = vi.fn().mockResolvedValue(okResponse([anonActivity]));
    vi.stubGlobal('fetch', fetchMock);

    await api.activities.recommendAnonymous({ edad: 5, categoria: 'arte', cantidad: 2 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/activities/recommend/anonymous`);
    expect(options.headers?.Authorization).toBeUndefined();
    expect(JSON.parse(options.body)).toEqual({ edad: 5, categoria: 'arte', cantidad: 2 });
  });

  it('activities.recommend hace POST /activities/recommend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([ACTIVITY]));
    vi.stubGlobal('fetch', fetchMock);

    await api.activities.recommend({ profileId: 'p1', categoria: 'musica', cantidad: 2 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/activities/recommend`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      profileId: 'p1',
      categoria: 'musica',
      cantidad: 2,
    });
  });

  it('stories.markRead hace POST /stories/:id/read', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ...STORY, estado: 'leido' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.stories.markRead('s1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/stories/s1/read`);
    expect(options.method).toBe('POST');
  });

  it('stories.setFavorite hace POST /stories/:id/favorite con { favorito } (US-64)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ...STORY, favorito: true }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await api.stories.setFavorite('s1', true);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/stories/s1/favorite`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ favorito: true });
    expect(out.favorito).toBe(true);
  });

  it('stories.narrationUrl construye la URL del audio sin hacer red', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const url = api.stories.narrationUrl('s1');

    expect(url).toBe(`${BASE}/stories/s1/narration`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('activities.complete hace POST /activities/:id/complete con la valoración', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ...ACTIVITY, valoracion: 3 }));
    vi.stubGlobal('fetch', fetchMock);

    await api.activities.complete('a1', 3);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/activities/a1/complete`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ valoracion: 3 });
  });

  it('activities.setFavorite hace POST /activities/:id/favorite con { favorito } (US-64)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ ...ACTIVITY, favorito: true }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await api.activities.setFavorite('a1', true);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/activities/a1/favorite`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ favorito: true });
    expect(out.favorito).toBe(true);
  });

  it('history.get hace GET /profiles/:id/history', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ stories: [], activities: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await api.history.get('p1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/profiles/p1/history`);
    expect(options.method).toBe('GET');
    expect(out).toEqual({ stories: [], activities: [] });
  });

  it('achievements.get hace GET /profiles/:id/achievements (US-68)', async () => {
    const logros = [
      { clave: 'primer_cuento', categoria: 'cuentos', meta: 1, progreso: 1, conseguido: true },
    ];
    const fetchMock = vi.fn().mockResolvedValue(okResponse(logros));
    vi.stubGlobal('fetch', fetchMock);

    const out = await api.achievements.get('p1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/profiles/p1/achievements`);
    expect(options.method).toBe('GET');
    expect(out).toEqual(logros);
  });

  it('mapea un error del backend a ApiError con su tipo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(404, 'NotFoundError', 'Perfil no encontrado')),
    );

    await expect(
      api.stories.generate({ profileId: 'x', temas: ['magia'], estilos: ['aventura'] }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      tipo: 'NotFoundError',
      message: 'Perfil no encontrado',
    });
  });

  it('usa tipo y mensaje por defecto cuando el cuerpo de error no los trae', async () => {
    // Respuesta de error sin el envoltorio `{ error: { tipo, mensaje } }`.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response),
    );

    await expect(api.history.get('p1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      tipo: 'http',
      message: 'Error 500',
    });
  });

  it('tolera un cuerpo de error que no es JSON (json() rechaza)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('no es JSON');
        },
      } as unknown as Response),
    );

    await expect(api.history.get('p1')).rejects.toMatchObject({
      status: 502,
      tipo: 'http',
      message: 'Error 502',
    });
  });

  it('un fallo de red se convierte en ApiError de tipo network (tras agotar reintentos)', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network request failed'));
    vi.stubGlobal('fetch', fetchMock);

    const pending = api.guardians
      .register({
        nombre: 'Ana',
        apellidos: 'Pérez',
        email: 'ana@example.com',
        parentesco: 'madre',
        password: 'Contrasena123',
        consentimientoAceptado: true,
        consentimientoVersion: '1.0',
      })
      .catch((e) => e);
    // Backoff de los 2 reintentos (500 ms + 1000 ms) ante `network` (US-53).
    await vi.advanceTimersByTimeAsync(2_000);
    const error = await pending;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('network');
    expect(error.status).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 intento + 2 reintentos
    vi.useRealTimers();
  });

  it('reintenta tras un fallo de red transitorio y tiene éxito en el 2º intento (US-53)', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(okResponse(STORY));
    vi.stubGlobal('fetch', fetchMock);

    const pending = api.stories
      .generate({ profileId: 'p1', temas: ['magia'], estilos: ['aventura'] })
      .catch((e) => e);
    await vi.advanceTimersByTimeAsync(500); // primer backoff
    const out = await pending;

    expect(out).toEqual(STORY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('no reintenta ante un error HTTP del backend (no es transitorio, US-53)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(errorResponse(404, 'NotFoundError', 'Perfil no encontrado'));
    vi.stubGlobal('fetch', fetchMock);

    const error = await api.stories
      .generate({ profileId: 'x', temas: ['magia'], estilos: ['aventura'] })
      .catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1); // sin reintentos
  });

  it('una petición que excede el timeout se aborta y da ApiError de tipo timeout', async () => {
    vi.useFakeTimers();
    // fetch nunca resuelve por sí solo: solo rechaza cuando el AbortController dispara `abort`.
    const fetchMock = vi.fn(
      (_url: string, opts: { signal: AbortSignal }) =>
        new Promise<Response>((_, reject) => {
          opts.signal.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const pending = api.stories
      .generate({ profileId: 'p1', temas: ['magia'], estilos: ['aventura'] })
      .catch((e) => e);
    // Generación usa 90 s de timeout; ante `timeout` se reintenta hasta 2 veces con
    // backoff (500 ms, 1000 ms): hay que dejar correr los 3 intentos completos (US-53).
    await vi.advanceTimersByTimeAsync(90_000 * 3 + 500 + 1000);
    const error = await pending;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('timeout');
    expect(error.status).toBe(0);
    // 1 intento + 2 reintentos = 3 llamadas a fetch.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it('una petición que responde antes del timeout no se aborta', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(okResponse(STORY));
    vi.stubGlobal('fetch', fetchMock);

    const story = await api.stories.generate({
      profileId: 'p1',
      temas: ['magia'],
      estilos: ['aventura'],
    });

    expect(story).toEqual(STORY);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    vi.useRealTimers();
  });

  it('una respuesta OK con forma inesperada da ApiError de tipo malformed', async () => {
    // El backend responde 200 pero con un cuerpo que no cumple el contrato (faltan campos).
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ id: 's1', titulo: 'Hola' })));

    const error = await api.stories
      .generate({ profileId: 'p1', temas: ['magia'], estilos: ['aventura'] })
      .catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('malformed');
  });

  it('una lista con un elemento inválido da ApiError de tipo malformed', async () => {
    // Un perfil válido y otro con `edad` no numérica: la validación rechaza toda la respuesta.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(okResponse([PROFILE, { ...PROFILE, edad: 'cuatro' }])),
    );

    const error = await api.profiles.list('g1').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('malformed');
  });
});

describe('warmUp (ping de arranque, US-53)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hace un ping GET a /health sin bloquear ni lanzar', () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ status: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    expect(() => warmUp(BASE)).not.toThrow();
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/health`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('no hace nada si fetch no está disponible', () => {
    vi.stubGlobal('fetch', undefined);
    expect(() => warmUp(BASE)).not.toThrow();
  });
});

describe('sesión autenticada (US-45)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fakeSession(tokens: { accessToken: string | null; refreshToken: string | null }) {
    return {
      getAccessToken: vi.fn(() => tokens.accessToken),
      getRefreshToken: vi.fn(() => tokens.refreshToken),
      setTokens: vi.fn(),
      onAuthExpired: vi.fn(),
    };
  }

  it('adjunta Authorization: Bearer en las rutas protegidas cuando hay sesión', async () => {
    const session = fakeSession({ accessToken: 'at-1', refreshToken: 'rt-1' });
    const authed = createApiGateways(BASE, session);
    const fetchMock = vi.fn().mockResolvedValue(okResponse([PROFILE]));
    vi.stubGlobal('fetch', fetchMock);

    await authed.profiles.list('g1');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer at-1');
  });

  it('no adjunta Authorization si la sesión no tiene access token', async () => {
    const session = fakeSession({ accessToken: null, refreshToken: 'rt-1' });
    const authed = createApiGateways(BASE, session);
    const fetchMock = vi.fn().mockResolvedValue(okResponse([PROFILE]));
    vi.stubGlobal('fetch', fetchMock);

    await authed.profiles.list('g1');

    // GET sin token ni cuerpo → sin cabeceras.
    expect(fetchMock.mock.calls[0][1].headers).toBeUndefined();
  });

  it('ante un 401 renueva el token con el refresh y reintenta una vez', async () => {
    const session = fakeSession({ accessToken: 'at-old', refreshToken: 'rt-1' });
    const authed = createApiGateways(BASE, session);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, 'UnauthorizedError', 'No autorizado'))
      .mockResolvedValueOnce(okResponse({ accessToken: 'at-new', refreshToken: 'rt-new' }))
      .mockResolvedValueOnce(okResponse([PROFILE]));
    vi.stubGlobal('fetch', fetchMock);

    const out = await authed.profiles.list('g1');

    expect(out).toEqual([PROFILE]);
    expect(session.setTokens).toHaveBeenCalledWith({
      accessToken: 'at-new',
      refreshToken: 'rt-new',
    });
    expect(session.onAuthExpired).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[1][0]).toBe(`${BASE}/guardians/refresh`);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer at-new');
  });

  it('ante un 401, si la renovación falla, cierra la sesión y propaga el error', async () => {
    const session = fakeSession({ accessToken: 'at-old', refreshToken: 'rt-1' });
    const authed = createApiGateways(BASE, session);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, 'UnauthorizedError', 'No autorizado'))
      .mockResolvedValueOnce(errorResponse(401, 'UnauthorizedError', 'expirado'));
    vi.stubGlobal('fetch', fetchMock);

    const error = await authed.profiles.list('g1').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(session.onAuthExpired).toHaveBeenCalledTimes(1);
    expect(session.setTokens).not.toHaveBeenCalled();
  });

  it('ante un 401 sin refresh token, cierra la sesión sin intentar renovar', async () => {
    const session = fakeSession({ accessToken: 'at-old', refreshToken: null });
    const authed = createApiGateways(BASE, session);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(401, 'UnauthorizedError', 'No autorizado'));
    vi.stubGlobal('fetch', fetchMock);

    const error = await authed.profiles.list('g1').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(session.onAuthExpired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no hubo intento de refresh
  });

  it('sin sesión inyectada, un 401 se propaga sin intentar renovar', async () => {
    const anon = createApiGateways(BASE);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(401, 'UnauthorizedError', 'No autorizado')),
    );

    const error = await anon.profiles.list('g1').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
  });

  it('guardians.refresh hace POST /guardians/refresh y devuelve los tokens', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ accessToken: 'at-x', refreshToken: 'rt-x' }));
    vi.stubGlobal('fetch', fetchMock);

    const tokens = await createApiGateways(BASE).guardians.refresh('rt-1');

    expect(tokens).toEqual({ accessToken: 'at-x', refreshToken: 'rt-x' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/guardians/refresh`);
    expect(JSON.parse(options.body)).toEqual({ refreshToken: 'rt-1' });
  });

  it('guardians.refresh con un fallo de red da ApiError de tipo network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network request failed')));

    const error = await createApiGateways(BASE)
      .guardians.refresh('rt-1')
      .catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('network');
  });

  it('guardians.refresh con una respuesta malformada da ApiError de tipo malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ accessToken: 'solo-uno' })));

    const error = await createApiGateways(BASE)
      .guardians.refresh('rt-1')
      .catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('malformed');
  });

  it('guardians.refresh aborta por timeout (network)', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: string, opts: { signal: AbortSignal }) =>
        new Promise<Response>((_, reject) => {
          opts.signal.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const pending = createApiGateways(BASE)
      .guardians.refresh('rt-1')
      .catch((e) => e);
    await vi.advanceTimersByTimeAsync(30_000);
    const error = await pending;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('network');
    vi.useRealTimers();
  });
});
