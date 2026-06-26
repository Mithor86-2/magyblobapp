import type { AIProvider } from './domain/ai/AIProvider.js';
import type { TTSProvider } from './domain/tts/TTSProvider.js';
import type { EventBus } from './domain/events/EventBus.js';
import type { GuardianRepository } from './domain/repositories/GuardianRepository.js';
import type { ChildProfileRepository } from './domain/repositories/ChildProfileRepository.js';
import type { StoryRepository } from './domain/repositories/StoryRepository.js';
import type { StoryNarrationRepository } from './domain/repositories/StoryNarrationRepository.js';
import type { ActivityRepository } from './domain/repositories/ActivityRepository.js';
import type { InteractionEventRepository } from './domain/repositories/InteractionEventRepository.js';
import type { AuditLogRepository } from './domain/repositories/AuditLogRepository.js';
import type { PasswordHasher } from './domain/auth/PasswordHasher.js';
import type { Clock, IdGenerator } from './application/ports.js';

/**
 * Dependencias que las rutas necesitan, agrupadas para inyectarlas. En producción
 * las construye `buildProductionDeps` (repos Prisma + AIProvider real); en los tests
 * se pasan dobles en memoria, de modo que `app.inject` ejercita el HTTP sin tocar DB.
 */
export interface AppDeps {
  guardians: GuardianRepository;
  profiles: ChildProfileRepository;
  stories: StoryRepository;
  narrations: StoryNarrationRepository;
  activities: ActivityRepository;
  events: InteractionEventRepository;
  audit: AuditLogRepository;
  ai: AIProvider;
  tts: TTSProvider;
  /** Hasher de contraseñas (US-48): el alta deriva el hash, el login lo verifica. */
  hasher: PasswordHasher;
  /** Bus de eventos de dominio (Observer): las rutas publican, los suscriptores registran. */
  bus: EventBus;
  newId: IdGenerator;
  now: Clock;
}
