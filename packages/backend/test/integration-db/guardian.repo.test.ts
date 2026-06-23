import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaGuardianRepository } from '../../src/infrastructure/repositories/PrismaGuardianRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { nuevoGuardian } from '../support/fixtures.js';

describe('PrismaGuardianRepository (Postgres real)', () => {
  let db: TestDb;
  let repo: PrismaGuardianRepository;

  beforeAll(async () => {
    db = await startTestDb();
    repo = new PrismaGuardianRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
  });

  it('persiste un adulto y lo recupera por id con el mapeo ORM↔dominio intacto', async () => {
    const guardian = nuevoGuardian();

    await repo.save(guardian);
    const recuperado = await repo.findById(guardian.id);

    expect(recuperado).not.toBeNull();
    expect(recuperado).toEqual(guardian);
    // El consentimiento, partido en 3 columnas al guardar, se recompone correctamente.
    expect(recuperado?.consentimiento).toEqual(guardian.consentimiento);
  });

  it('recupera por email (normalizado a minúsculas por el dominio)', async () => {
    const guardian = nuevoGuardian({ email: 'Mayus@Example.com' });
    await repo.save(guardian);

    const recuperado = await repo.findByEmail('mayus@example.com');

    expect(recuperado?.id).toBe(guardian.id);
    expect(recuperado?.email).toBe('mayus@example.com');
  });

  it('devuelve null cuando el id o el email no existen', async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
    expect(await repo.findByEmail('nadie@example.com')).toBeNull();
  });

  it('respeta la unicidad de email a nivel de base de datos', async () => {
    await repo.save(nuevoGuardian({ email: 'dup@example.com' }));

    await expect(repo.save(nuevoGuardian({ email: 'dup@example.com' }))).rejects.toThrow();
  });
});
