import { DomainError } from '../errors.js';
import {
  esEstilo,
  esProveedorIa,
  esTema,
  type Estilo,
  type EstadoStory,
  type ProveedorIa,
  type Tema,
} from '../vocabulary.js';
import type { CodigoIdioma } from '../value-objects/Idioma.js';

export interface StoryProps {
  id: string;
  profileId: string;
  tema: Tema;
  estilo: Estilo;
  titulo: string;
  cuerpo: string;
  idioma: CodigoIdioma;
  /** Proveedor de IA que generó realmente el cuento (mock | local | cloud). */
  proveedor: ProveedorIa;
  /**
   * Portada ilustrada (US-59): data URL de la imagen generada con Gemini/Imagen, o
   * `undefined` si no se generó (sin clave o fallo); la app cae al respaldo local.
   */
  portada?: string;
  /**
   * Prompt (system + user) usado para generar el cuento (US-61). Trazabilidad
   * técnica: se persiste en BD pero **no** se expone en el DTO público. Nullable
   * (filas antiguas o modo anónimo no lo tienen).
   */
  prompt?: string;
  estado?: EstadoStory;
  /** Marcado como favorito por el tutor (US-63); por defecto `false`. */
  favorito?: boolean;
  creadoEn: Date;
}

/**
 * Cuento generado para un perfil. Se crea en estado `nuevo`; al abrirlo pasa a
 * `leido` (el progreso de lectura se modela como estado, sin entidad aparte).
 */
export class Story {
  readonly id: string;
  readonly profileId: string;
  readonly tema: Tema;
  readonly estilo: Estilo;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly idioma: CodigoIdioma;
  readonly proveedor: ProveedorIa;
  readonly portada?: string;
  readonly prompt?: string;
  estado: EstadoStory;
  favorito: boolean;
  readonly creadoEn: Date;

  constructor(props: StoryProps) {
    if (!esTema(props.tema)) throw new DomainError(`Tema inválido: "${props.tema}".`);
    if (!esEstilo(props.estilo)) throw new DomainError(`Estilo inválido: "${props.estilo}".`);
    if (props.titulo.trim() === '') throw new DomainError('El cuento necesita un título.');
    if (props.cuerpo.trim() === '') throw new DomainError('El cuento no puede estar vacío.');
    if (!esProveedorIa(props.proveedor))
      throw new DomainError(`Proveedor de IA inválido: "${props.proveedor}".`);

    this.id = props.id;
    this.profileId = props.profileId;
    this.tema = props.tema;
    this.estilo = props.estilo;
    this.titulo = props.titulo;
    this.cuerpo = props.cuerpo;
    this.idioma = props.idioma;
    this.proveedor = props.proveedor;
    this.portada = props.portada;
    this.prompt = props.prompt;
    this.estado = props.estado ?? 'nuevo';
    this.favorito = props.favorito ?? false;
    this.creadoEn = props.creadoEn;
  }

  marcarLeido(): void {
    this.estado = 'leido';
  }

  /** Marca o desmarca el cuento como favorito (US-63). Idempotente. */
  marcarFavorito(valor: boolean): void {
    this.favorito = valor;
  }
}
