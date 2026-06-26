import { describe, expect, it } from 'vitest';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import { DomainError } from '../../src/domain/errors.js';

describe('Edad', () => {
  it('acepta valores dentro del rango 2-6', () => {
    expect(Edad.create(2).value).toBe(2);
    expect(Edad.create(6).value).toBe(6);
  });

  it.each([1, 7, 0, -3, 4.5])('rechaza %s', (valor) => {
    expect(() => Edad.create(valor)).toThrow(DomainError);
  });
});

describe('Idioma', () => {
  it('acepta es y en', () => {
    expect(Idioma.create('es').value).toBe('es');
    expect(Idioma.create('en').value).toBe('en');
  });

  it('por defecto es es', () => {
    expect(Idioma.create().value).toBe('es');
  });

  it('rechaza idiomas no soportados', () => {
    expect(() => Idioma.create('fr')).toThrow(DomainError);
  });

  it('equals compara por valor', () => {
    expect(Idioma.create('es').equals(Idioma.create('es'))).toBe(true);
    expect(Idioma.create('es').equals(Idioma.create('en'))).toBe(false);
  });
});

describe('Edad.equals', () => {
  it('compara por valor', () => {
    expect(Edad.create(4).equals(Edad.create(4))).toBe(true);
    expect(Edad.create(4).equals(Edad.create(5))).toBe(false);
  });
});
