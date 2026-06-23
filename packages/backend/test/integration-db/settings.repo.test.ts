import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaSettingsRepository } from '../../src/infrastructure/repositories/PrismaSettingsRepository.js';
import { startTestDb, type TestDb } from '../support/db.js';

describe('PrismaSettingsRepository (Postgres real)', () => {
  let db: TestDb;
  let repo: PrismaSettingsRepository;

  beforeAll(async () => {
    db = await startTestDb();
    repo = new PrismaSettingsRepository(db.prisma);
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
  });

  it('lee el valor de una clave existente', async () => {
    await db.prisma.appSetting.create({
      data: { key: 'prompt.story.params', value: '{"longitud":"media"}' },
    });

    expect(await repo.get('prompt.story.params')).toBe('{"longitud":"media"}');
  });

  it('devuelve null cuando la clave no existe', async () => {
    expect(await repo.get('clave.inexistente')).toBeNull();
  });
});
