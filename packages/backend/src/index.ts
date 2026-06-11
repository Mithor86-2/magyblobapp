import { buildServer } from './server.js';
import { loadConfig } from './config.js';

/**
 * Punto de entrada del backend: levanta el servidor y registra apagado
 * ordenado ante SIGINT/SIGTERM (necesario para que docker pare limpio).
 */
async function main(): Promise<void> {
  const config = loadConfig();
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
