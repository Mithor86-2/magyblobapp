import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

/** Parseo de la configuración de autenticación JWT (US-45). */
describe('loadConfig — auth (JWT)', () => {
  it('aplica defaults de desarrollo cuando no hay variables de entorno', () => {
    const { auth } = loadConfig({});
    expect(auth.secret.length).toBeGreaterThan(0);
    expect(auth.accessTtl).toBe('15m');
    expect(auth.refreshTtl).toBe('7d');
  });

  it('toma el secreto y los TTL de las variables de entorno', () => {
    const { auth } = loadConfig({
      JWT_SECRET: 'secreto-de-produccion',
      JWT_ACCESS_TTL: '5m',
      JWT_REFRESH_TTL: '30d',
    });
    expect(auth.secret).toBe('secreto-de-produccion');
    expect(auth.accessTtl).toBe('5m');
    expect(auth.refreshTtl).toBe('30d');
  });

  it('ignora un JWT_SECRET en blanco y cae al default', () => {
    const { auth } = loadConfig({ JWT_SECRET: '   ' });
    expect(auth.secret).not.toBe('   ');
    expect(auth.secret.length).toBeGreaterThan(0);
  });
});
