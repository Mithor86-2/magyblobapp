import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  ConflictError,
  DomainError,
  InvalidCredentialsError,
  NotFoundError,
} from '../domain/errors.js';

/**
 * Manejo de errores centralizado: traduce los errores de dominio y de validación
 * a respuestas HTTP con un cuerpo uniforme `{ error: { tipo, mensaje } }`. Los
 * errores inesperados se registran (pino) y se devuelven como 500 sin filtrar detalles.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const status = statusDe(error);

    if (status >= 500) {
      request.log.error({ err: error }, 'Error no controlado');
    } else {
      request.log.info({ err: error.message }, 'Solicitud rechazada');
    }

    void reply.status(status).send({
      error: { tipo: error.name, mensaje: error.message },
    });
  });
}

function statusDe(error: FastifyError): number {
  if (error instanceof InvalidCredentialsError) return 401;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof DomainError) return 400;
  // Errores de validación de Fastify (schema) ya traen statusCode 400.
  if (typeof error.statusCode === 'number') return error.statusCode;
  return 500;
}
