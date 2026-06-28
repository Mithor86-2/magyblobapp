import { describe, expect, it } from 'vitest';
import { formatearFecha } from './formatFecha';

/**
 * US-62: la fecha de generación (`creadoEn` ISO) se muestra formateada y
 * localizada; si falta o es inválida, no se muestra nada (la función devuelve
 * `null` y la UI omite la fecha).
 */
describe('formatearFecha', () => {
  const iso = '2026-06-25T10:30:00.000Z';

  it('formatea la fecha ISO en español', () => {
    const out = formatearFecha(iso, 'es');
    expect(out).not.toBeNull();
    // Localización ES: día numérico, mes abreviado y año (p. ej. "25 jun 2026").
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/25/);
  });

  it('formatea la fecha ISO en inglés', () => {
    const out = formatearFecha(iso, 'en');
    expect(out).not.toBeNull();
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/25/);
  });

  it('localiza distinto según el idioma del app', () => {
    expect(formatearFecha(iso, 'es')).not.toBe(formatearFecha(iso, 'en'));
  });

  it('devuelve null si la fecha falta', () => {
    expect(formatearFecha(undefined, 'es')).toBeNull();
  });

  it('devuelve null si la fecha es inválida', () => {
    expect(formatearFecha('no-es-una-fecha', 'es')).toBeNull();
  });
});
