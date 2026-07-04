import type { FastifyInstance, InjectOptions } from 'fastify';
import type { LightMyRequestResponse } from 'fastify';
import { buildServer } from '../../src/server.js';
import type { Config } from '../../src/config.js';
import type { AppDeps } from '../../src/dependencies.js';
import { CLAVE_DE_PRUEBA } from './doubles.js';
import { MockProvider } from '../../src/infrastructure/ai/MockProvider.js';
import { InMemoryEventBus } from '../../src/infrastructure/events/InMemoryEventBus.js';
import { wireDomainEvents } from '../../src/infrastructure/events/subscribers.js';
import {
  FakeCodeGenerator,
  FakePasswordHasher,
  FakeTTSProvider,
  InMemoryAchievementRepository,
  InMemoryActivityRepository,
  InMemoryAuditLogRepository,
  InMemoryChildProfileRepository,
  InMemoryEmailVerificationRepository,
  InMemoryGuardianRepository,
  InMemoryInteractionEventRepository,
  InMemoryStoryNarrationRepository,
  InMemoryStoryRepository,
  relojFijo,
  secuencialIdGenerator,
} from './doubles.js';
import type { EmailService } from '../../src/domain/services/EmailService.js';

export const TEST_CONFIG: Config = {
  nodeEnv: 'test',
  port: 0,
  logLevel: 'silent',
  aiProvider: 'mock',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'gemma:2b',
  aiTimeoutMs: 1000,
  cloudApiKeys: {},
  tts: {
    apiKey: undefined,
    model: 'eleven_multilingual_v2',
    voiceIdByLang: { es: 'voz-es', en: 'voz-en' },
    timeoutMs: 1000,
  },
  auth: {
    secret: 'test-secret-no-usar-en-produccion',
    accessTtl: '15m',
    refreshTtl: '7d',
  },
  // Seguridad (US-92): en tests los límites de tasa son holgados para no romper
  // los flujos con varias peticiones; el test dedicado del 429 construye su propio
  // servidor con límites minúsculos (ver `buildTestServer(deps, config)`).
  security: {
    trustProxy: false,
    corsOrigins: [],
    rateLimit: {
      registro: { max: 100, ventanaMs: 60_000 },
      login: { max: 100, ventanaMs: 60_000 },
      refresh: { max: 100, ventanaMs: 60_000 },
      verify: { max: 100, ventanaMs: 60_000 },
      resend: { max: 100, ventanaMs: 60_000 },
    },
    parentalGate: { ttlMs: 300_000 },
  },
  // Verificación de email (US-93): en TEST_CONFIG está desactivada (`enabled=false`),
  // así el alta auto-verifica (como el onboarding por defecto). Los tests que ejercen
  // la verificación construyen deps con un `FakeEmailService`.
  email: {
    enabled: false,
    otp: { ttlMs: 600_000, maxIntentos: 5, resendCooldownMs: 60_000 },
  },
};

/**
 * Dependencias en memoria + handles a los repos para inspeccionarlos en los tests.
 * `emailService` es opcional (US-93): si se pasa, el alta exige verificación por OTP;
 * si se omite, el alta auto-verifica (comportamiento por defecto sin SMTP).
 */
export function makeInMemoryDeps(options: { emailService?: EmailService } = {}) {
  const guardians = new InMemoryGuardianRepository();
  const profiles = new InMemoryChildProfileRepository();
  const stories = new InMemoryStoryRepository();
  const narrations = new InMemoryStoryNarrationRepository();
  const activities = new InMemoryActivityRepository();
  const achievements = new InMemoryAchievementRepository();
  const events = new InMemoryInteractionEventRepository();
  const audit = new InMemoryAuditLogRepository();
  const tts = new FakeTTSProvider();
  const hasher = new FakePasswordHasher();
  const emailVerifications = new InMemoryEmailVerificationRepository();
  const codeGenerator = new FakeCodeGenerator();

  const deps: AppDeps = {
    guardians,
    profiles,
    stories,
    narrations,
    activities,
    achievements,
    events,
    audit,
    ai: new MockProvider(),
    tts,
    hasher,
    emailVerifications,
    codeGenerator,
    emailService: options.emailService,
    bus: new InMemoryEventBus(),
    newId: secuencialIdGenerator(),
    now: relojFijo(),
  };

  // Mismos suscriptores que en producción, sobre los dobles en memoria.
  wireDomainEvents(deps.bus, deps);

  return {
    deps,
    guardians,
    profiles,
    stories,
    narrations,
    activities,
    achievements,
    events,
    audit,
    tts,
    hasher,
    emailVerifications,
    codeGenerator,
  };
}

/** Construye el servidor con dobles en memoria (no toca Prisma ni la DB). */
export async function buildTestServer(
  deps: AppDeps,
  config: Config = TEST_CONFIG,
): Promise<FastifyInstance> {
  return buildServer(config, deps);
}

/**
 * Payload de alta válido por defecto (US-92): fija nombre/email/parentesco y una
 * contraseña que pasa la política. Los tests lo sobreescriben campo a campo.
 */
const ALTA_DEFECTO = {
  nombre: 'Ana',
  apellidos: 'García',
  email: 'ana@example.com',
  parentesco: 'madre',
  password: CLAVE_DE_PRUEBA,
  consentimientoAceptado: true,
  consentimientoVersion: 'v1',
};

/**
 * Resuelve la puerta parental (US-92) pidiendo un reto real a
 * `GET /guardians/challenge` y calculando la respuesta a partir de la pregunta
 * ("¿Cuánto es a + b?"). Devuelve el token firmado y la respuesta para el alta.
 */
export async function retoParental(
  app: FastifyInstance,
): Promise<{ challengeToken: string; challengeRespuesta: number }> {
  const res = await app.inject({ method: 'GET', url: '/guardians/challenge' });
  const { pregunta, challengeToken } = res.json() as { pregunta: string; challengeToken: string };
  const m = /(\d{1,2}) \+ (\d{1,2})/.exec(pregunta);
  if (m === null) throw new Error(`Pregunta de reto inesperada: ${pregunta}`);
  return { challengeToken, challengeRespuesta: Number(m[1]) + Number(m[2]) };
}

/**
 * Da de alta un guardián por HTTP resolviendo antes la puerta parental (US-92).
 * Acepta overrides del payload por defecto y devuelve la respuesta de `inject`.
 */
export async function altaGuardian(
  app: FastifyInstance,
  overrides: Record<string, unknown> = {},
): Promise<LightMyRequestResponse> {
  const reto = await retoParental(app);
  const payload: InjectOptions['payload'] = { ...ALTA_DEFECTO, ...overrides, ...reto };
  return app.inject({ method: 'POST', url: '/guardians', payload });
}

/**
 * Cabecera `Authorization: Bearer <access token>` para ejercitar las rutas
 * protegidas (US-45). Firma un access token válido con el secreto de TEST_CONFIG.
 */
export function authHeaders(
  app: FastifyInstance,
  guardian: { id: string; email: string } = { id: 'g-test', email: 'tester@example.com' },
): { authorization: string } {
  const token = app.jwt.sign({ guardianId: guardian.id, email: guardian.email, type: 'access' });
  return { authorization: `Bearer ${token}` };
}
