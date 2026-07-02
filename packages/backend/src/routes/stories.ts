/**
 * Rutas Fastify del recurso **cuento** (`/stories`): generación, marcado de leído,
 * narración en voz alta y favorito. Todas bajo sesión del adulto (`authenticate`)
 * y validadas con Zod. US-03, US-07, US-22, US-47, US-63.
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ContinueStory } from '../application/use-cases/ContinueStory.js';
import { GenerateStory } from '../application/use-cases/GenerateStory.js';
import { MarkStoryRead } from '../application/use-cases/MarkStoryRead.js';
import { NarrateStory } from '../application/use-cases/NarrateStory.js';
import { SetStoryFavorite } from '../application/use-cases/SetStoryFavorite.js';
import { ENSENANZAS, ESTILOS, TEMAS } from '../domain/vocabulary.js';
import type { AppDeps } from '../dependencies.js';

// US-47: tema y estilo son listas de selección múltiple. Vocabulario cerrado por
// elemento, al menos uno y sin duplicados (la validación fina de duplicados la
// repite el caso de uso, pero se rechaza ya en frontera).
const bodySchema = z
  .object({
    profileId: z.string().min(1),
    temas: z.array(z.enum(TEMAS)).min(1),
    estilos: z.array(z.enum(ESTILOS)).min(1),
    // US-69: enseñanza opcional (vocabulario cerrado). Ausente = sin moraleja dirigida.
    ensenanza: z.enum(ENSENANZAS).optional(),
    // US-76: usar (o no) el nombre del niño en el cuento. Ausente = por defecto sí.
    usarNombre: z.boolean().optional(),
  })
  .strict();

const continueParamsSchema = z.object({ id: z.string().min(1) });

const favoriteParamsSchema = z.object({ id: z.string().min(1) });
const favoriteSchema = z.object({ favorito: z.boolean() }).strict();

/** Genera (y persiste) un cuento para un perfil; registra el evento de uso. */
export function storyRoutes(app: FastifyInstance, deps: AppDeps): void {
  const generateStory = new GenerateStory(deps);
  const continueStory = new ContinueStory(deps);
  const markStoryRead = new MarkStoryRead(deps);
  const narrateStory = new NarrateStory(deps);
  const setStoryFavorite = new SetStoryFavorite(deps);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stories',
      { schema: { body: bodySchema }, onRequest: app.authenticate },
      async (request, reply) => {
        const story = await generateStory.execute(request.body);

        await deps.bus.publish({
          tipo: 'cuento_generado',
          profileId: story.profileId,
          storyId: story.id,
          tema: story.tema,
          estilo: story.estilo,
        });

        return reply.code(201).send(story);
      },
    );

  // Continúa un cuento existente (US-78): genera un capítulo nuevo enlazado al origen,
  // lo persiste y registra el evento de uso (mismo `cuento_generado`). Devuelve el
  // cuento nuevo (la app lo abre en el lector).
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stories/:id/continue',
      { schema: { params: continueParamsSchema }, onRequest: app.authenticate },
      async (request, reply) => {
        const story = await continueStory.execute({ storyId: request.params.id });

        await deps.bus.publish({
          tipo: 'cuento_generado',
          profileId: story.profileId,
          storyId: story.id,
          tema: story.tema,
          estilo: story.estilo,
        });

        return reply.code(201).send(story);
      },
    );

  // Marca un cuento como leído (US-07). Idempotente.
  app.post<{ Params: { id: string } }>(
    '/stories/:id/read',
    { onRequest: app.authenticate },
    async (request) => markStoryRead.execute({ storyId: request.params.id }),
  );

  // Marca/desmarca un cuento como favorito (US-63). Idempotente.
  app.withTypeProvider<ZodTypeProvider>().post(
    '/stories/:id/favorite',
    {
      schema: { body: favoriteSchema, params: favoriteParamsSchema },
      onRequest: app.authenticate,
    },
    async (request) =>
      setStoryFavorite.execute({ storyId: request.params.id, favorito: request.body.favorito }),
  );

  // Narra un cuento (US-22): devuelve el MP3 (ElevenLabs, cacheado). El backend
  // actúa de proxy; si la síntesis falla, propaga el error y la app degrada a la
  // voz nativa del dispositivo. El audio se cachea: solo se sintetiza una vez.
  app.get<{ Params: { id: string } }>(
    '/stories/:id/narration',
    { onRequest: app.authenticate },
    async (request, reply) => {
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
        await deps.bus.publish({
          tipo: 'cuento_narrado',
          profileId: result.profileId,
          storyId: request.params.id,
          voiceId: result.voiceId,
        });
      }

      return reply.header('content-type', 'audio/mpeg').send(Buffer.from(result.mp3));
    },
  );
}
