import Fastify, { type FastifyInstance } from 'fastify';
import { loadConfig, type Config } from './config.js';
import { healthRoutes } from './routes/health.js';

/**
 * Construye una instancia de Fastify lista para usar. No la arranca: así los
 * tests pueden usar `app.inject(...)` sin abrir un puerto real.
 */
export async function buildServer(config: Config = loadConfig()): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            }
          : undefined,
    },
  });

  await app.register(healthRoutes);

  return app;
}
