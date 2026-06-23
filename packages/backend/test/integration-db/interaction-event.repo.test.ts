import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaInteractionEventRepository } from '../../src/infrastructure/repositories/PrismaInteractionEventRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { nuevoEvento, seedGuardianYPerfil } from '../support/fixtures.js';

describe('PrismaInteractionEventRepository (Postgres real)', () => {
  let db: TestDb;
  let repo: PrismaInteractionEventRepository;
  let profileId: string;

  beforeAll(async () => {
    db = await startTestDb();
    repo = new PrismaInteractionEventRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
    ({ profileId } = await seedGuardianYPerfil(db.prisma));
  });

  it('persiste un evento con su payload JSON', async () => {
    const evento = nuevoEvento(profileId, { payload: { tema: 'espacio', n: 2 } });

    await repo.save(evento);

    const row = await db.prisma.interactionEvent.findUnique({ where: { id: evento.id } });
    expect(row?.tipo).toBe('cuento_generado');
    expect(row?.payload).toEqual({ tema: 'espacio', n: 2 });
  });

  it('persiste un evento sin payload (JSON null)', async () => {
    const evento = nuevoEvento(profileId, { payload: undefined });

    await repo.save(evento);

    const row = await db.prisma.interactionEvent.findUnique({ where: { id: evento.id } });
    expect(row?.payload).toBeNull();
  });

  it('se borra en cascada al eliminar el perfil (onDelete: Cascade)', async () => {
    const evento = nuevoEvento(profileId);
    await repo.save(evento);

    await db.prisma.childProfile.delete({ where: { id: profileId } });

    const row = await db.prisma.interactionEvent.findUnique({ where: { id: evento.id } });
    expect(row).toBeNull();
  });
});
