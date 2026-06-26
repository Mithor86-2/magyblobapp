import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { RegisterGuardian } from '../application/use-cases/RegisterGuardian.js';
import { ListProfiles } from '../application/use-cases/ListProfiles.js';
import { LoginGuardian } from '../application/use-cases/LoginGuardian.js';
import { PARENTESCOS } from '../domain/vocabulary.js';
import type { AppDeps } from '../dependencies.js';

const bodySchema = z
  .object({
    nombre: z.string().min(1),
    apellidos: z.string().min(1),
    email: z.string().min(3),
    parentesco: z.enum(PARENTESCOS),
    telefono: z.string().optional(),
    consentimientoAceptado: z.boolean(),
    consentimientoVersion: z.string().min(1),
  })
  .strict();

const loginSchema = z
  .object({
    // Misma forma que valida la entidad Guardian (ajv-formats no está cableado);
    // formato básico, email normalizado y acotado, sin riesgo real de ReDoS.
    // eslint-disable-next-line sonarjs/super-linear-regex -- igual que Guardian.emailValido
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  })
  .strict();

/** Alta del adulto responsable (+ registro de consentimiento) y listado de sus perfiles. */
export function guardianRoutes(app: FastifyInstance, deps: AppDeps): void {
  const registerGuardian = new RegisterGuardian(deps);
  const listProfiles = new ListProfiles(deps);
  const loginGuardian = new LoginGuardian(deps);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post('/guardians', { schema: { body: bodySchema } }, async (request, reply) => {
      const guardian = await registerGuardian.execute(request.body);

      await deps.bus.publish({
        tipo: 'guardian_registrado',
        guardianId: guardian.id,
        consentimientoVersion: request.body.consentimientoVersion,
      });

      return reply.code(201).send(guardian);
    });

  app
    .withTypeProvider<ZodTypeProvider>()
    .post('/guardians/login', { schema: { body: loginSchema } }, async (request, reply) => {
      const guardian = await loginGuardian.execute(request.body);

      await deps.bus.publish({
        tipo: 'guardian_login',
        guardianId: guardian.id,
      });

      return reply.code(200).send(guardian);
    });

  app.get<{ Params: { guardianId: string } }>('/guardians/:guardianId/profiles', async (request) =>
    listProfiles.execute({ guardianId: request.params.guardianId }),
  );
}
