import type { AddressInfo } from 'node:net';

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config.js';
import { buildServer } from '../../src/server.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { CLAVE_DE_PRUEBA } from '../support/doubles.js';

/**
 * E2E del backend: arranca el servidor real (composición de producción, sin
 * dobles) contra un PostgreSQL real (Testcontainers) y recorre el flujo del MVP
 * por **HTTP real** en modo `AI_PROVIDER=mock` (contenido determinista, sin red).
 *
 * La narración (ElevenLabs) queda fuera del happy-path: es un servicio externo,
 * fuera del modo `mock` por cumplimiento; se comprueba como límite (falla sin
 * clave) más abajo.
 */
describe('E2E flujo MVP (servidor real + Postgres real por HTTP)', () => {
  let db: TestDb;
  let app: FastifyInstance;
  let baseUrl: string;

  beforeAll(async () => {
    db = await startTestDb();
    // El servidor de producción crea su propio PrismaClient leyendo DATABASE_URL
    // de env; lo apuntamos al contenedor antes de construirlo.
    process.env.DATABASE_URL = db.url;

    const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent', AI_PROVIDER: 'mock' });
    app = await buildServer(config); // sin deps → usa buildProductionDeps (Prisma real + MockProvider)
    await app.listen({ port: 0, host: '127.0.0.1' });
    const { port } = app.server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
    await db.stop();
  });

  async function http(
    method: string,
    path: string,
    body?: unknown,
    token?: string,
  ): Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (token !== undefined) headers.authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: Object.keys(headers).length === 0 ? undefined : headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, ok: res.ok, json: () => res.json() };
  }

  it('responde el health check', async () => {
    const res = await http('GET', '/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });

  it('recorre alta → login → perfil → cuento → historial → actividades', async () => {
    // 1) Alta del adulto + consentimiento
    const alta = await http('POST', '/guardians', {
      nombre: 'Ana',
      apellidos: 'García',
      email: 'ana.e2e@example.com',
      parentesco: 'madre',
      password: CLAVE_DE_PRUEBA,
      consentimientoAceptado: true,
      consentimientoVersion: 'v1',
    });
    expect(alta.status).toBe(201);
    const guardian = (await alta.json()) as { id: string; consentimientoDado: boolean };
    expect(guardian.consentimientoDado).toBe(true);

    // 2) Login con email + contraseña → recupera la cuenta y emite la sesión JWT (US-45/US-48)
    const login = await http('POST', '/guardians/login', {
      email: 'ana.e2e@example.com',
      password: CLAVE_DE_PRUEBA,
    });
    expect(login.status).toBe(200);
    const sesion = (await login.json()) as { id: string; accessToken: string };
    expect(sesion).toMatchObject({ id: guardian.id });
    expect(typeof sesion.accessToken).toBe('string');
    const token = sesion.accessToken;

    // 3) Crear perfil de niño (ruta protegida → con Bearer token)
    const altaPerfil = await http(
      'POST',
      '/profiles',
      {
        guardianId: guardian.id,
        nombre: 'Mateo',
        edad: 4,
        idioma: 'es',
        avatar: 'a1',
        intereses: ['animales'],
      },
      token,
    );
    expect(altaPerfil.status).toBe(201);
    const perfil = (await altaPerfil.json()) as { id: string };

    // 4) Listar perfiles del adulto
    const lista = await http('GET', `/guardians/${guardian.id}/profiles`, undefined, token);
    expect(lista.status).toBe(200);
    expect((await lista.json()) as unknown[]).toHaveLength(1);

    // 5) Generar cuento (mock determinista)
    const genera = await http(
      'POST',
      '/stories',
      { profileId: perfil.id, temas: ['animales'], estilos: ['aventura'] },
      token,
    );
    expect(genera.status).toBe(201);
    const story = (await genera.json()) as { id: string; titulo: string; proveedor: string };
    expect(story.titulo).toContain('Mateo');
    expect(story.proveedor).toBe('mock');

    // 6) El historial del perfil incluye el cuento recién creado (persistió)
    const historial = await http('GET', `/profiles/${perfil.id}/history`, undefined, token);
    expect(historial.status).toBe(200);
    const hist = (await historial.json()) as { stories: Array<{ id: string }> };
    expect(hist.stories.map((s) => s.id)).toContain(story.id);

    // 7) Recomendar actividades y marcar una como completada
    const recomienda = await http(
      'POST',
      '/activities/recommend',
      { profileId: perfil.id, cantidad: 2 },
      token,
    );
    expect(recomienda.status).toBe(201);
    const actividades = (await recomienda.json()) as Array<{ id: string }>;
    expect(actividades.length).toBeGreaterThan(0);

    const completa = await http(
      'POST',
      `/activities/${actividades[0].id}/complete`,
      { valoracion: 3 },
      token,
    );
    expect(completa.status).toBe(200);
    expect((await completa.json()) as { valoracion: number }).toMatchObject({ valoracion: 3 });

    // 8) Trazabilidad: el AuditLog registró consentimiento y login (vía BD real)
    const acciones = await db.prisma.auditLog.findMany({ where: { guardianId: guardian.id } });
    const tipos = acciones.map((a) => a.accion);
    expect(tipos).toContain('consentimiento');
    expect(tipos).toContain('login');
  });

  it('la narración requiere ElevenLabs (fuera del modo mock): falla sin clave', async () => {
    // Creamos un cuento y pedimos su audio; sin clave de ElevenLabs, no se sirve.
    const alta = await http('POST', '/guardians', {
      nombre: 'Bea',
      apellidos: 'Ruiz',
      email: 'bea.e2e@example.com',
      parentesco: 'madre',
      password: CLAVE_DE_PRUEBA,
      consentimientoAceptado: true,
      consentimientoVersion: 'v1',
    });
    const guardian = (await alta.json()) as { id: string };
    const login = await http('POST', '/guardians/login', {
      email: 'bea.e2e@example.com',
      password: CLAVE_DE_PRUEBA,
    });
    const { accessToken: token } = (await login.json()) as { accessToken: string };

    const perfilRes = await http(
      'POST',
      '/profiles',
      {
        guardianId: guardian.id,
        nombre: 'Lía',
        edad: 5,
        idioma: 'es',
        avatar: 'a2',
        intereses: ['magia'],
      },
      token,
    );
    const perfil = (await perfilRes.json()) as { id: string };
    const storyRes = await http(
      'POST',
      '/stories',
      { profileId: perfil.id, temas: ['magia'], estilos: ['divertido'] },
      token,
    );
    const story = (await storyRes.json()) as { id: string };

    const narracion = await http('GET', `/stories/${story.id}/narration`, undefined, token);
    expect(narracion.ok).toBe(false);
  });
});
