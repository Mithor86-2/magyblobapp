import { DomainError } from '../errors.js';

/**
 * Value-object Edad: entero entre 2 y 6 (público objetivo de la app). Inmutable;
 * se construye con `Edad.create`, que rechaza valores fuera de rango.
 */
export class Edad {
  static readonly MIN = 2;
  static readonly MAX = 6;

  private constructor(public readonly value: number) {}

  static create(value: number): Edad {
    if (!Number.isInteger(value) || value < Edad.MIN || value > Edad.MAX) {
      throw new DomainError(
        `Edad inválida: ${value}. Debe ser un entero entre ${Edad.MIN} y ${Edad.MAX}.`,
      );
    }
    return new Edad(value);
  }

  equals(other: Edad): boolean {
    return this.value === other.value;
  }
}
