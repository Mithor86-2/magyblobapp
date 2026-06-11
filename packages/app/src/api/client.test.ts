import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createProfile, generateStory, registerGuardian } from './client';

/**
 * Tests del único punto de red de la app. Se mockea `fetch` global: verificamos
 * que cada función arma la petición correcta (URL, método, cabecera, cuerpo) y
 * que el cuerpo de error del backend se mapea a `ApiError` con su `tipo`.
 */

const BASE = 'http://localhost:3000';

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 201,
    json: async () => body,
  } as unknown as Response;
}

function errorResponse(status: number, tipo: string, mensaje: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error: { tipo, mensaje } }),
  } as unknown as Response;
}

describe('api client', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = BASE;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it('registerGuardian hace POST /guardians con cuerpo JSON', async () => {
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
    const result = await registerGuardian(input);

    expect(result).toEqual(guardian);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/guardians`);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body)).toEqual(input);
  });

  it('createProfile hace POST /profiles', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ id: 'p1' }));
    vi.stubGlobal('fetch', fetchMock);

    await createProfile({
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

  it('generateStory hace POST /stories', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ id: 's1', titulo: 'Hola' }));
    vi.stubGlobal('fetch', fetchMock);

    await generateStory({ profileId: 'p1', tema: 'magia', estilo: 'aventura' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/stories`);
    expect(JSON.parse(options.body)).toEqual({
      profileId: 'p1',
      tema: 'magia',
      estilo: 'aventura',
    });
  });

  it('mapea un error del backend a ApiError con su tipo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(404, 'NotFoundError', 'Perfil no encontrado')),
    );

    await expect(
      generateStory({ profileId: 'x', tema: 'magia', estilo: 'aventura' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      tipo: 'NotFoundError',
      message: 'Perfil no encontrado',
    });
  });

  it('un fallo de red se convierte en ApiError de tipo network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network request failed')));

    const error = await registerGuardian({
      nombre: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.com',
      parentesco: 'madre',
      consentimientoAceptado: true,
      consentimientoVersion: '1.0',
    }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.tipo).toBe('network');
    expect(error.status).toBe(0);
  });
});
