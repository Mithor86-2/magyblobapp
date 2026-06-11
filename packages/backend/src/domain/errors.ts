/**
 * Error de regla de negocio. Se lanza desde el dominio cuando una invariante
 * no se cumple (edad fuera de rango, consentimiento ausente, etc.). La capa de
 * infraestructura (Fase 3) lo traducirá a una respuesta HTTP adecuada.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
