import { loadConfig } from '../src/config.js';
import { buildServer } from '../src/server.js';
import { startTestDb, type TestDb } from '../test/support/db.js';

/**
 * Lanzador del backend para el E2E de la app (Playwright): arranca un PostgreSQL
 * efímero (Testcontainers), aplica migraciones y levanta el servidor Fastify real
 * en el puerto 3100 en modo `AI_PROVIDER=mock` (sin red ni IA externa). Queda a la
 * escucha hasta recibir SIGINT/SIGTERM (cuando Playwright cierra el `webServer`),
 * momento en que para el contenedor.
 */
const PORT = 3100;

async function main(): Promise<void> {
  const db: TestDb = await startTestDb();
  process.env.DATABASE_URL = db.url; // el server crea su PrismaClient leyendo esta env

  // Límites de tasa altos: el E2E hace muchas altas/login (varios tests + retries) y la
  // puerta parental (`GET /guardians/challenge`) + el alta cuentan contra el límite de
  // "registro" (US-92). Con el default de producción (5/hora) el E2E chocaría con un 429.
  const config = loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    AI_PROVIDER: 'mock',
    RATE_LIMIT_REGISTRO_MAX: '100000',
    RATE_LIMIT_LOGIN_MAX: '100000',
    RATE_LIMIT_REFRESH_MAX: '100000',
    RATE_LIMIT_VERIFY_MAX: '100000',
    RATE_LIMIT_RESEND_MAX: '100000',
  });
  const app = await buildServer(config);
  await app.listen({ port: PORT, host: '127.0.0.1' });
  console.log(`[e2e] backend listo en http://127.0.0.1:${PORT} (mock + Postgres efímero)`);

  const cerrar = (): void => {
    void (async () => {
      await app.close();
      await db.stop();
      process.exit(0);
    })();
  };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
}

void main();
