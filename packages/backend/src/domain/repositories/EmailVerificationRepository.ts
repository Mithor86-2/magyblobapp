import type { EmailVerification } from '../entities/EmailVerification.js';

/**
 * Puerto de persistencia de la verificación de email (US-93). La implementación
 * concreta (PostgreSQL/Prisma) vive en infraestructura. Hay como mucho **una**
 * verificación por guardián (`guardianId` único): `guardar` la crea o la reemplaza
 * (un reenvío regenera el código e invalida el anterior).
 */
export interface EmailVerificationRepository {
  /** Crea o reemplaza la verificación del guardián (upsert por `guardianId`). */
  guardar(verificacion: EmailVerification): Promise<void>;
  /** Devuelve la verificación pendiente del guardián, o `null` si no hay. */
  buscarPorGuardian(guardianId: string): Promise<EmailVerification | null>;
}
