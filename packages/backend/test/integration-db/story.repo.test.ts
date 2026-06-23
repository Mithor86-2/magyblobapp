import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaStoryRepository } from '../../src/infrastructure/repositories/PrismaStoryRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { nuevoCuento, seedGuardianYPerfil } from '../support/fixtures.js';

describe('PrismaStoryRepository (Postgres real)', () => {
  let db: TestDb;
  let repo: PrismaStoryRepository;
  let profileId: string;

  beforeAll(async () => {
    db = await startTestDb();
    repo = new PrismaStoryRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
    ({ profileId } = await seedGuardianYPerfil(db.prisma));
  });

  it('persiste un cuento y lo recupera por id con su mapeo intacto', async () => {
    const cuento = nuevoCuento(profileId);

    await repo.save(cuento);
    const recuperado = await repo.findById(cuento.id);

    expect(recuperado).toEqual(cuento);
    expect(recuperado?.estado).toBe('nuevo');
    expect(recuperado?.proveedor).toBe('mock');
  });

  it('lista los cuentos de un perfil del más reciente al más antiguo', async () => {
    await repo.save(nuevoCuento(profileId));
    await repo.save(nuevoCuento(profileId));

    const lista = await repo.findByProfile(profileId);

    expect(lista).toHaveLength(2);
    expect(lista[0].creadoEn.getTime()).toBeGreaterThanOrEqual(lista[1].creadoEn.getTime());
  });

  it('actualiza el estado al volver a guardar (upsert) sin crear duplicado', async () => {
    const cuento = nuevoCuento(profileId);
    await repo.save(cuento);

    cuento.marcarLeido();
    await repo.save(cuento);

    const recuperado = await repo.findById(cuento.id);
    expect(recuperado?.estado).toBe('leido');
    expect(await repo.findByProfile(profileId)).toHaveLength(1);
  });

  it('falla si el profileId referenciado no existe (FK real)', async () => {
    await expect(repo.save(nuevoCuento(randomUUID()))).rejects.toThrow();
  });
});
