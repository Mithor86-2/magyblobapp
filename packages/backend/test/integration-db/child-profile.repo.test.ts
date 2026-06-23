import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaChildProfileRepository } from '../../src/infrastructure/repositories/PrismaChildProfileRepository.js';
import { PrismaGuardianRepository } from '../../src/infrastructure/repositories/PrismaGuardianRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { nuevoGuardian, nuevoPerfil } from '../support/fixtures.js';

describe('PrismaChildProfileRepository (Postgres real)', () => {
  let db: TestDb;
  let profiles: PrismaChildProfileRepository;
  let guardians: PrismaGuardianRepository;

  beforeAll(async () => {
    db = await startTestDb();
    profiles = new PrismaChildProfileRepository(db.prisma);
    guardians = new PrismaGuardianRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
  });

  async function adultoExistente(): Promise<string> {
    const guardian = nuevoGuardian();
    await guardians.save(guardian);
    return guardian.id;
  }

  it('persiste un perfil y lo recupera con value-objects y array de intereses intactos', async () => {
    const guardianId = await adultoExistente();
    const perfil = nuevoPerfil(guardianId);

    await profiles.save(perfil);
    const recuperado = await profiles.findById(perfil.id);

    expect(recuperado).not.toBeNull();
    expect(recuperado?.edad.value).toBe(4);
    expect(recuperado?.idioma.value).toBe('es');
    expect(recuperado?.intereses).toEqual(['animales', 'espacio']);
    expect(recuperado).toEqual(perfil);
  });

  it('lista los perfiles de un adulto ordenados por fecha de creación', async () => {
    const guardianId = await adultoExistente();
    await profiles.save(nuevoPerfil(guardianId));
    await profiles.save(nuevoPerfil(guardianId));

    const lista = await profiles.findByGuardian(guardianId);

    expect(lista).toHaveLength(2);
    expect(lista.every((p) => p.guardianId === guardianId)).toBe(true);
  });

  it('falla si el guardianId referenciado no existe (FK real)', async () => {
    const huerfano = nuevoPerfil(randomUUID());

    await expect(profiles.save(huerfano)).rejects.toThrow();
  });

  it('borra en cascada los perfiles al eliminar su adulto (onDelete: Cascade)', async () => {
    const guardianId = await adultoExistente();
    const perfil = nuevoPerfil(guardianId);
    await profiles.save(perfil);

    await db.prisma.guardian.delete({ where: { id: guardianId } });

    expect(await profiles.findById(perfil.id)).toBeNull();
  });
});
