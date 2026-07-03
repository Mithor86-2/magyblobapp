import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { altaGuardian, authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';

/**
 * Test de integración del DoD de la Fase 3: el flujo completo por HTTP
 * (alta de adulto → crear perfil → POST /stories) usando dobles en memoria,
 * sin abrir puerto (app.inject) ni conectar a PostgreSQL.
 */
describe('POST /stories (integración)', () => {
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
    expect(guardian.statusCode).toBe(201);
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
    expect(profile.statusCode).toBe(201);
    return profile.json().id as string;
  }

  it('genera y persiste un cuento en el idioma del perfil', async () => {
    const profileId = await crearPerfil();

    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['animales'], estilos: ['aventura'] },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.profileId).toBe(profileId);
    expect(body.idioma).toBe('es');
    expect(body.estado).toBe('nuevo');
    expect(body.titulo).toContain('Mateo');
    expect(body.cuerpo.length).toBeGreaterThan(0);
    expect(body.proveedor).toBe('mock'); // el cuerpo HTTP incluye el proveedor (US-25)

    // Persistido en el repositorio de cuentos.
    const guardado = await handles.stories.findById(body.id as string);
    expect(guardado?.profileId).toBe(profileId);

    // Registró el evento de uso de primera parte.
    const evento = handles.events.items.find((e) => e.tipo === 'cuento_generado');
    expect(evento?.profileId).toBe(profileId);
  });

  it('devuelve 404 si el perfil no existe', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId: 'inexistente', temas: ['animales'], estilos: ['aventura'] },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.tipo).toBe('NotFoundError');
  });

  it('devuelve 400 ante un tema fuera del vocabulario', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['piratas'], estilos: ['aventura'] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('acepta varios temas y estilos (multi-selección, US-47)', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: {
        profileId,
        temas: ['animales', 'espacio'],
        estilos: ['aventura', 'divertido'],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    // Persistencia sin migración: se guarda el primero de cada lista (US-47).
    expect(body.tema).toBe('animales');
    expect(body.estilo).toBe('aventura');
  });

  it('devuelve 400 ante una lista de temas vacía', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: [], estilos: ['aventura'] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('US-69: acepta una enseñanza válida y la persiste/devuelve', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['animales'], estilos: ['aventura'], ensenanza: 'amistad' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().ensenanza).toBe('amistad');
    const guardado = await handles.stories.findById(res.json().id as string);
    expect(guardado?.ensenanza).toBe('amistad');
  });

  it('US-69: la enseñanza es opcional (201 sin ella)', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['animales'], estilos: ['aventura'] },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().ensenanza).toBeUndefined();
  });

  it('US-69: devuelve 400 ante una enseñanza fuera del vocabulario', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['animales'], estilos: ['aventura'], ensenanza: 'obediencia' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('US-76: acepta usarNombre=false y genera igualmente (201)', async () => {
    const profileId = await crearPerfil();
    const res = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['animales'], estilos: ['aventura'], usarNombre: false },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().cuerpo.length).toBeGreaterThan(0);
  });
});

describe('POST /stories/:id/continue (US-78, integración)', () => {
  let app: FastifyInstance;
  let handles: ReturnType<typeof makeInMemoryDeps>;

  beforeEach(async () => {
    handles = makeInMemoryDeps();
    app = await buildTestServer(handles.deps);
  });

  afterEach(async () => {
    await app.close();
  });

  async function crearPerfilYCuento(): Promise<{ profileId: string; storyId: string }> {
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
    const profileId = profile.json().id as string;
    const story = await app.inject({
      method: 'POST',
      url: '/stories',
      headers: authHeaders(app),
      payload: { profileId, temas: ['animales'], estilos: ['aventura'] },
    });
    return { profileId, storyId: story.json().id as string };
  }

  it('genera y persiste una continuación del cuento (201) y registra el evento', async () => {
    const { profileId, storyId } = await crearPerfilYCuento();
    const res = await app.inject({
      method: 'POST',
      url: `/stories/${storyId}/continue`,
      headers: authHeaders(app),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).not.toBe(storyId);
    expect(body.profileId).toBe(profileId);
    expect(body.tema).toBe('animales');
    // Enlace persistido (solo BD; no expuesto en el DTO).
    const guardado = await handles.stories.findById(body.id as string);
    expect(guardado?.continuacionDe).toBe(storyId);
    // Se registró un segundo evento de generación.
    const eventos = handles.events.items.filter((e) => e.tipo === 'cuento_generado');
    expect(eventos).toHaveLength(2);
  });

  it('devuelve 404 si el cuento origen no existe', async () => {
    await crearPerfilYCuento();
    const res = await app.inject({
      method: 'POST',
      url: '/stories/inexistente/continue',
      headers: authHeaders(app),
    });
    expect(res.statusCode).toBe(404);
  });
});
