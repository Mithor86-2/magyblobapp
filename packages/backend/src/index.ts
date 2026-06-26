import { buildServer } from './server.js';
import { ConfigError, loadConfig } from './config.js';

/**
 * Carga la config y **aborta el arranque** (`exit 1`) con un mensaje claro si la
 * validación Zod falla (variable requerida ausente o inválida), antes de intentar
 * levantar el servidor. Un fallo opaco más tarde (Prisma, JWT) es peor que esto.
 */
function loadConfigOrExit(): ReturnType<typeof loadConfig> {
  try {
    return loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

/**
 * Punto de entrada del backend: levanta el servidor y registra apagado
 * ordenado ante SIGINT/SIGTERM (necesario para que docker pare limpio).
 */
async function main(): Promise<void> {
  const config = loadConfigOrExit();
  const app = await buildServer(config);

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      app.log.info(`Recibido ${signal}, cerrando...`);
      void app.close().then(() => process.exit(0));
    });
  }

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
