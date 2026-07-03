import { describe, expect, it } from 'vitest';
import { EmailVerification } from '../../src/domain/entities/EmailVerification.js';
import { DomainError } from '../../src/domain/errors.js';

const AHORA = new Date('2026-07-03T12:00:00.000Z');

function crear(overrides: Partial<{ intentos: number; verificadoEn?: Date; expiraEn: Date }> = {}) {
  return new EmailVerification({
    id: 'v-1',
    guardianId: 'g-1',
    codigoHash: 'hashed:123456',
    expiraEn: overrides.expiraEn ?? new Date(AHORA.getTime() + 600_000),
    intentos: overrides.intentos ?? 0,
    verificadoEn: overrides.verificadoEn,
    creadoEn: AHORA,
  });
}

describe('EmailVerification', () => {
  it('rechaza un hash de código vacío', () => {
    expect(() => new EmailVerification({ ...crear(), codigoHash: '  ' })).toThrow(DomainError);
  });

  it('rechaza intentos negativos', () => {
    expect(() => new EmailVerification({ ...crear(), intentos: -1 })).toThrow(DomainError);
  });

  it('estaExpirado compara con el instante dado (límite inclusivo)', () => {
    const v = crear({ expiraEn: AHORA });
    expect(v.estaExpirado(AHORA)).toBe(true);
    expect(v.estaExpirado(new Date(AHORA.getTime() - 1))).toBe(false);
  });

  it('estaVerificado refleja verificadoEn', () => {
    expect(crear().estaVerificado()).toBe(false);
    expect(crear({ verificadoEn: AHORA }).estaVerificado()).toBe(true);
  });

  it('superaIntentos según el máximo', () => {
    expect(crear({ intentos: 4 }).superaIntentos(5)).toBe(false);
    expect(crear({ intentos: 5 }).superaIntentos(5)).toBe(true);
  });

  it('conIntentoFallido incrementa intentos sin mutar el original', () => {
    const v = crear({ intentos: 2 });
    const siguiente = v.conIntentoFallido();
    expect(siguiente.intentos).toBe(3);
    expect(v.intentos).toBe(2);
  });

  it('marcarVerificado fija verificadoEn', () => {
    const v = crear().marcarVerificado(AHORA);
    expect(v.verificadoEn).toEqual(AHORA);
    expect(v.estaVerificado()).toBe(true);
  });
});
