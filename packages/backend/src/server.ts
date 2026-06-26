import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { loadConfig, type Config } from './config.js';
import type { AppDeps } from './dependencies.js';
import { registerAuth } from './auth.js';
import { healthRoutes } from './routes/health.js';
import { registerErrorHandler } from './routes/errorHandler.js';
import { guardianRoutes } from './routes/guardians.js';
import { profileRoutes } from './routes/profiles.js';
import { storyRoutes } from './routes/stories.js';
import { activityRoutes } from './routes/activities.js';
import { anonymousRoutes } from './routes/anonymous.js';
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
      info: (meta, msg) => app.log.info(meta, msg),
      warn: (meta, msg) => app.log.warn(meta, msg),
    });

  // Validación de entrada con Zod en las rutas (US-44): los esquemas `body` de cada
  // ruta son Zod y el type-provider infiere el tipo del cuerpo. Sin esquema `response`,
  // la serialización sigue siendo la de Fastify por defecto (no afecta a la narración).
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerErrorHandler(app);
  // Autenticación JWT (US-45): registra @fastify/jwt y el decorador `authenticate`
  // antes que las rutas, que lo referencian en su `onRequest` para protegerse.
  await registerAuth(app, config);
  await app.register(healthRoutes);
  guardianRoutes(app, resolved, config);
  profileRoutes(app, resolved);
  storyRoutes(app, resolved);
  activityRoutes(app, resolved);
  // Rutas públicas del modo anónimo efímero (US-50): sin `authenticate`, con
  // rate-limit en memoria. Se registran junto al resto; no exigen sesión.
  anonymousRoutes(app, resolved);
  historyRoutes(app, resolved);

  return app;
}
