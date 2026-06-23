import type { FastifyInstance } from 'fastify';
import { CreateChildProfile } from '../application/use-cases/CreateChildProfile.js';
import type { CreateChildProfileInput } from '../application/dto.js';
import { TEMAS } from '../domain/vocabulary.js';
import { Edad } from '../domain/value-objects/Edad.js';
import { IDIOMAS } from '../domain/value-objects/Idioma.js';
import type { AppDeps } from '../dependencies.js';

const bodySchema = {
  type: 'object',
  required: ['guardianId', 'nombre', 'edad', 'avatar', 'intereses'],
  additionalProperties: false,
  properties: {
    guardianId: { type: 'string', minLength: 1 },
    nombre: { type: 'string', minLength: 1 },
    edad: { type: 'integer', minimum: Edad.MIN, maximum: Edad.MAX },
    idioma: { type: 'string', enum: [...IDIOMAS] },
    avatar: { type: 'string', minLength: 1 },
    intereses: { type: 'array', minItems: 1, items: { type: 'string', enum: [...TEMAS] } },
  },
} as const;

/** Crea el perfil de un niño asociado a un adulto que ya ha consentido. */
export function profileRoutes(app: FastifyInstance, deps: AppDeps): void {
  const createChildProfile = new CreateChildProfile(deps);

  app.post<{ Body: CreateChildProfileInput }>(
    '/profiles',
    { schema: { body: bodySchema } },
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
