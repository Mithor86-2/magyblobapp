import { describe, expect, it } from 'vitest';
import { resolveScheme } from './ThemeProvider';

/**
 * Pruebas de `resolveScheme` (US-66): la resolución del esquema efectivo a partir
 * de la preferencia de la persona adulta y el esquema del sistema operativo. Es
 * función pura, así que se prueba en aislamiento (sin render ni provider). La
 * matriz cubre `system` × {light, dark, null, undefined} y las preferencias
 * explícitas, que ignoran el esquema del SO.
 */
describe('resolveScheme (US-66)', () => {
  it('preference=system sigue el esquema del sistema', () => {
    expect(resolveScheme('system', 'light')).toBe('light');
    expect(resolveScheme('system', 'dark')).toBe('dark');
  });

  it('preference=system cae a claro cuando el SO no reporta esquema', () => {
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', undefined)).toBe('light');
  });

  it('preference explícita ignora el esquema del sistema', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('light', null)).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('dark', undefined)).toBe('dark');
  });
});
