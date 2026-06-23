import type { FastifyInstance } from 'fastify';
import { RecommendActivities } from '../application/use-cases/RecommendActivities.js';
import { CompleteActivity } from '../application/use-cases/CompleteActivity.js';
import type { RecommendActivitiesRequest } from '../application/dto.js';
import { CATEGORIAS } from '../domain/vocabulary.js';
import type { AppDeps } from '../dependencies.js';

const bodySchema = {
  type: 'object',
  required: ['profileId'],
  additionalProperties: false,
  properties: {
    profileId: { type: 'string', minLength: 1 },
    categoria: { type: 'string', enum: [...CATEGORIAS] },
    cantidad: { type: 'integer', minimum: 1, maximum: 5 },
  },
} as const;

const completeSchema = {
  type: 'object',
  required: ['valoracion'],
  additionalProperties: false,
  properties: {
    valoracion: { type: 'integer', minimum: 1, maximum: 3 },
  },
} as const;

/** Recomienda actividades y registra su realización (progreso) para un perfil. */
export function activityRoutes(app: FastifyInstance, deps: AppDeps): void {
  const recommendActivities = new RecommendActivities(deps);
  const completeActivity = new CompleteActivity(deps);

  app.post<{ Body: RecommendActivitiesRequest }>(
    '/activities/recommend',
    { schema: { body: bodySchema } },
    async (request, reply) => {
      const activities = await recommendActivities.execute(request.body);
      return reply.code(201).send(activities);
    },
  );

  // Marca una actividad como completada con valoración (US-10); registra el evento de uso.
  app.post<{ Params: { id: string }; Body: { valoracion: number } }>(
    '/activities/:id/complete',
    { schema: { body: completeSchema } },
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
}
