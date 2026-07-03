import type { EmailVerification as PrismaEmailVerification } from '../../generated/prisma/client.js';
import { EmailVerification } from '../../domain/entities/EmailVerification.js';
import type { EmailVerificationRepository } from '../../domain/repositories/EmailVerificationRepository.js';
import type { PrismaClient } from '../db/prismaClient.js';

/**
 * Repositorio de verificaciones de email sobre PostgreSQL (Prisma, US-93).
 * `guardar` hace upsert por `guardianId` (único): un reenvío reemplaza el registro
 * anterior (nuevo código, intentos a cero).
 */
export class PrismaEmailVerificationRepository implements EmailVerificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(verificacion: EmailVerification): Promise<void> {
    const datos = {
      codigoHash: verificacion.codigoHash,
      expiraEn: verificacion.expiraEn,
      intentos: verificacion.intentos,
      verificadoEn: verificacion.verificadoEn ?? null,
      creadoEn: verificacion.creadoEn,
    };
    await this.prisma.emailVerification.upsert({
      where: { guardianId: verificacion.guardianId },
      create: { id: verificacion.id, guardianId: verificacion.guardianId, ...datos },
      update: datos,
    });
  }

  async buscarPorGuardian(guardianId: string): Promise<EmailVerification | null> {
    const row = await this.prisma.emailVerification.findUnique({ where: { guardianId } });
    return row ? toEmailVerification(row) : null;
  }
}

function toEmailVerification(row: PrismaEmailVerification): EmailVerification {
  return new EmailVerification({
    id: row.id,
    guardianId: row.guardianId,
    codigoHash: row.codigoHash,
    expiraEn: row.expiraEn,
    intentos: row.intentos,
    verificadoEn: row.verificadoEn ?? undefined,
    creadoEn: row.creadoEn,
  });
}
