import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaActivityRepository } from '../../src/infrastructure/repositories/PrismaActivityRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { nuevaActividad, seedGuardianYPerfil } from '../support/fixtures.js';

describe('PrismaActivityRepository (Postgres real)', () => {
  let db: TestDb;
  let repo: PrismaActivityRepository;
  let profileId: string;

  beforeAll(async () => {
    db = await startTestDb();
    repo = new PrismaActivityRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
    ({ profileId } = await seedGuardianYPerfil(db.prisma));
  });

  it('persiste una actividad y la recupera con campos opcionales intactos', async () => {
    const actividad = nuevaActividad(profileId);

    await repo.save(actividad);
    const recuperada = await repo.findById(actividad.id);

    expect(recuperada).toEqual(actividad);
    expect(recuperada?.duracionMin).toBe(15);
    expect(recuperada?.nivel).toBe(1);
    expect(recuperada?.completadaEn).toBeUndefined();
  });

  it('registra la finalización (valoración + fecha) al volver a guardar (upsert)', async () => {
    const actividad = nuevaActividad(profileId);
    await repo.save(actividad);

    actividad.completar(3, new Date('2026-06-12T10:00:00.000Z'));
    await repo.save(actividad);

    const recuperada = await repo.findById(actividad.id);
    expect(recuperada?.valoracion).toBe(3);
    expect(recuperada?.completadaEn).toEqual(new Date('2026-06-12T10:00:00.000Z'));
    expect(await repo.findByProfile(profileId)).toHaveLength(1);
  });
});
