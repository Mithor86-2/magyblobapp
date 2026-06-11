import type { ChildProfile } from '../entities/ChildProfile.js';

/** Puerto de persistencia de perfiles de niño. Implementación en infraestructura. */
export interface ChildProfileRepository {
  save(profile: ChildProfile): Promise<void>;
  findById(id: string): Promise<ChildProfile | null>;
  /** Perfiles que tutela un adulto (soporte multi-niño). */
  findByGuardian(guardianId: string): Promise<ChildProfile[]>;
}
