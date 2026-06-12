import type { Activity } from '../entities/Activity.js';

/** Puerto de persistencia de actividades. Implementación en infraestructura. */
export interface ActivityRepository {
  save(activity: Activity): Promise<void>;
  /** Actividades de un perfil, de la más reciente a la más antigua. */
  findByProfile(profileId: string): Promise<Activity[]>;
}
