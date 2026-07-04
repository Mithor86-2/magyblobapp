import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { EmailVerification } from '../../src/domain/entities/EmailVerification.js';
import { PrismaEmailVerificationRepository } from '../../src/infrastructure/repositories/PrismaEmailVerificationRepository.js';
import { PrismaGuardianRepository } from '../../src/infrastructure/repositories/PrismaGuardianRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { nuevoGuardian } from '../support/fixtures.js';

const AHORA = new Date('2026-07-03T12:00:00.000Z');

describe('PrismaEmailVerificationRepository (Postgres real)', () => {
  let db: TestDb;
  let repo: PrismaEmailVerificationRepository;
  let guardians: PrismaGuardianRepository;

  beforeAll(async () => {
    db = await startTestDb();
    repo = new PrismaEmailVerificationRepository(db.prisma);
    guardians = new PrismaGuardianRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
  });

  function verificacion(guardianId: string, overrides: Partial<{ intentos: number }> = {}) {
    return new EmailVerification({
      id: 'v-1',
      guardianId,
      codigoHash: 'hashed:123456',
      expiraEn: new Date(AHORA.getTime() + 600_000),
      intentos: overrides.intentos ?? 0,
      creadoEn: AHORA,
    });
  }

  it('persiste y recupera la verificación por guardián', async () => {
    const guardian = nuevoGuardian();
    await guardians.save(guardian);

    await repo.guardar(verificacion(guardian.id));
    const recuperada = await repo.buscarPorGuardian(guardian.id);

    expect(recuperada).not.toBeNull();
    expect(recuperada?.codigoHash).toBe('hashed:123456');
    expect(recuperada?.intentos).toBe(0);
  });

  it('guardar hace upsert por guardianId (un reenvío reemplaza el registro)', async () => {
    const guardian = nuevoGuardian();
    await guardians.save(guardian);

    await repo.guardar(verificacion(guardian.id, { intentos: 3 }));
    // Segundo guardar con el mismo guardianId: reemplaza (intentos vuelve a 0).
    await repo.guardar(verificacion(guardian.id, { intentos: 0 }));

    const recuperada = await repo.buscarPorGuardian(guardian.id);
    expect(recuperada?.intentos).toBe(0);
  });

  it('marcarEmailVerificado del guardián activa el flag', async () => {
    const guardian = nuevoGuardian();
    await guardians.save(guardian);

    await guardians.marcarEmailVerificado(guardian.id);

    expect((await guardians.findById(guardian.id))?.emailVerificado).toBe(true);
  });

  it('devuelve null cuando no hay verificación', async () => {
    expect(await repo.buscarPorGuardian('ausente')).toBeNull();
  });
});
