import { DomainError } from '../errors.js';
import { CATEGORIAS, esProveedorIa, type Categoria, type ProveedorIa } from '../vocabulary.js';

export interface ActivityProps {
  id: string;
  profileId: string;
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  /** Paso a paso para realizar la actividad (US-54); opcional (el LLM puede omitirlo). */
  instrucciones?: string;
  duracionMin?: number;
  nivel?: number;
  /** Proveedor de IA que generó realmente la actividad (mock | local | cloud). */
  proveedor: ProveedorIa;
  /**
   * Imagen ilustrada (US-59): data URL generada con Gemini/Imagen, o `undefined` si
   * no se generó (sin clave o fallo); la app cae al respaldo local.
   */
  imagen?: string;
  /**
   * Prompt (system + user) usado para generar la actividad (US-61). Trazabilidad
   * técnica: se persiste en BD pero **no** se expone en el DTO público. Nullable
   * (filas antiguas o modo anónimo no lo tienen).
   */
  prompt?: string;
  completadaEn?: Date;
  valoracion?: number;
  /** Marcada como favorita por el tutor (US-63); por defecto `false`. */
  favorito?: boolean;
  /** Fecha de generación (US-61). La pone el caso de uso / la lee el repositorio. */
  creadoEn?: Date;
}

/**
 * Actividad generada por IA para un perfil. La realización se modela como estado
 * (`completadaEn` + `valoracion` en estrellas), sin entidad de progreso aparte.
 */
export class Activity {
  readonly id: string;
  readonly profileId: string;
  readonly categoria: Categoria;
  readonly titulo: string;
  readonly descripcion: string;
  readonly instrucciones?: string;
  readonly duracionMin?: number;
  readonly nivel?: number;
  readonly proveedor: ProveedorIa;
  readonly imagen?: string;
  readonly prompt?: string;
  completadaEn?: Date;
  valoracion?: number;
  favorito: boolean;
  readonly creadoEn?: Date;

  constructor(props: ActivityProps) {
    if (!(CATEGORIAS as readonly string[]).includes(props.categoria)) {
      throw new DomainError(`Categoría inválida: "${props.categoria}".`);
    }
    if (props.titulo.trim() === '') throw new DomainError('La actividad necesita un título.');
    if (props.descripcion.trim() === '')
      throw new DomainError('La actividad necesita una descripción.');
    if (!esProveedorIa(props.proveedor))
      throw new DomainError(`Proveedor de IA inválido: "${props.proveedor}".`);

    this.id = props.id;
    this.profileId = props.profileId;
    this.categoria = props.categoria;
    this.titulo = props.titulo;
    this.descripcion = props.descripcion;
    this.instrucciones = props.instrucciones;
    this.duracionMin = props.duracionMin;
    this.nivel = props.nivel;
    this.proveedor = props.proveedor;
    this.imagen = props.imagen;
    this.prompt = props.prompt;
    this.completadaEn = props.completadaEn;
    this.valoracion = props.valoracion;
    this.favorito = props.favorito ?? false;
    this.creadoEn = props.creadoEn;
  }

  /** Marca la actividad como completada con una valoración de 1 a 3 estrellas. */
  completar(valoracion: number, cuando: Date): void {
    if (!Number.isInteger(valoracion) || valoracion < 1 || valoracion > 3) {
      throw new DomainError(`Valoración inválida: ${valoracion}. Debe ser 1, 2 o 3.`);
    }
    this.valoracion = valoracion;
    this.completadaEn = cuando;
  }

  /** Marca o desmarca la actividad como favorita (US-63). Idempotente. */
  marcarFavorito(valor: boolean): void {
    this.favorito = valor;
  }
}
