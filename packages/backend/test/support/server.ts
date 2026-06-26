import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server.js';
import type { AppDeps } from '../../src/dependencies.js';
import { MockProvider } from '../../src/infrastructure/ai/MockProvider.js';
import { InMemoryEventBus } from '../../src/infrastructure/events/InMemoryEventBus.js';
import { wireDomainEvents } from '../../src/infrastructure/events/subscribers.js';
import {
  FakeTTSProvider,
  InMemoryActivityRepository,
  InMemoryAuditLogRepository,
  InMemoryChildProfileRepository,
  InMemoryGuardianRepository,
  InMemoryInteractionEventRepository,
  InMemoryStoryNarrationRepository,
  InMemoryStoryRepository,
  relojFijo,
  secuencialIdGenerator,
} from './doubles.js';

const TEST_CONFIG = {
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
} as const;

/** Dependencias en memoria + handles a los repos para inspeccionarlos en los tests. */
export function makeInMemoryDeps() {
  const guardians = new InMemoryGuardianRepository();
  const profiles = new InMemoryChildProfileRepository();
  const stories = new InMemoryStoryRepository();
  const narrations = new InMemoryStoryNarrationRepository();
  const activities = new InMemoryActivityRepository();
  const events = new InMemoryInteractionEventRepository();
  const audit = new InMemoryAuditLogRepository();
  const tts = new FakeTTSProvider();

  const deps: AppDeps = {
    guardians,
    profiles,
    stories,
    narrations,
    activities,
    events,
    audit,
    ai: new MockProvider(),
    tts,
    bus: new InMemoryEventBus(),
    newId: secuencialIdGenerator(),
    now: relojFijo(),
  };

  // Mismos suscriptores que en producción, sobre los dobles en memoria.
  wireDomainEvents(deps.bus, deps);

  return { deps, guardians, profiles, stories, narrations, activities, events, audit, tts };
}

/** Construye el servidor con dobles en memoria (no toca Prisma ni la DB). */
export async function buildTestServer(deps: AppDeps): Promise<FastifyInstance> {
  return buildServer(TEST_CONFIG, deps);
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
