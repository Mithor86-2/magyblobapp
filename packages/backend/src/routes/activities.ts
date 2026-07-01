/**
 * Rutas Fastify del recurso **actividad** (`/activities`): recomendación, registro
 * de realización (progreso) y favorito. Todas bajo sesión del adulto
 * (`authenticate`) y validadas con Zod. US-09, US-10, US-63.
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { RecommendActivities } from '../application/use-cases/RecommendActivities.js';
import { CompleteActivity } from '../application/use-cases/CompleteActivity.js';
import { SetActivityFavorite } from '../application/use-cases/SetActivityFavorite.js';
import { CATEGORIAS } from '../domain/vocabulary.js';
import type { AppDeps } from '../dependencies.js';

const bodySchema = z
  .object({
    profileId: z.string().min(1),
    categoria: z.enum(CATEGORIAS).optional(),
    cantidad: z.number().int().min(1).max(5).optional(),
  })
  .strict();

const completeParamsSchema = z.object({ id: z.string().min(1) });
const completeSchema = z.object({ valoracion: z.number().int().min(1).max(3) }).strict();

const favoriteParamsSchema = z.object({ id: z.string().min(1) });
const favoriteSchema = z.object({ favorito: z.boolean() }).strict();

/** Recomienda actividades y registra su realización (progreso) para un perfil. */
export function activityRoutes(app: FastifyInstance, deps: AppDeps): void {
  const recommendActivities = new RecommendActivities(deps);
  const completeActivity = new CompleteActivity(deps);
  const setActivityFavorite = new SetActivityFavorite(deps);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/activities/recommend',
      { schema: { body: bodySchema }, onRequest: app.authenticate },
      async (request, reply) => {
        const activities = await recommendActivities.execute(request.body);
        return reply.code(201).send(activities);
      },
    );

  // Marca una actividad como completada con valoración (US-10); registra el evento de uso.
  app.withTypeProvider<ZodTypeProvider>().post(
    '/activities/:id/complete',
    {
      schema: { body: completeSchema, params: completeParamsSchema },
      onRequest: app.authenticate,
    },
    async (request) => {
      const activity = await completeActivity.execute({
        activityId: request.params.id,
        valoracion: request.body.valoracion,
      });

      await deps.bus.publish({
        tipo: 'actividad_completada',
        profileId: activity.profileId,
        activityId: activity.id,
        valoracion: activity.valoracion,
      });

      return activity;
    },
  );

  // Marca/desmarca una actividad como favorita (US-63). Idempotente.
  app.withTypeProvider<ZodTypeProvider>().post(
    '/activities/:id/favorite',
    {
      schema: { body: favoriteSchema, params: favoriteParamsSchema },
      onRequest: app.authenticate,
    },
    async (request) =>
      setActivityFavorite.execute({
        activityId: request.params.id,
        favorito: request.body.favorito,
      }),
  );
}
