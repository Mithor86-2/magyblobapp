/**
 * Ruta Fastify de **logros/recompensas** (US-68): el catálogo de un perfil con su
 * progreso y estado de desbloqueo. Bajo sesión del adulto (`authenticate`). La lectura
 * reconcilia la persistencia de los logros recién conseguidos (idempotente); es un
 * GET porque desde el cliente es "consultar mis logros", y la escritura es un efecto
 * lateral idempotente que no cambia la respuesta ante repeticiones.
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { GetAchievements } from '../application/use-cases/GetAchievements.js';
import type { AppDeps } from '../dependencies.js';

const paramsSchema = z.object({ profileId: z.string().min(1) });

/** Registra `GET /profiles/:profileId/achievements`. */
export function achievementRoutes(app: FastifyInstance, deps: AppDeps): void {
  const getAchievements = new GetAchievements(deps);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/profiles/:profileId/achievements',
      { schema: { params: paramsSchema }, onRequest: app.authenticate },
      async (request) => getAchievements.execute({ profileId: request.params.profileId }),
    );
}
