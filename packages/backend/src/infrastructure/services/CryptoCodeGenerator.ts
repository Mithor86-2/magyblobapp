import { randomInt } from 'node:crypto';
import type { CodeGenerator } from '../../domain/services/CodeGenerator.js';

/**
 * Genera el código OTP con aleatoriedad criptográfica (`crypto.randomInt`, US-93):
 * un entero uniforme en `[0, 1_000_000)` formateado a 6 dígitos con ceros a la
 * izquierda. `randomInt` no tiene sesgo de módulo, a diferencia de `Math.random`.
 */
export class CryptoCodeGenerator implements CodeGenerator {
  generar(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }
}
