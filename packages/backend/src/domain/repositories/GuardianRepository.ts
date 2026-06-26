import type { Guardian } from '../entities/Guardian.js';

/**
 * Puerto de persistencia de adultos. La implementación concreta (PostgreSQL)
 * vive en infraestructura (Fase 3); el dominio solo conoce esta interfaz.
 */
export interface GuardianRepository {
  save(guardian: Guardian): Promise<void>;
  findById(id: string): Promise<Guardian | null>;
  findByEmail(email: string): Promise<Guardian | null>;
}
