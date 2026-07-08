import type { AIProvider } from './domain/ai/AIProvider.js';
import type { TTSProvider } from './domain/tts/TTSProvider.js';
import type { EventBus } from './domain/events/EventBus.js';
import type { GuardianRepository } from './domain/repositories/GuardianRepository.js';
import type { ChildProfileRepository } from './domain/repositories/ChildProfileRepository.js';
import type { StoryRepository } from './domain/repositories/StoryRepository.js';
import type { StoryCoverCatalog } from './domain/repositories/StoryCoverCatalog.js';
import type { StoryNarrationRepository } from './domain/repositories/StoryNarrationRepository.js';
import type { ActivityRepository } from './domain/repositories/ActivityRepository.js';
import type { AchievementRepository } from './domain/repositories/AchievementRepository.js';
import type { InteractionEventRepository } from './domain/repositories/InteractionEventRepository.js';
import type { AuditLogRepository } from './domain/repositories/AuditLogRepository.js';
import type { PasswordHasher } from './domain/auth/PasswordHasher.js';
import type { EmailVerificationRepository } from './domain/repositories/EmailVerificationRepository.js';
import type { EmailService } from './domain/services/EmailService.js';
import type { CodeGenerator } from './domain/services/CodeGenerator.js';
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
  /** Catálogo de portadas configurables por tema/estilo (US-101, `story.covers`). */
  covers: StoryCoverCatalog;
  narrations: StoryNarrationRepository;
  activities: ActivityRepository;
  /** Logros desbloqueados por perfil (US-68). */
  achievements: AchievementRepository;
  events: InteractionEventRepository;
  audit: AuditLogRepository;
  ai: AIProvider;
  tts: TTSProvider;
  /** Hasher de contraseñas (US-48): el alta deriva el hash, el login lo verifica. */
  hasher: PasswordHasher;
  /** Verificaciones de email pendientes (US-93). */
  emailVerifications: EmailVerificationRepository;
  /** Generador del código OTP (US-93). */
  codeGenerator: CodeGenerator;
  /**
   * Servicio de email (US-93). **Opcional**: presente solo si hay SMTP configurado.
   * Ausente ⇒ la verificación se omite (alta auto-verificada y auto-login).
   */
  emailService?: EmailService;
  /** Bus de eventos de dominio (Observer): las rutas publican, los suscriptores registran. */
  bus: EventBus;
  newId: IdGenerator;
  now: Clock;
}
