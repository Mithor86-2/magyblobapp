import { describe, expect, it } from 'vitest';
import { parseCloudSetting } from './cloudSettings.js';

/**
 * Tests del parseo/validación de `ai.cloud` (US-14 + cascada US-99). Privacidad por
 * defecto: ante cualquier duda (JSON inválido, forma incorrecta, target desconocido)
 * devuelve `null` y el modo cloud no se activa.
 */
describe('parseCloudSetting', () => {
  it('parsea la forma simple {activo,target,model} (retrocompat, sin fallbacks)', () => {
    const cfg = parseCloudSetting(
      JSON.stringify({ activo: true, target: 'groq', model: 'llama-3.3-70b-versatile' }),
    );
    expect(cfg).toEqual({ activo: true, target: 'groq', model: 'llama-3.3-70b-versatile' });
    expect(cfg?.fallbacks).toBeUndefined();
  });

  it('parsea la cascada con fallbacks (US-99)', () => {
    const cfg = parseCloudSetting(
      JSON.stringify({
        activo: true,
        target: 'gemini',
        model: 'gemini-2.5-flash',
        fallbacks: [{ target: 'groq', model: 'llama-3.3-70b-versatile' }],
      }),
    );
    expect(cfg?.target).toBe('gemini');
    expect(cfg?.fallbacks).toEqual([{ target: 'groq', model: 'llama-3.3-70b-versatile' }]);
  });

  it('devuelve null si un fallback tiene target desconocido', () => {
    const cfg = parseCloudSetting(
      JSON.stringify({
        activo: true,
        target: 'gemini',
        model: 'gemini-2.5-flash',
        fallbacks: [{ target: 'inventado', model: 'x' }],
      }),
    );
    expect(cfg).toBeNull();
  });

  it('devuelve null si un fallback tiene model vacío', () => {
    const cfg = parseCloudSetting(
      JSON.stringify({
        activo: true,
        target: 'gemini',
        model: 'gemini-2.5-flash',
        fallbacks: [{ target: 'groq', model: '  ' }],
      }),
    );
    expect(cfg).toBeNull();
  });

  it('devuelve null ante ausencia, JSON inválido o target primario desconocido', () => {
    expect(parseCloudSetting(null)).toBeNull();
    expect(parseCloudSetting('')).toBeNull();
    expect(parseCloudSetting('{no-json')).toBeNull();
    expect(
      parseCloudSetting(JSON.stringify({ activo: true, target: 'nope', model: 'x' })),
    ).toBeNull();
  });
});
