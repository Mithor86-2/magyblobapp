import type { FastifyReply, FastifyRequest } from 'fastify';
import { TooManyRequestsError } from '../domain/errors.js';

/**
 * Rate-limit **en memoria** para las rutas anónimas (US-50). Sin dependencia
 * externa: un mapa proceso-local `clientKey -> { cuentos, actividades }` que
 * cuenta los usos gratuitos por cliente (IP) y rechaza con 429 al superar el
 * máximo. Es **efímero** (se pierde al reiniciar) y deliberadamente simple
 * (YAGNI): el objetivo es desincentivar el abuso del modo gratuito, no una
 * cuota robusta. La IP se usa solo en memoria; no se persiste (no es dato de
 * menor; ver C-14 en cumplimiento-menores.md).
 */

export type RecursoAnonimo = 'cuentos' | 'actividades';

export interface RateLimitOptions {
  /** Máximo de cuentos por cliente. */
  maxCuentos: number;
  /** Máximo de actividades por cliente. */
  maxActividades: number;
}

export const LIMITE_POR_DEFECTO: RateLimitOptions = { maxCuentos: 3, maxActividades: 3 };

interface ContadorCliente {
  cuentos: number;
  actividades: number;
}

/**
 * Crea un hook `onRequest` que consume una unidad del recurso indicado para el
 * cliente de la petición y lanza `TooManyRequestsError` (429) si ya agotó su
 * cupo. El estado vive en el closure: cada instancia mantiene su propio mapa, de
 * modo que los tests son aislados y el servidor comparte uno solo.
 */
export function createAnonymousRateLimit(options: RateLimitOptions = LIMITE_POR_DEFECTO) {
  const contadores = new Map<string, ContadorCliente>();

  function clientKey(request: FastifyRequest): string {
    return request.ip ?? 'desconocido';
  }

  return function limitar(recurso: RecursoAnonimo) {
    const max = recurso === 'cuentos' ? options.maxCuentos : options.maxActividades;

    // El hook solo cuenta cuando la petición pasa la validación de esquema (Fastify
    // ejecuta `onRequest` antes del parseo del cuerpo, pero tras el enrutado): un
    // cuerpo inválido (400) igualmente consume cupo, lo cual es aceptable para un
    // límite anti-abuso. Se mantiene simple.
    return async function hook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
      const key = clientKey(request);
      const actual = contadores.get(key) ?? { cuentos: 0, actividades: 0 };
      if (actual[recurso] >= max) {
        throw new TooManyRequestsError(
          `Has alcanzado el límite de ${max} ${recurso} de prueba. Crea una cuenta para seguir.`,
        );
      }
      actual[recurso] += 1;
      contadores.set(key, actual);
    };
  };
}
