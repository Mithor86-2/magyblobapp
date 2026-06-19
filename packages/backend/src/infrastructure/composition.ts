import { randomUUID } from 'node:crypto';
import type { Config } from '../config.js';
import type { AppDeps } from '../dependencies.js';
import { createAIProvider } from './ai/createAIProvider.js';
import { ElevenLabsProvider, type TTSLogger } from './tts/ElevenLabsProvider.js';
import { createPrismaClient } from './db/prismaClient.js';
import { PrismaGuardianRepository } from './repositories/PrismaGuardianRepository.js';
import { PrismaChildProfileRepository } from './repositories/PrismaChildProfileRepository.js';
import { PrismaStoryRepository } from './repositories/PrismaStoryRepository.js';
import { PrismaStoryNarrationRepository } from './repositories/PrismaStoryNarrationRepository.js';
import { PrismaActivityRepository } from './repositories/PrismaActivityRepository.js';
import { PrismaInteractionEventRepository } from './repositories/PrismaInteractionEventRepository.js';
import { PrismaAuditLogRepository } from './repositories/PrismaAuditLogRepository.js';
import { PrismaSettingsRepository } from './repositories/PrismaSettingsRepository.js';

/**
 * Raíz de composición de producción: cablea los repos Prisma y el AIProvider real
 * (con AppSetting como config en caliente). Se importa de forma diferida desde
 * `buildServer` solo cuando no se inyectan dependencias, para que los tests con
 * dobles en memoria nunca carguen Prisma ni abran conexión a la DB.
 */
export function buildProductionDeps(config: Config, logger?: TTSLogger): AppDeps {
  const prisma = createPrismaClient();
  const settings = new PrismaSettingsRepository(prisma);

  return {
    guardians: new PrismaGuardianRepository(prisma),
    profiles: new PrismaChildProfileRepository(prisma),
    stories: new PrismaStoryRepository(prisma),
    narrations: new PrismaStoryNarrationRepository(prisma),
    activities: new PrismaActivityRepository(prisma),
    events: new PrismaInteractionEventRepository(prisma),
    audit: new PrismaAuditLogRepository(prisma),
    ai: createAIProvider(config, { logger, settings }),
    tts: new ElevenLabsProvider({
      apiKey: config.tts.apiKey,
      model: config.tts.model,
      voiceIdByLang: config.tts.voiceIdByLang,
      timeoutMs: config.tts.timeoutMs,
      logger,
    }),
    newId: () => randomUUID(),
    now: () => new Date(),
  };
}
