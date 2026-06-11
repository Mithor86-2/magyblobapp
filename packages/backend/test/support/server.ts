import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server.js';
import type { AppDeps } from '../../src/dependencies.js';
import { MockProvider } from '../../src/infrastructure/ai/MockProvider.js';
import {
  InMemoryAuditLogRepository,
  InMemoryChildProfileRepository,
  InMemoryGuardianRepository,
  InMemoryInteractionEventRepository,
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
} as const;

/** Dependencias en memoria + handles a los repos para inspeccionarlos en los tests. */
export function makeInMemoryDeps() {
  const guardians = new InMemoryGuardianRepository();
  const profiles = new InMemoryChildProfileRepository();
  const stories = new InMemoryStoryRepository();
  const events = new InMemoryInteractionEventRepository();
  const audit = new InMemoryAuditLogRepository();

  const deps: AppDeps = {
    guardians,
    profiles,
    stories,
    events,
    audit,
    ai: new MockProvider(),
    newId: secuencialIdGenerator(),
    now: relojFijo(),
  };

  return { deps, guardians, profiles, stories, events, audit };
}

/** Construye el servidor con dobles en memoria (no toca Prisma ni la DB). */
export async function buildTestServer(deps: AppDeps): Promise<FastifyInstance> {
  return buildServer(TEST_CONFIG, deps);
}
