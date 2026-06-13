import type { FastifyInstance } from 'fastify';
import { RegisterGuardian } from '../application/use-cases/RegisterGuardian.js';
import { ListProfiles } from '../application/use-cases/ListProfiles.js';
import { LoginGuardian } from '../application/use-cases/LoginGuardian.js';
import type { LoginGuardianInput, RegisterGuardianInput } from '../application/dto.js';
import { AuditLog } from '../domain/entities/AuditLog.js';
import { PARENTESCOS } from '../domain/vocabulary.js';
import type { AppDeps } from '../dependencies.js';

const bodySchema = {
  type: 'object',
  required: [
    'nombre',
    'apellidos',
    'email',
    'parentesco',
    'consentimientoAceptado',
    'consentimientoVersion',
  ],
  additionalProperties: false,
  properties: {
    nombre: { type: 'string', minLength: 1 },
    apellidos: { type: 'string', minLength: 1 },
    email: { type: 'string', minLength: 3 },
    parentesco: { type: 'string', enum: [...PARENTESCOS] },
    telefono: { type: 'string' },
    consentimientoAceptado: { type: 'boolean' },
    consentimientoVersion: { type: 'string', minLength: 1 },
  },
} as const;

const loginSchema = {
  type: 'object',
  required: ['email'],
  additionalProperties: false,
  properties: {
    // Misma forma que valida la entidad Guardian (ajv-formats no está cableado).
    email: { type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
  },
} as const;

/** Alta del adulto responsable (+ registro de consentimiento) y listado de sus perfiles. */
export function guardianRoutes(app: FastifyInstance, deps: AppDeps): void {
  const registerGuardian = new RegisterGuardian(deps);
  const listProfiles = new ListProfiles(deps);
  const loginGuardian = new LoginGuardian(deps);

  app.post<{ Body: RegisterGuardianInput }>(
    '/guardians',
    { schema: { body: bodySchema } },
    async (request, reply) => {
      const guardian = await registerGuardian.execute(request.body);

      await deps.audit.save(
        new AuditLog({
          id: deps.newId(),
          guardianId: guardian.id,
          accion: 'consentimiento',
          entidad: 'Guardian',
          entidadId: guardian.id,
          metadatos: { version: request.body.consentimientoVersion },
          creadoEn: deps.now(),
        }),
      );

      return reply.code(201).send(guardian);
    },
  );

  app.post<{ Body: LoginGuardianInput }>(
    '/guardians/login',
    { schema: { body: loginSchema } },
    async (request, reply) => {
      const guardian = await loginGuardian.execute(request.body);

      await deps.audit.save(
        new AuditLog({
          id: deps.newId(),
          guardianId: guardian.id,
          accion: 'login',
          entidad: 'Guardian',
          entidadId: guardian.id,
          creadoEn: deps.now(),
        }),
      );

      return reply.code(200).send(guardian);
    },
  );

  app.get<{ Params: { guardianId: string } }>('/guardians/:guardianId/profiles', async (request) =>
    listProfiles.execute({ guardianId: request.params.guardianId }),
  );
}
