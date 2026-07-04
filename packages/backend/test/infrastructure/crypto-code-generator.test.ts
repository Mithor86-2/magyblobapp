import { describe, expect, it } from 'vitest';
import { CryptoCodeGenerator } from '../../src/infrastructure/services/CryptoCodeGenerator.js';

describe('CryptoCodeGenerator', () => {
  const gen = new CryptoCodeGenerator();

  it('genera siempre 6 dígitos (con ceros a la izquierda)', () => {
    for (let i = 0; i < 500; i++) {
      const codigo = gen.generar();
      expect(codigo).toMatch(/^\d{6}$/);
    }
  });

  it('produce valores variados (no constante)', () => {
    const muestras = new Set(Array.from({ length: 50 }, () => gen.generar()));
    expect(muestras.size).toBeGreaterThan(1);
  });
});
