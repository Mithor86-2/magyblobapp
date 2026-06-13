import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../domain/errors';
import { createApiGateways } from './http';

/**
 * Tests del adaptador HTTP (implementación de los gateways de domain). Se mockea
 * `fetch` global y se inyecta `baseUrl`: verificamos que cada operación arma la
 * petición correcta (URL, método, cabecera, cuerpo) y que el cuerpo de error del
 * backend se mapea a `ApiError` con su `tipo`.
 */

const BASE = 'http://localhost:3000';
const api = createApiGateways(BASE);

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

describe('createApiGateways (adaptador HTTP)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guardians.register hace POST /guardians con cuerpo JSON', async () => {
    const guardian = { id: 'g1', nombre: 'Ana', consentimientoDado: true };
    const fetchMock = vi.fn().mockResolvedValue(okResponse(guardian));
    vi.stubGlobal('fetch', fetchMock);

    const input = {
      nombre: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.com',
      parentesco: 'madre' as const,
      consentimientoAceptado: true,
      consentimientoVersion: '1.0',
    };
    const result = await api.guardians.register(input);

    expect(result).toEqual(guardian);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/guardians`);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body)).toEqual(input);
  });

  it('guardians.login hace POST /guardians/login con el email', async () => {
    const guardian = { id: 'g1', email: 'ana@example.com', consentimientoDado: true };
    const fetchMock = vi.fn().mockResolvedValue(okResponse(guardian));
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.guardians.login({ email: 'ana@example.com' });

    expect(result).toEqual(guardian);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/guardians/login`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ email: 'ana@example.com' });
  });

  it('profiles.list hace GET /guardians/:id/profiles', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([{ id: 'p1', nombre: 'Leo' }]));
    vi.stubGlobal('fetch', fetchMock);

    const out = await api.profiles.list('g1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/guardians/g1/profiles`);
    expect(options.method).toBe('GET');
    expect(out).toEqual([{ id: 'p1', nombre: 'Leo' }]);
  });

  it('profiles.create hace POST /profiles', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ id: 'p1' }));
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
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ id: 's1', titulo: 'Hola' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.stories.generate({ profileId: 'p1', tema: 'magia', estilo: 'aventura' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/stories`);
    expect(JSON.parse(options.body)).toEqual({
      profileId: 'p1',
      tema: 'magia',
      estilo: 'aventura',
    });
  });

  it('activities.recommend hace POST /activities/recommend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([{ id: 'a1', categoria: 'arte' }]));
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
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ id: 's1', estado: 'leido' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.stories.markRead('s1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/stories/s1/read`);
    expect(options.method).toBe('POST');
  });

  it('activities.complete hace POST /activities/:id/complete con la valoración', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ id: 'a1', valoracion: 3 }));
    vi.stubGlobal('fetch', fetchMock);

    await api.activities.complete('a1', 3);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/activities/a1/complete`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ valoracion: 3 });
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

  it('mapea un error del backend a ApiError con su tipo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(404, 'NotFoundError', 'Perfil no encontrado')),
    );

    await expect(
      api.stories.generate({ profileId: 'x', tema: 'magia', estilo: 'aventura' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      tipo: 'NotFoundError',
      message: 'Perfil no encontrado',
    });
  });

  it('un fallo de red se convierte en ApiError de tipo network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network request failed')));

    const error = await api.guardians
      .register({
        nombre: 'Ana',
        apellidos: 'Pérez',
        email: 'ana@example.com',
        parentesco: 'madre',
        consentimientoAceptado: true,
        consentimientoVersion: '1.0',
      })
      .catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('network');
    expect(error.status).toBe(0);
  });
});
