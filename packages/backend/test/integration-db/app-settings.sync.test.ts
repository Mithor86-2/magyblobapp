import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { AppSettingEntry } from '../../src/infrastructure/config/appSettings.js';
import { syncAppSettings } from '../../src/infrastructure/config/syncAppSettings.js';
import { startTestDb, type TestDb } from '../support/db.js';

const SILENCIO = { info: () => {} };

function entrada(overrides: Partial<AppSettingEntry> & { key: string }): AppSettingEntry {
  return { version: 1, value: 'v', descripcion: 'd', ...overrides };
}

describe('syncAppSettings (Postgres real, US-70)', () => {
  let db: TestDb;

  beforeAll(async () => {
    db = await startTestDb();
  });

  afterAll(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.truncate();
  });

  it('crea las claves ausentes con su versión y valor', async () => {
    const settings = [
      entrada({ key: 'a.uno', value: 'uno' }),
      entrada({ key: 'a.dos', value: 'dos' }),
    ];

    const summary = await syncAppSettings(db.prisma, settings, SILENCIO);

    expect(summary.creadas.sort()).toEqual(['a.dos', 'a.uno']);
    const fila = await db.prisma.appSetting.findUnique({ where: { key: 'a.uno' } });
    expect(fila?.value).toBe('uno');
    expect(fila?.version).toBe(1);
  });

  it('omite (preserva el valor de runtime) cuando la versión es igual', async () => {
    await syncAppSettings(db.prisma, [entrada({ key: 'a.uno', value: 'inicial' })], SILENCIO);
    // Cambio en caliente en la BD (como haría el admin/hot-swap):
    await db.prisma.appSetting.update({ where: { key: 'a.uno' }, data: { value: 'runtime' } });

    const summary = await syncAppSettings(
      db.prisma,
      [entrada({ key: 'a.uno', value: 'inicial' })],
      SILENCIO,
    );

    expect(summary.omitidas).toContain('a.uno');
    const fila = await db.prisma.appSetting.findUnique({ where: { key: 'a.uno' } });
    expect(fila?.value).toBe('runtime'); // NO se pisó
  });

  it('actualiza cuando sube la versión del JSON', async () => {
    await syncAppSettings(
      db.prisma,
      [entrada({ key: 'a.uno', value: 'v1', version: 1 })],
      SILENCIO,
    );

    const summary = await syncAppSettings(
      db.prisma,
      [entrada({ key: 'a.uno', value: 'v2', version: 2 })],
      SILENCIO,
    );

    expect(summary.actualizadas).toContain('a.uno');
    const fila = await db.prisma.appSetting.findUnique({ where: { key: 'a.uno' } });
    expect(fila?.value).toBe('v2');
    expect(fila?.version).toBe(2);
  });

  it('conserva las claves de la BD ausentes del JSON y las reporta como huérfanas', async () => {
    await syncAppSettings(db.prisma, [entrada({ key: 'a.huerfana', value: 'x' })], SILENCIO);

    const summary = await syncAppSettings(
      db.prisma,
      [entrada({ key: 'a.nueva', value: 'y' })],
      SILENCIO,
    );

    expect(summary.huerfanas).toContain('a.huerfana');
    const fila = await db.prisma.appSetting.findUnique({ where: { key: 'a.huerfana' } });
    expect(fila).not.toBeNull(); // se conserva, no se borra
  });

  it('es idempotente: re-ejecutar con la misma versión no cambia nada', async () => {
    const settings = [entrada({ key: 'a.uno', value: 'uno' })];
    await syncAppSettings(db.prisma, settings, SILENCIO);

    const summary = await syncAppSettings(db.prisma, settings, SILENCIO);

    expect(summary.creadas).toHaveLength(0);
    expect(summary.actualizadas).toHaveLength(0);
    expect(summary.omitidas).toContain('a.uno');
  });
});
