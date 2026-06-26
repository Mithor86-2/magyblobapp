import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaStoryNarrationRepository } from '../../src/infrastructure/repositories/PrismaStoryNarrationRepository.js';
import { PrismaStoryRepository } from '../../src/infrastructure/repositories/PrismaStoryRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';
import { nuevaNarracion, nuevoCuento, seedGuardianYPerfil } from '../support/fixtures.js';

describe('PrismaStoryNarrationRepository (Postgres real)', () => {
  let db: TestDb;
  let repo: PrismaStoryNarrationRepository;
  let stories: PrismaStoryRepository;
  let storyId: string;

  beforeAll(async () => {
    db = await startTestDb();
    repo = new PrismaStoryNarrationRepository(db.prisma);
    stories = new PrismaStoryRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
    const { profileId } = await seedGuardianYPerfil(db.prisma);
    const cuento = nuevoCuento(profileId);
    await stories.save(cuento);
    storyId = cuento.id;
  });

  it('persiste el MP3 (bytes) y lo recupera idéntico', async () => {
    const narracion = nuevaNarracion(storyId);

    await repo.save(narracion);
    const recuperada = await repo.findByStory(storyId);

    expect(recuperada).not.toBeNull();
    expect(recuperada?.voiceId).toBe('voz-test');
    expect(Array.from(recuperada?.mp3 ?? [])).toEqual(Array.from(narracion.mp3));
  });

  it('es inmutable: re-guardar no sobrescribe el audio ya cacheado (upsert update vacío)', async () => {
    await repo.save(nuevaNarracion(storyId));
    const primera = await repo.findByStory(storyId);

    await repo.save(nuevaNarracion(storyId)); // distinto id, mismo storyId
    const segunda = await repo.findByStory(storyId);

    expect(segunda?.id).toBe(primera?.id);
  });

  it('se borra en cascada al eliminar el cuento (onDelete: Cascade)', async () => {
    await repo.save(nuevaNarracion(storyId));

    await db.prisma.story.delete({ where: { id: storyId } });

    expect(await repo.findByStory(storyId)).toBeNull();
  });
});
