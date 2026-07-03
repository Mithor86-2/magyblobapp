import Fastify, { type FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { loadConfig, type Config } from './config.js';
import { TooManyRequestsError } from './domain/errors.js';
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
import { achievementRoutes } from './routes/achievements.js';
import { settingsRoutes } from './routes/settings.js';

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
    // Confía en el proxy (Render/Cloudflare) para derivar `request.ip` de
    // `X-Forwarded-For`, de modo que el rate limit (US-92) cuente por cliente
    // real y no por la IP del proxy. Configurable por env (`TRUST_PROXY`).
    trustProxy: config.security.trustProxy,
  });

  const resolved =
    deps ??
    (await (
      await import('./infrastructure/composition.js')
    ).buildProductionDeps(config, {
      info: (meta, msg) => app.log.info(meta, msg),
      warn: (meta, msg) => app.log.warn(meta, msg),
    }));

  // Validación de entrada con Zod en las rutas (US-44): los esquemas `body` de cada
  // ruta son Zod y el type-provider infiere el tipo del cuerpo. Sin esquema `response`,
  // la serialización sigue siendo la de Fastify por defecto (no afecta a la narración).
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Endurecimiento de la capa HTTP (US-92). Se registran antes que las rutas.
  // Cabeceras de seguridad estándar (CSP, X-Frame-Options, etc.).
  await app.register(fastifyHelmet);
  // CORS: la app nativa no lo usa; se permite solo la allowlist configurada. Sin
  // allowlist, en producción se deniega cualquier origen cross-site y fuera de
  // producción se reflejan todos (comodidad con Expo web en desarrollo).
  await app.register(fastifyCors, { origin: resolverOrigenCors(config) });
  // Rate limiting sin ámbito global: se activa por ruta (solo las de auth lo
  // declaran en su `config.rateLimit`). El 429 usa el cuerpo de error uniforme.
  // Al haber un `setErrorHandler` global, el valor devuelto por
  // `errorResponseBuilder` se propaga como error hacia ese manejador. Devolvemos
  // un `TooManyRequestsError` (statusCode 429) para que se traduzca con el cuerpo
  // de error uniforme `{ error: { tipo, mensaje } }`, igual que el resto.
  await app.register(fastifyRateLimit, {
    global: false,
    errorResponseBuilder: (_request, context) =>
      new TooManyRequestsError(`Demasiadas peticiones. Inténtalo de nuevo en ${context.after}.`),
  });

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
  // Logros/recompensas del perfil (US-68): catálogo con progreso; reconcilia desbloqueos.
  achievementRoutes(app, resolved);
  // Ajustes de la narración (TTS) — solo lectura, sin secretos (US-55). Público:
  // no expone datos del niño ni la xi-api-key; informa de la voz por idioma.
  settingsRoutes(app, config);

  return app;
}

/**
 * Resuelve el valor `origin` de CORS (US-92): si hay allowlist configurada, solo
 * esos orígenes; si está vacía, se deniega cualquier origen cross-site en
 * producción (`false`) y se reflejan todos fuera de producción (`true`).
 */
function resolverOrigenCors(config: Config): string[] | boolean {
  if (config.security.corsOrigins.length > 0) return config.security.corsOrigins;
  return config.nodeEnv !== 'production';
}
