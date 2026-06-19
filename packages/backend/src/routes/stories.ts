import type { FastifyInstance } from 'fastify';
import { GenerateStory } from '../application/use-cases/GenerateStory.js';
import { MarkStoryRead } from '../application/use-cases/MarkStoryRead.js';
import { NarrateStory } from '../application/use-cases/NarrateStory.js';
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
  const narrateStory = new NarrateStory(deps);

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

  // Narra un cuento (US-22): devuelve el MP3 (ElevenLabs, cacheado). El backend
  // actúa de proxy; si la síntesis falla, propaga el error y la app degrada a la
  // voz nativa del dispositivo. El audio se cachea: solo se sintetiza una vez.
  app.get<{ Params: { id: string } }>('/stories/:id/narration', async (request, reply) => {
    request.log.info({ storyId: request.params.id }, 'Narración: petición de audio del cuento');
    const result = await narrateStory.execute({ storyId: request.params.id });

    request.log.info(
      {
        storyId: request.params.id,
        proveedor: 'elevenlabs',
        origen: result.sintetizado ? 'sintetizado' : 'cache',
        voiceId: result.voiceId,
        bytes: result.mp3.length,
      },
      `Narración: audio servido (${result.sintetizado ? 'nuevo' : 'caché'})`,
    );

    if (result.sintetizado) {
      await deps.events.save(
        new InteractionEvent({
          id: deps.newId(),
          profileId: result.profileId,
          tipo: 'cuento_narrado',
          payload: { storyId: request.params.id, voiceId: result.voiceId },
          creadoEn: deps.now(),
        }),
      );
    }

    return reply.header('content-type', 'audio/mpeg').send(Buffer.from(result.mp3));
  });
}
