import { describe, expect, it } from 'vitest';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { DomainError } from '../../src/domain/errors.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';

function build(overrides: Partial<Parameters<typeof ChildProfile.prototype.constructor>[0]> = {}) {
  return new ChildProfile({
    id: 'p-1',
    guardianId: 'g-1',
    nombre: 'Mateo',
    edad: Edad.create(4),
    idioma: Idioma.create('es'),
    avatar: 'avatar-3',
    intereses: ['animales'],
    creadoEn: new Date('2026-06-10T12:00:00.000Z'),
    ...overrides,
  });
}

describe('ChildProfile', () => {
  it('se crea con datos válidos', () => {
    const p = build();
    expect(p.nombre).toBe('Mateo');
    expect(p.edad.value).toBe(4);
    expect(p.intereses).toEqual(['animales']);
  });

  it('exige nombre no vacío', () => {
    expect(() => build({ nombre: '  ' })).toThrow(DomainError);
  });

  it('exige elegir un avatar', () => {
    expect(() => build({ avatar: '  ' })).toThrow(DomainError);
  });

  it('exige al menos un interés', () => {
    expect(() => build({ intereses: [] })).toThrow(DomainError);
  });

  it('rechaza intereses fuera del vocabulario', () => {
    // @ts-expect-error valor inválido a propósito
    expect(() => build({ intereses: ['dinosaurios'] })).toThrow(DomainError);
  });

  it('no comparte la referencia del array de intereses', () => {
    const intereses = ['animales' as const];
    const p = build({ intereses });
    intereses.push('espacio');
    expect(p.intereses).toEqual(['animales']);
  });
});
