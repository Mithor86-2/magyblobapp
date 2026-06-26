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

/**
 * Credenciales de inicio de sesión inválidas (US-48). HTTP 401. El mensaje es
 * **deliberadamente genérico** y NO distingue entre email inexistente y
 * contraseña errónea, para no revelar qué emails están registrados.
 */
export class InvalidCredentialsError extends DomainError {
  constructor(message = 'Email o contraseña incorrectos.') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}
