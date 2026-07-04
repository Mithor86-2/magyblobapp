import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { ParentalChallengeError } from './domain/errors.js';

/**
 * Puerta parental del alta (US-92, cumplimiento C-6), **sin terceros**.
 *
 * El servidor plantea un reto aritmético simple ("¿Cuánto es 7 + 5?") que un
 * adulto resuelve antes de crear la cuenta, subiendo el listón frente al alta
 * automatizada por bots. Es **stateless**: el reto no se guarda en BD. En su
 * lugar se emite un `challengeToken` firmado con HMAC-SHA256 usando el secreto
 * JWT (el mismo de la sesión) que codifica la **caducidad** y liga la firma a la
 * **respuesta esperada**, sin revelarla. Al registrarse, el cliente devuelve el
 * token y su respuesta; el servidor recomputa la firma con la respuesta recibida
 * y la compara en tiempo constante: si coincide y el token no ha caducado, la
 * puerta se supera. Nada sale de la máquina (cumple C-2, privacy-by-design).
 *
 * Limitación asumida: un reto aritmético no es un CAPTCHA fuerte (un bot avanzado
 * puede resolverlo); combinado con el rate limiting del alta, es una barrera
 * razonable para el alcance del proyecto. La verificación por email queda como
 * mejora futura documentada.
 */

/** Reto emitido al cliente: la pregunta legible y el token firmado a devolver. */
export interface RetoParental {
  /** Pregunta legible para el adulto (p. ej. "¿Cuánto es 7 + 5?"). */
  pregunta: string;
  /** Token firmado (`exp.firma`) que el cliente devuelve junto con su respuesta. */
  challengeToken: string;
}

/** Calcula la firma base64url de un reto para una respuesta y caducidad dadas. */
function firmar(secret: string, exp: number, respuesta: number): string {
  return createHmac('sha256', secret).update(`${exp}:${respuesta}`).digest('base64url');
}

/**
 * Crea un reto parental: elige dos sumandos al azar, calcula su caducidad
 * (`ahora + ttlMs`) y firma la respuesta esperada. Devuelve la pregunta y el
 * token `exp.firma` (la respuesta nunca viaja en claro dentro del token).
 */
export function crearRetoParental(secret: string, ttlMs: number): RetoParental {
  const a = randomInt(1, 10);
  const b = randomInt(1, 10);
  const exp = Date.now() + ttlMs;
  const firma = firmar(secret, exp, a + b);
  return { pregunta: `¿Cuánto es ${a} + ${b}?`, challengeToken: `${exp}.${firma}` };
}

/** Compara dos firmas base64url en tiempo constante (evita fuga por temporización). */
function firmasIguales(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Verifica un reto parental. Lanza `ParentalChallengeError` (400) si el token
 * está mal formado, ha caducado o la respuesta no es la esperada. No devuelve
 * nada cuando la puerta se supera.
 */
export function verificarRetoParental(
  secret: string,
  challengeToken: string,
  respuesta: number,
): void {
  const partes = challengeToken.split('.');
  const [expStr, firmaRecibida] = partes;
  if (partes.length !== 2 || expStr === undefined || firmaRecibida === undefined) {
    throw new ParentalChallengeError();
  }
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || exp <= 0) {
    throw new ParentalChallengeError();
  }
  if (Date.now() > exp) {
    throw new ParentalChallengeError('La verificación parental ha caducado. Solicita una nueva.');
  }
  if (!Number.isInteger(respuesta)) {
    throw new ParentalChallengeError();
  }
  const firmaEsperada = firmar(secret, exp, respuesta);
  if (!firmasIguales(firmaEsperada, firmaRecibida)) {
    throw new ParentalChallengeError();
  }
}
