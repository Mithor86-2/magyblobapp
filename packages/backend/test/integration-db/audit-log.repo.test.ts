import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaAuditLogRepository } from '../../src/infrastructure/repositories/PrismaAuditLogRepository.js';
import { PrismaGuardianRepository } from '../../src/infrastructure/repositories/PrismaGuardianRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { nuevaAuditoria, nuevoGuardian } from '../support/fixtures.js';

describe('PrismaAuditLogRepository (Postgres real)', () => {
  let db: TestDb;
  let repo: PrismaAuditLogRepository;
  let guardians: PrismaGuardianRepository;

  beforeAll(async () => {
    db = await startTestDb();
    repo = new PrismaAuditLogRepository(db.prisma);
    guardians = new PrismaGuardianRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
  });

  it('persiste una entrada con guardián y metadatos JSON', async () => {
    const guardian = nuevoGuardian();
    await guardians.save(guardian);
    const entrada = nuevaAuditoria({ guardianId: guardian.id });

    await repo.save(entrada);

    const row = await db.prisma.auditLog.findUnique({ where: { id: entrada.id } });
    expect(row?.guardianId).toBe(guardian.id);
    expect(row?.accion).toBe('login');
    expect(row?.metadatos).toEqual({ resultado: 'ok' });
  });

  it('persiste una acción del sistema sin guardián', async () => {
    const entrada = nuevaAuditoria({ guardianId: undefined });

    await repo.save(entrada);

    const row = await db.prisma.auditLog.findUnique({ where: { id: entrada.id } });
    expect(row?.guardianId).toBeNull();
  });

  it('conserva la entrada al borrar el adulto, anulando la referencia (onDelete: SetNull)', async () => {
    const guardian = nuevoGuardian();
    await guardians.save(guardian);
    const entrada = nuevaAuditoria({ guardianId: guardian.id });
    await repo.save(entrada);

    await db.prisma.guardian.delete({ where: { id: guardian.id } });

    const row = await db.prisma.auditLog.findUnique({ where: { id: entrada.id } });
    expect(row).not.toBeNull();
    expect(row?.guardianId).toBeNull();
  });
});
