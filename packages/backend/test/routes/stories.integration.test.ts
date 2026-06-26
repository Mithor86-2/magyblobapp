import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { authHeaders, buildTestServer, makeInMemoryDeps } from '../support/server.js';
import { CLAVE_DE_PRUEBA } from '../support/doubles.js';

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
});
