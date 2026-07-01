import type { Achievement } from '../entities/Achievement.js';

/**
 * Puerto de persistencia de logros desbloqueados (US-68). Implementación en
 * infraestructura. `unlock` es **idempotente**: registrar un logro ya desbloqueado no
 * lo duplica ni cambia su fecha (unicidad `profileId` + `clave`).
 */
export interface AchievementRepository {
  /** Logros ya desbloqueados por un perfil. */
  findByProfile(profileId: string): Promise<Achievement[]>;
  /** Registra un logro desbloqueado; no hace nada si ya existía (idempotente). */
  unlock(achievement: Achievement): Promise<void>;
}
