import { randomUUID } from 'node:crypto';
import type { Config } from '../config.js';
import type { AppDeps } from '../dependencies.js';
import { createAIProvider } from './ai/createAIProvider.js';
import { ElevenLabsProvider, type TTSLogger } from './tts/ElevenLabsProvider.js';
import { InMemoryEventBus } from './events/InMemoryEventBus.js';
import { wireDomainEvents } from './events/subscribers.js';
import { createPrismaClient } from './db/prismaClient.js';
import { syncAppSettings, type SyncLogger } from './config/syncAppSettings.js';
import { PrismaGuardianRepository } from './repositories/PrismaGuardianRepository.js';
import { PrismaChildProfileRepository } from './repositories/PrismaChildProfileRepository.js';
import { PrismaStoryRepository } from './repositories/PrismaStoryRepository.js';
import { PrismaStoryNarrationRepository } from './repositories/PrismaStoryNarrationRepository.js';
import { PrismaActivityRepository } from './repositories/PrismaActivityRepository.js';
import { PrismaInteractionEventRepository } from './repositories/PrismaInteractionEventRepository.js';
import { PrismaAuditLogRepository } from './repositories/PrismaAuditLogRepository.js';
import { PrismaSettingsRepository } from './repositories/PrismaSettingsRepository.js';
import { BcryptPasswordHasher } from './auth/BcryptPasswordHasher.js';

/**
 * Raíz de composición de producción: cablea los repos Prisma y el AIProvider real
 * (con AppSetting como config en caliente). Se importa de forma diferida desde
 * `buildServer` solo cuando no se inyectan dependencias, para que los tests con
 * dobles en memoria nunca carguen Prisma ni abran conexión a la DB.
 *
 * En el arranque aplica la configuración versionada (`AppSetting`) desde
 * `prisma/app-settings.json` (US-70) antes de servir: un despliegue limpio queda
 * configurado sin pasos ocultos y sin pisar los cambios hechos en caliente.
 */
export async function buildProductionDeps(config: Config, logger?: TTSLogger): Promise<AppDeps> {
  const prisma = createPrismaClient();

  // Sync versionado de la configuración (US-70). Falla el arranque si el JSON es
  // inválido o la BD no responde: mejor fallar pronto que servir mal configurado.
  // Se omite si no hay `DATABASE_URL` (p. ej. un test que monta el server real sin
  // BD): sin BD no hay nada que sincronizar; en producción `DATABASE_URL` siempre está.
  if (process.env.DATABASE_URL) {
    const syncLog: SyncLogger = { info: (m) => (logger ? logger.info({}, m) : console.info(m)) };
    await syncAppSettings(prisma, undefined, syncLog);
  } else {
    const msg = 'config sync (AppSetting) omitido: sin DATABASE_URL.';
    if (logger) logger.warn({}, msg);
    else console.warn(msg);
  }

  const settings = new PrismaSettingsRepository(prisma);

  const deps: AppDeps = {
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
    hasher: new BcryptPasswordHasher(),
    bus: new InMemoryEventBus(),
    newId: () => randomUUID(),
    now: () => new Date(),
  };

  // Suscriptores de telemetría y auditoría; añadir más oyentes no toca las rutas.
  wireDomainEvents(deps.bus, deps);
  return deps;
}
