/**
 * Puerto de generación del código OTP de verificación (US-93). La implementación
 * concreta (aleatoriedad criptográfica) vive en infraestructura; en tests se
 * sustituye por un doble determinista para poder asertar el flujo sin adivinar el
 * código.
 */
export interface CodeGenerator {
  /** Genera un código OTP de 6 dígitos (con ceros a la izquierda si hace falta). */
  generar(): string;
}
