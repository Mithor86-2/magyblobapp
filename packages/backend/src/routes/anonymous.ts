/**
 * Rutas **públicas** (sin sesión) del modo anónimo efímero: generan cuento y
 * actividades sin `profileId` y **sin persistir nada**, protegidas por un
 * rate-limit en memoria. US-50.
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { GenerateStoryAnonymous } from '../application/use-cases/GenerateStoryAnonymous.js';
import { RecommendActivitiesAnonymous } from '../application/use-cases/RecommendActivitiesAnonymous.js';
import { CATEGORIAS, ESTILOS, TEMAS } from '../domain/vocabulary.js';
import { IDIOMAS } from '../domain/value-objects/Idioma.js';
import { Edad } from '../domain/value-objects/Edad.js';
import type { AppDeps } from '../dependencies.js';
import { createAnonymousRateLimit, LIMITE_POR_DEFECTO } from './anonymousRateLimit.js';

// US-50: el cuerpo no lleva `profileId` ni nombre de niño; solo datos mínimos.
const storyBodySchema = z
  .object({
    edad: z.number().int().min(Edad.MIN).max(Edad.MAX),
    idioma: z.enum(IDIOMAS).optional(),
    temas: z.array(z.enum(TEMAS)).min(1),
    estilos: z.array(z.enum(ESTILOS)).min(1),
  })
  .strict();

const activitiesBodySchema = z
  .object({
    edad: z.number().int().min(Edad.MIN).max(Edad.MAX),
    idioma: z.enum(IDIOMAS).optional(),
    categoria: z.enum(CATEGORIAS).optional(),
    cantidad: z.number().int().min(1).max(5).optional(),
  })
  .strict();

/**
 * Rutas **públicas** del modo anónimo efímero (US-50): generan y devuelven
 * contenido sin sesión, sin `profileId` y **sin persistir nada**. No llevan el
 * decorador `authenticate`. Un rate-limit en memoria (compartido entre ambas
 * rutas, por cliente) las protege con 3 cuentos + 3 actividades; al superarlo,
 * 429. Validan la entrada con Zod (vocabulario cerrado + edad/idioma en rango).
 */
export function anonymousRoutes(app: FastifyInstance, deps: AppDeps): void {
  const generateStory = new GenerateStoryAnonymous(deps);
  const recommendActivities = new RecommendActivitiesAnonymous(deps);
  const limitar = createAnonymousRateLimit(LIMITE_POR_DEFECTO);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/stories/anonymous',
      { schema: { body: storyBodySchema }, onRequest: limitar('cuentos') },
      async (request, reply) => {
        const story = await generateStory.execute(request.body);
        return reply.code(201).send(story);
      },
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/activities/recommend/anonymous',
      { schema: { body: activitiesBodySchema }, onRequest: limitar('actividades') },
      async (request, reply) => {
        const activities = await recommendActivities.execute(request.body);
        return reply.code(201).send(activities);
      },
    );
}
