/**
 * Error de frontera con el backend. Vive en `domain` (no en `infrastructure`)
 * para que la presentación pueda capturarlo con `instanceof` sin importar la capa
 * de infraestructura: el adaptador HTTP lo lanza, las pantallas lo reconocen.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly tipo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }
}
