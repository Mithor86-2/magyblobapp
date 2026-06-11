import { DomainError } from '../errors.js';

export const IDIOMAS = ['es', 'en'] as const;
export type CodigoIdioma = (typeof IDIOMAS)[number];

/**
 * Value-object Idioma: dominio cerrado {es, en}. Bilingüe ES/EN, por defecto `es`.
 * "Español (Latinoamérica)" es solo rótulo de UI; el valor persistido es `es`.
 */
export class Idioma {
  static readonly DEFECTO: CodigoIdioma = 'es';

  private constructor(public readonly value: CodigoIdioma) {}

  static create(value: string = Idioma.DEFECTO): Idioma {
    if (!(IDIOMAS as readonly string[]).includes(value)) {
      throw new DomainError(
        `Idioma no soportado: "${value}". Valores válidos: ${IDIOMAS.join(', ')}.`,
      );
    }
    return new Idioma(value as CodigoIdioma);
  }

  equals(other: Idioma): boolean {
    return this.value === other.value;
  }
}
