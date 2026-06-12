import { describe, expect, it } from 'vitest';
import { parseCloudSetting } from '../../src/infrastructure/ai/cloudSettings.js';

describe('parseCloudSetting', () => {
  it('parsea un JSON válido con target conocido', () => {
    const raw = JSON.stringify({ activo: true, target: 'groq', model: 'llama-3.3-70b-versatile' });
    expect(parseCloudSetting(raw)).toEqual({
      activo: true,
      target: 'groq',
      model: 'llama-3.3-70b-versatile',
    });
  });

  it('conserva activo:false (opt-in apagado)', () => {
    const raw = JSON.stringify({ activo: false, target: 'gemini', model: 'gemini-2.0-flash' });
    expect(parseCloudSetting(raw)?.activo).toBe(false);
  });

  it('devuelve null si falta, es vacío o no es JSON', () => {
    expect(parseCloudSetting(null)).toBeNull();
    expect(parseCloudSetting(undefined)).toBeNull();
    expect(parseCloudSetting('   ')).toBeNull();
    expect(parseCloudSetting('no-es-json')).toBeNull();
  });

  it('devuelve null ante target desconocido o forma inválida', () => {
    expect(
      parseCloudSetting(JSON.stringify({ activo: true, target: 'azure', model: 'x' })),
    ).toBeNull();
    expect(
      parseCloudSetting(JSON.stringify({ activo: 'si', target: 'groq', model: 'x' })),
    ).toBeNull();
    expect(
      parseCloudSetting(JSON.stringify({ activo: true, target: 'groq', model: '' })),
    ).toBeNull();
    expect(parseCloudSetting(JSON.stringify({ activo: true, target: 'groq' }))).toBeNull();
  });
});
