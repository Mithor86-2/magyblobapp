import type { Guardian as PrismaGuardian } from '../../generated/prisma/client.js';
import { Guardian } from '../../domain/entities/Guardian.js';
import type { GuardianRepository } from '../../domain/repositories/GuardianRepository.js';
import type { Parentesco } from '../../domain/vocabulary.js';
import type { PrismaClient } from '../db/prismaClient.js';

/** Repositorio de adultos sobre PostgreSQL (Prisma). */
export class PrismaGuardianRepository implements GuardianRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(guardian: Guardian): Promise<void> {
    await this.prisma.guardian.create({
      data: {
        id: guardian.id,
        nombre: guardian.nombre,
        apellidos: guardian.apellidos,
        email: guardian.email,
        parentesco: guardian.parentesco,
        telefono: guardian.telefono ?? null,
        passwordHash: guardian.passwordHash,
        consentimientoDado: guardian.consentimiento.dado,
        consentimientoEn: guardian.consentimiento.fecha,
        consentimientoVer: guardian.consentimiento.version,
        creadoEn: guardian.creadoEn,
      },
    });
  }

  async findById(id: string): Promise<Guardian | null> {
    const row = await this.prisma.guardian.findUnique({ where: { id } });
    return row ? toGuardian(row) : null;
  }

  async findByEmail(email: string): Promise<Guardian | null> {
    const row = await this.prisma.guardian.findUnique({ where: { email } });
    return row ? toGuardian(row) : null;
  }
}

function toGuardian(row: PrismaGuardian): Guardian {
  return new Guardian({
    id: row.id,
    nombre: row.nombre,
    apellidos: row.apellidos,
    email: row.email,
    parentesco: row.parentesco as Parentesco,
    telefono: row.telefono ?? undefined,
    passwordHash: row.passwordHash,
    consentimiento: {
      dado: row.consentimientoDado,
      fecha: row.consentimientoEn,
      version: row.consentimientoVer,
    },
    creadoEn: row.creadoEn,
  });
}
