/**
 * Rutas Fastify del recurso **perfil de niño** (`/profiles`). Exponen la creación
 * del perfil bajo sesión del adulto (`authenticate`), validando la entrada con Zod
 * (vocabulario cerrado de intereses, edad/idioma en rango). US-01.
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CreateChildProfile } from '../application/use-cases/CreateChildProfile.js';
import { TEMAS } from '../domain/vocabulary.js';
import { Edad } from '../domain/value-objects/Edad.js';
import { IDIOMAS } from '../domain/value-objects/Idioma.js';
import type { AppDeps } from '../dependencies.js';

const bodySchema = z
  .object({
    guardianId: z.string().min(1),
    nombre: z.string().min(1),
    edad: z.number().int().min(Edad.MIN).max(Edad.MAX),
    idioma: z.enum(IDIOMAS).optional(),
    avatar: z.string().min(1),
    intereses: z.array(z.enum(TEMAS)).min(1),
  })
  .strict();

/** Crea el perfil de un niño asociado a un adulto que ya ha consentido. */
export function profileRoutes(app: FastifyInstance, deps: AppDeps): void {
  const createChildProfile = new CreateChildProfile(deps);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/profiles',
      { schema: { body: bodySchema }, onRequest: app.authenticate },
      async (request, reply) => {
        const profile = await createChildProfile.execute(request.body);

        await deps.bus.publish({
          tipo: 'perfil_creado',
          guardianId: profile.guardianId,
          profileId: profile.id,
        });

        return reply.code(201).send(profile);
      },
    );
}
