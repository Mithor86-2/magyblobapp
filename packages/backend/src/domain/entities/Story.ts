import { DomainError } from '../errors.js';
import { esEstilo, esTema, type Estilo, type EstadoStory, type Tema } from '../vocabulary.js';
import type { CodigoIdioma } from '../value-objects/Idioma.js';

export interface StoryProps {
  id: string;
  profileId: string;
  tema: Tema;
  estilo: Estilo;
  titulo: string;
  cuerpo: string;
  idioma: CodigoIdioma;
  estado?: EstadoStory;
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
  estado: EstadoStory;
  readonly creadoEn: Date;

  constructor(props: StoryProps) {
    if (!esTema(props.tema)) throw new DomainError(`Tema inválido: "${props.tema}".`);
    if (!esEstilo(props.estilo)) throw new DomainError(`Estilo inválido: "${props.estilo}".`);
    if (props.titulo.trim() === '') throw new DomainError('El cuento necesita un título.');
    if (props.cuerpo.trim() === '') throw new DomainError('El cuento no puede estar vacío.');

    this.id = props.id;
    this.profileId = props.profileId;
    this.tema = props.tema;
    this.estilo = props.estilo;
    this.titulo = props.titulo;
    this.cuerpo = props.cuerpo;
    this.idioma = props.idioma;
    this.estado = props.estado ?? 'nuevo';
    this.creadoEn = props.creadoEn;
  }

  marcarLeido(): void {
    this.estado = 'leido';
  }
}
