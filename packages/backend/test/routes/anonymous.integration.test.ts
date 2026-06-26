import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestServer, makeInMemoryDeps } from '../support/server.js';

/**
 * Modo anónimo efímero (US-50): rutas **públicas** (sin token) que generan y
 * devuelven contenido **sin persistir nada**, con rate-limit en memoria (3
 * cuentos + 3 actividades por cliente → 429 al superarlo). El cliente de
 * `app.inject` comparte una sola IP, así que el límite se ejercita en serie.
 */
describe('Rutas anónimas (integración, US-50)', () => {
  let app: FastifyInstance;
  let handles: ReturnType<typeof makeInMemoryDeps>;

  beforeEach(async () => {
    handles = makeInMemoryDeps();
    app = await buildTestServer(handles.deps);
  });

  afterEach(async () => {
    await app.close();
  });

  it('genera un cuento sin token ni profileId y no persiste nada', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/stories/anonymous',
      payload: { edad: 4, idioma: 'es', temas: ['animales'], estilos: ['aventura'] },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.titulo.length).toBeGreaterThan(0);
    expect(body.cuerpo.length).toBeGreaterThan(0);
    expect(body.idioma).toBe('es');
    expect(body.proveedor).toBe('mock');
    expect(body.id).toBeUndefined();
    expect(body.profileId).toBeUndefined();

    // Nada se ha persistido en el repositorio de cuentos.
    expect(handles.stories.items.size).toBe(0);
  });

  it('recomienda actividades sin token ni profileId y no persiste nada', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/activities/recommend/anonymous',
      payload: { edad: 5, categoria: 'arte', cantidad: 2 },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveLength(2);
    expect(body[0].profileId).toBeUndefined();
    expect(handles.activities.items.size).toBe(0);
  });

  it('devuelve 429 al superar el límite de 3 cuentos', async () => {
    const payload = { edad: 4, temas: ['animales'], estilos: ['aventura'] };
    for (let i = 0; i < 3; i++) {
      const ok = await app.inject({ method: 'POST', url: '/stories/anonymous', payload });
      expect(ok.statusCode).toBe(201);
    }
    const limite = await app.inject({ method: 'POST', url: '/stories/anonymous', payload });
    expect(limite.statusCode).toBe(429);
    expect(limite.json().error.tipo).toBe('TooManyRequestsError');
  });

  it('devuelve 429 al superar el límite de 3 actividades', async () => {
    const payload = { edad: 4 };
    for (let i = 0; i < 3; i++) {
      const ok = await app.inject({
        method: 'POST',
        url: '/activities/recommend/anonymous',
        payload,
      });
      expect(ok.statusCode).toBe(201);
    }
    const limite = await app.inject({
      method: 'POST',
      url: '/activities/recommend/anonymous',
      payload,
    });
    expect(limite.statusCode).toBe(429);
  });

  it('devuelve 400 ante un tema fuera del vocabulario', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/stories/anonymous',
      payload: { edad: 4, temas: ['piratas'], estilos: ['aventura'] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('devuelve 400 ante una edad fuera de rango', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/activities/recommend/anonymous',
      payload: { edad: 99 },
    });
    expect(res.statusCode).toBe(400);
  });
});
