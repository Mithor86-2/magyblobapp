import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../../src/infrastructure/auth/BcryptPasswordHasher.js';

describe('BcryptPasswordHasher', () => {
  // Coste bajo para que el test sea rápido (el valor real lo fija el composition root).
  const hasher = new BcryptPasswordHasher(4);

  it('deriva un hash distinto de la contraseña en claro', async () => {
    const hash = await hasher.hash('Contrasena123');
    expect(hash).not.toBe('Contrasena123');
    expect(hash).not.toContain('Contrasena123');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verify devuelve true con la contraseña correcta', async () => {
    const hash = await hasher.hash('Contrasena123');
    expect(await hasher.verify('Contrasena123', hash)).toBe(true);
  });

  it('verify devuelve false con una contraseña incorrecta', async () => {
    const hash = await hasher.hash('Contrasena123');
    expect(await hasher.verify('otra-distinta', hash)).toBe(false);
  });

  it('produce hashes distintos para la misma contraseña (sal aleatoria)', async () => {
    const a = await hasher.hash('Contrasena123');
    const b = await hasher.hash('Contrasena123');
    expect(a).not.toBe(b);
    // Pero ambos verifican la misma contraseña.
    expect(await hasher.verify('Contrasena123', a)).toBe(true);
    expect(await hasher.verify('Contrasena123', b)).toBe(true);
  });
});
