import type { FastifyInstance } from 'fastify';
import { GenerateStory } from '../application/use-cases/GenerateStory.js';
import { MarkStoryRead } from '../application/use-cases/MarkStoryRead.js';
import type { GenerateStoryRequest } from '../application/dto.js';
import { InteractionEvent } from '../domain/entities/InteractionEvent.js';
import { ESTILOS, TEMAS } from '../domain/vocabulary.js';
import type { AppDeps } from '../dependencies.js';

const bodySchema = {
  type: 'object',
  required: ['profileId', 'tema', 'estilo'],
  additionalProperties: false,
  properties: {
    profileId: { type: 'string', minLength: 1 },
    tema: { type: 'string', enum: [...TEMAS] },
    estilo: { type: 'string', enum: [...ESTILOS] },
  },
} as const;

/** Genera (y persiste) un cuento para un perfil; registra el evento de uso. */
export function storyRoutes(app: FastifyInstance, deps: AppDeps): void {
  const generateStory = new GenerateStory(deps);
  const markStoryRead = new MarkStoryRead(deps);

  app.post<{ Body: GenerateStoryRequest }>(
    '/stories',
    { schema: { body: bodySchema } },
    async (request, reply) => {
      const story = await generateStory.execute(request.body);

      await deps.events.save(
        new InteractionEvent({
          id: deps.newId(),
          profileId: story.profileId,
          tipo: 'cuento_generado',
          payload: { storyId: story.id, tema: story.tema, estilo: story.estilo },
          creadoEn: deps.now(),
        }),
      );

      return reply.code(201).send(story);
    },
  );

  // Marca un cuento como leído (US-07). Idempotente.
  app.post<{ Params: { id: string } }>('/stories/:id/read', async (request) =>
    markStoryRead.execute({ storyId: request.params.id }),
  );
}
