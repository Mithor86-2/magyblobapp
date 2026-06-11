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

/** La entidad pedida no existe. La infraestructura la traduce a HTTP 404. */
export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Conflicto con el estado actual (p. ej. email ya registrado). HTTP 409. */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
