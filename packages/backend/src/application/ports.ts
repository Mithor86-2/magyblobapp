/**
 * Puertos transversales que los casos de uso reciben por inyección, para no
 * acoplarse a fuentes no deterministas. En tests se sustituyen por dobles
 * (ids secuenciales, reloj fijo); en producción (Fase 3) por crypto.randomUUID
 * y `() => new Date()`.
 */

/** Genera identificadores únicos (p. ej. UUID). */
export type IdGenerator = () => string;

/** Devuelve el instante actual. */
export type Clock = () => Date;
