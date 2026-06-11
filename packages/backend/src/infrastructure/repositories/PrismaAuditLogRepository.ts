import { Prisma } from '../../generated/prisma/index.js';
import type { AuditLog } from '../../domain/entities/AuditLog.js';
import type { AuditLogRepository } from '../../domain/repositories/AuditLogRepository.js';
import type { PrismaClient } from '../db/prismaClient.js';

/** Repositorio de auditoría sobre PostgreSQL (Prisma). */
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(entry: AuditLog): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: entry.id,
        guardianId: entry.guardianId ?? null,
        accion: entry.accion,
        entidad: entry.entidad,
        entidadId: entry.entidadId,
        metadatos: (entry.metadatos as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
        creadoEn: entry.creadoEn,
      },
    });
  }
}
