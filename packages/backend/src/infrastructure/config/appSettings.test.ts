import { describe, expect, it } from 'vitest';
import { decidirAccion, loadAppSettingsJson, parseAppSettings } from './appSettings.js';

describe('appSettings — decidirAccion (US-68)', () => {
  it('crea cuando la clave no existe en BD', () => {
    expect(decidirAccion(1, null)).toBe('crear');
  });

  it('actualiza cuando la versión del JSON es mayor que la aplicada', () => {
    expect(decidirAccion(2, 1)).toBe('actualizar');
  });

  it('omite cuando la versión es igual (preserva el valor de runtime)', () => {
    expect(decidirAccion(1, 1)).toBe('omitir');
  });

  it('omite cuando la versión del JSON es menor (no revierte)', () => {
    expect(decidirAccion(1, 3)).toBe('omitir');
  });
});

describe('appSettings — parseAppSettings (normalización y validación)', () => {
  it('deja los strings igual y normaliza number/boolean/objeto/array a texto', () => {
    const parsed = parseAppSettings({
      settings: [
        { key: 'a.string', version: 1, value: 'gemma:2b' },
        { key: 'a.number', version: 1, value: 0.7 },
        { key: 'a.boolean', version: 1, value: true },
        { key: 'a.object', version: 1, value: { activo: true, target: 'groq' } },
        { key: 'a.array', version: 1, value: ['cuento', 'fabula'] },
      ],
    });
    expect(parsed.find((s) => s.key === 'a.string')?.value).toBe('gemma:2b');
    expect(parsed.find((s) => s.key === 'a.number')?.value).toBe('0.7');
    expect(parsed.find((s) => s.key === 'a.boolean')?.value).toBe('true');
    expect(parsed.find((s) => s.key === 'a.object')?.value).toBe('{"activo":true,"target":"groq"}');
    expect(parsed.find((s) => s.key === 'a.array')?.value).toBe('["cuento","fabula"]');
  });

  it('rechaza versión no entera o menor que 1', () => {
    expect(() => parseAppSettings({ settings: [{ key: 'k', version: 0, value: 'x' }] })).toThrow();
    expect(() =>
      parseAppSettings({ settings: [{ key: 'k', version: 1.5, value: 'x' }] }),
    ).toThrow();
  });

  it('rechaza clave vacía y value ausente/nulo', () => {
    expect(() => parseAppSettings({ settings: [{ key: '  ', version: 1, value: 'x' }] })).toThrow();
    expect(() => parseAppSettings({ settings: [{ key: 'k', version: 1, value: null }] })).toThrow();
    expect(() => parseAppSettings({ settings: [{ key: 'k', version: 1 }] })).toThrow();
  });

  it('rechaza un fichero sin settings o vacío', () => {
    expect(() => parseAppSettings({})).toThrow();
    expect(() => parseAppSettings({ settings: [] })).toThrow();
  });
});

describe('appSettings — loadAppSettingsJson (fuente única real)', () => {
  it('carga y valida prisma/app-settings.json con claves clave del proyecto', () => {
    const settings = loadAppSettingsJson();
    const claves = settings.map((s) => s.key);
    expect(claves).toContain('ai.cloud');
    expect(claves).toContain('prompt.activity.template');
    // ai.cloud se declara como objeto en el JSON y llega normalizado a texto JSON.
    const cloud = settings.find((s) => s.key === 'ai.cloud');
    expect(() => JSON.parse(cloud!.value)).not.toThrow();
    expect(settings.every((s) => s.version >= 1)).toBe(true);
  });
});
