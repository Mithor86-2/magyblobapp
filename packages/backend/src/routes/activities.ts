import type { FastifyInstance } from 'fastify';
import { RecommendActivities } from '../application/use-cases/RecommendActivities.js';
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

/** Recomienda (y persiste) actividades para un perfil mediante la capa de IA. */
export function activityRoutes(app: FastifyInstance, deps: AppDeps): void {
  const recommendActivities = new RecommendActivities(deps);

  app.post<{ Body: RecommendActivitiesRequest }>(
    '/activities/recommend',
    { schema: { body: bodySchema } },
    async (request, reply) => {
      const activities = await recommendActivities.execute(request.body);
      return reply.code(201).send(activities);
    },
  );
}
