import { describe, expect, it } from 'vitest';
import { crearRetoParental, verificarRetoParental } from '../src/parentalChallenge.js';
import { ParentalChallengeError } from '../src/domain/errors.js';

/**
 * Puerta parental (US-92): reto aritmético firmado y stateless. Verifica el
 * camino feliz y los rechazos (respuesta incorrecta, token manipulado, mal
 * formado y caducado). No toca red ni BD.
 */
const SECRET = 'secreto-de-prueba';

/** Extrae la respuesta correcta ("a + b") de la pregunta del reto. */
function respuestaDe(pregunta: string): number {
  const m = /(\d{1,2}) \+ (\d{1,2})/.exec(pregunta);
  if (m === null) throw new Error(`Pregunta inesperada: ${pregunta}`);
  return Number(m[1]) + Number(m[2]);
}

describe('parentalChallenge (US-92)', () => {
  it('acepta la respuesta correcta a un reto recién emitido', () => {
    const reto = crearRetoParental(SECRET, 300_000);
    expect(reto.pregunta).toMatch(/¿Cuánto es \d{1,2} \+ \d{1,2}\?/);
    expect(() =>
      verificarRetoParental(SECRET, reto.challengeToken, respuestaDe(reto.pregunta)),
    ).not.toThrow();
  });

  it('rechaza una respuesta incorrecta', () => {
    const reto = crearRetoParental(SECRET, 300_000);
    expect(() =>
      verificarRetoParental(SECRET, reto.challengeToken, respuestaDe(reto.pregunta) + 1),
    ).toThrow(ParentalChallengeError);
  });

  it('rechaza un token firmado con otro secreto (manipulación)', () => {
    const reto = crearRetoParental('otro-secreto', 300_000);
    expect(() =>
      verificarRetoParental(SECRET, reto.challengeToken, respuestaDe(reto.pregunta)),
    ).toThrow(ParentalChallengeError);
  });

  it('rechaza un token mal formado', () => {
    expect(() => verificarRetoParental(SECRET, 'no-es-un-token', 5)).toThrow(
      ParentalChallengeError,
    );
    expect(() => verificarRetoParental(SECRET, 'abc.def', 5)).toThrow(ParentalChallengeError);
  });

  it('rechaza un reto caducado', () => {
    const reto = crearRetoParental(SECRET, -1000); // exp en el pasado
    expect(() =>
      verificarRetoParental(SECRET, reto.challengeToken, respuestaDe(reto.pregunta)),
    ).toThrow(ParentalChallengeError);
  });

  it('rechaza una respuesta no entera', () => {
    const reto = crearRetoParental(SECRET, 300_000);
    expect(() => verificarRetoParental(SECRET, reto.challengeToken, Number.NaN)).toThrow(
      ParentalChallengeError,
    );
  });
});
