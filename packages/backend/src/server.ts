import Fastify, { type FastifyInstance } from 'fastify';
import { loadConfig, type Config } from './config.js';
import type { AppDeps } from './dependencies.js';
import { healthRoutes } from './routes/health.js';
import { registerErrorHandler } from './routes/errorHandler.js';
import { guardianRoutes } from './routes/guardians.js';
import { profileRoutes } from './routes/profiles.js';
import { storyRoutes } from './routes/stories.js';
import { activityRoutes } from './routes/activities.js';
import { historyRoutes } from './routes/history.js';

/**
 * Construye una instancia de Fastify lista para usar. No la arranca: así los
 * tests pueden usar `app.inject(...)` sin abrir un puerto real.
 *
 * Las dependencias (`deps`) se inyectan: en tests se pasan dobles en memoria; en
 * producción, si se omiten, se construyen con `buildProductionDeps` (repos Prisma
 * + AIProvider real), importado de forma diferida para no cargar Prisma en tests.
 */
export async function buildServer(
  config: Config = loadConfig(),
  deps?: AppDeps,
): Promise<FastifyInstance> {
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

  const resolved =
    deps ??
    (await import('./infrastructure/composition.js')).buildProductionDeps(config, {
      warn: (meta, msg) => app.log.warn(meta, msg),
    });

  registerErrorHandler(app);
  await app.register(healthRoutes);
  guardianRoutes(app, resolved);
  profileRoutes(app, resolved);
  storyRoutes(app, resolved);
  activityRoutes(app, resolved);
  historyRoutes(app, resolved);

  return app;
}
