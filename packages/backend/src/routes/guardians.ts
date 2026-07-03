import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { RegisterGuardian } from '../application/use-cases/RegisterGuardian.js';
import { ListProfiles } from '../application/use-cases/ListProfiles.js';
import { LoginGuardian } from '../application/use-cases/LoginGuardian.js';
import { PARENTESCOS } from '../domain/vocabulary.js';
import type { AppDeps } from '../dependencies.js';
import type { Config, LimiteTasa } from '../config.js';
import { signSession, verifyRefreshToken } from '../auth.js';
import { crearRetoParental, verificarRetoParental } from '../parentalChallenge.js';

/** Traduce un `LimiteTasa` del config al formato de `@fastify/rate-limit` (US-92). */
function limite(l: LimiteTasa): { max: number; timeWindow: number } {
  return { max: l.max, timeWindow: l.ventanaMs };
}

/**
 * Robustez de la contraseña (US-53): al menos 8 caracteres con **una letra y un
 * número** (regla mínima razonable, sin exigir mayúsculas ni símbolos, que penalizan
 * la usabilidad). El tope evita payloads abusivos (y el límite de bcrypt a 72 bytes).
 * Debe mantenerse sincronizada con la validación de la app (`ConsentScreen`).
 */
const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
    message: 'La contraseña debe tener al menos una letra y un número.',
  });

const bodySchema = z
  .object({
    nombre: z.string().min(1),
    apellidos: z.string().min(1),
    // Email único: formato validado en la frontera (rechazo 400 temprano); el 409 por
    // duplicado lo emite el caso de uso al persistir (US-53).
    email: z.string().email(),
    parentesco: z.enum(PARENTESCOS),
    telefono: z.string().optional(),
    password: passwordSchema,
    consentimientoAceptado: z.boolean(),
    consentimientoVersion: z.string().min(1),
    // Puerta parental (US-92): el token firmado del reto y la respuesta del adulto.
    // Se obtienen de `GET /guardians/challenge` y se validan antes de crear la cuenta.
    challengeToken: z.string().min(1),
    challengeRespuesta: z.coerce.number().int(),
  })
  .strict();

const loginSchema = z
  .object({
    // Misma forma que valida la entidad Guardian (ajv-formats no está cableado);
    // formato básico, email normalizado y acotado, sin riesgo real de ReDoS.
    // eslint-disable-next-line sonarjs/super-linear-regex -- igual que Guardian.emailValido
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    // En login solo se exige presencia (la verificación de robustez fue en el alta);
    // así una contraseña corta errónea cae en el 401 genérico, no en un 400 distinto.
    password: z.string().min(1),
  })
  .strict();

const refreshSchema = z.object({ refreshToken: z.string().min(1) }).strict();

/** Alta del adulto responsable (+ registro de consentimiento) y listado de sus perfiles. */
export function guardianRoutes(app: FastifyInstance, deps: AppDeps, config: Config): void {
  const registerGuardian = new RegisterGuardian(deps);
  const listProfiles = new ListProfiles(deps);
  const loginGuardian = new LoginGuardian(deps);

  // Reto de la puerta parental (US-92): pública y sin estado; el token firmado se
  // devuelve al cliente y se valida en el alta. Con rate limit para no abusar.
  app.get(
    '/guardians/challenge',
    { config: { rateLimit: limite(config.security.rateLimit.registro) } },
    async () => crearRetoParental(config.auth.secret, config.security.parentalGate.ttlMs),
  );

  app.withTypeProvider<ZodTypeProvider>().post(
    '/guardians',
    {
      schema: { body: bodySchema },
      config: { rateLimit: limite(config.security.rateLimit.registro) },
    },
    async (request, reply) => {
      const { challengeToken, challengeRespuesta, ...alta } = request.body;
      // Puerta parental antes de crear nada: reto inválido/caducado → 400 (US-92).
      verificarRetoParental(config.auth.secret, challengeToken, challengeRespuesta);

      const guardian = await registerGuardian.execute(alta);

      await deps.bus.publish({
        tipo: 'guardian_registrado',
        guardianId: guardian.id,
        consentimientoVersion: alta.consentimientoVersion,
      });

      // Auto-login tras el alta: emite la sesión para no obligar a un login extra
      // (las rutas de datos exigen token desde US-45).
      const tokens = await signSession(reply, config, guardian);
      return reply.code(201).send({ ...guardian, ...tokens });
    },
  );

  // Login por email: además del guardián, emite la sesión JWT (access + refresh).
  app.withTypeProvider<ZodTypeProvider>().post(
    '/guardians/login',
    {
      schema: { body: loginSchema },
      config: { rateLimit: limite(config.security.rateLimit.login) },
    },
    async (request, reply) => {
      const guardian = await loginGuardian.execute(request.body);

      await deps.bus.publish({
        tipo: 'guardian_login',
        guardianId: guardian.id,
      });

      const tokens = await signSession(reply, config, guardian);
      return reply.code(200).send({ ...guardian, ...tokens });
    },
  );

  // Renueva el access token a partir de un refresh token válido (US-45). Pública
  // (no exige access token); el refresh viaja en el cuerpo (la app es RN/Expo).
  app.withTypeProvider<ZodTypeProvider>().post(
    '/guardians/refresh',
    {
      schema: { body: refreshSchema },
      config: { rateLimit: limite(config.security.rateLimit.refresh) },
    },
    async (request, reply) => {
      const { guardianId, email } = verifyRefreshToken(app, request.body.refreshToken);
      const tokens = await signSession(reply, config, { id: guardianId, email });
      return reply.code(200).send(tokens);
    },
  );

  app.get<{ Params: { guardianId: string } }>(
    '/guardians/:guardianId/profiles',
    { onRequest: app.authenticate },
    async (request) => listProfiles.execute({ guardianId: request.params.guardianId }),
  );
}
