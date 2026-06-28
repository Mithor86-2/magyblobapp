import type {
  Categoria,
  Parentesco,
  Tema,
  Estilo,
  EstadoStory,
  ProveedorIa,
} from '../domain/vocabulary.js';
import type { CodigoIdioma } from '../domain/value-objects/Idioma.js';

// --- RegisterGuardian ---
export interface RegisterGuardianInput {
  nombre: string;
  apellidos: string;
  email: string;
  parentesco: Parentesco;
  telefono?: string;
  /** Contraseña en claro (US-48): se hashea en el caso de uso, nunca se persiste. */
  password: string;
  /** El adulto debe aceptar para poder crear perfiles. */
  consentimientoAceptado: boolean;
  /** Versión de los términos/política aceptada. */
  consentimientoVersion: string;
}

export interface GuardianOutput {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  parentesco: Parentesco;
  consentimientoDado: boolean;
}

// --- LoginGuardian ---
export interface LoginGuardianInput {
  /** Identificador del adulto. Se normaliza (recorte + minúsculas) al buscar la cuenta. */
  email: string;
  /** Contraseña en claro (US-48): se verifica contra el `passwordHash` del Guardian. */
  password: string;
}

// --- CreateChildProfile ---
export interface CreateChildProfileInput {
  guardianId: string;
  nombre: string;
  edad: number;
  idioma?: string;
  avatar: string;
  intereses: string[];
}

export interface ChildProfileOutput {
  id: string;
  guardianId: string;
  nombre: string;
  edad: number;
  idioma: CodigoIdioma;
  avatar: string;
  intereses: Tema[];
}

// --- ListProfiles ---
export interface ListProfilesInput {
  guardianId: string;
}

// --- GenerateStory ---
export interface GenerateStoryRequest {
  profileId: string;
  /** Temas elegidos (multi-selección, US-47); el caso de uso valida vocabulario y no-vacío. */
  temas: string[];
  /** Estilos elegidos (multi-selección, US-47); el caso de uso valida vocabulario y no-vacío. */
  estilos: string[];
}

export interface StoryOutput {
  id: string;
  profileId: string;
  tema: Tema;
  estilo: Estilo;
  titulo: string;
  cuerpo: string;
  idioma: CodigoIdioma;
  estado: EstadoStory;
  proveedor: ProveedorIa;
  /** Portada generada (data URL, US-59); ausente si no se generó (la app usa respaldo). */
  portada?: string;
  /** Marcado como favorito por el tutor (US-63). */
  favorito: boolean;
  /** Fecha de generación en ISO 8601 (US-61); la app la muestra formateada. */
  creadoEn: string;
}

// --- GenerateStoryAnonymous (US-50, modo efímero sin sesión) ---
export interface GenerateStoryAnonymousRequest {
  /** Edad del niño (2-6). Solo se usa para acotar la generación; no se persiste. */
  edad: number;
  /** Idioma del cuento; por defecto el del dominio (`es`). */
  idioma?: string;
  /** Temas elegidos (multi-selección, US-47); el caso de uso valida vocabulario y no-vacío. */
  temas: string[];
  /** Estilos elegidos (multi-selección, US-47); el caso de uso valida vocabulario y no-vacío. */
  estilos: string[];
}

/** Cuento anónimo generado: contenido sin id, perfil ni estado (no se persiste). */
export interface AnonymousStoryOutput {
  tema: Tema;
  estilo: Estilo;
  titulo: string;
  cuerpo: string;
  idioma: CodigoIdioma;
  proveedor: ProveedorIa;
}

// --- NarrateStory ---
export interface NarrateStoryRequest {
  storyId: string;
}

export interface NarrationResult {
  /** MP3 de la narración (bytes); la ruta lo sirve como `audio/mpeg`. */
  mp3: Uint8Array;
  voiceId: string;
  /** Perfil dueño del cuento; la ruta lo usa para registrar el evento de uso. */
  profileId: string;
  /** `true` si se sintetizó ahora (cache-miss); `false` si vino de caché. */
  sintetizado: boolean;
}

// --- RecommendActivities ---
export interface RecommendActivitiesRequest {
  profileId: string;
  /** Si se indica, acota a una categoría; si no, libre. */
  categoria?: string;
  /** Cuántas actividades generar (por defecto 3). */
  cantidad?: number;
}

// --- RecommendActivitiesAnonymous (US-50, modo efímero sin sesión) ---
export interface RecommendActivitiesAnonymousRequest {
  /** Edad del niño (2-6). Solo acota la generación; no se persiste. */
  edad: number;
  /** Idioma de las actividades; por defecto el del dominio (`es`). */
  idioma?: string;
  /** Si se indica, acota a una categoría; si no, libre. */
  categoria?: string;
  /** Cuántas actividades generar (por defecto 3). */
  cantidad?: number;
}

/** Actividad anónima generada: contenido sin id ni perfil (no se persiste). */
export interface AnonymousActivityOutput {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  /** Paso a paso para realizar la actividad (US-54); opcional. */
  instrucciones?: string;
  duracionMin?: number;
  nivel?: number;
  proveedor: ProveedorIa;
}

export interface ActivityOutput {
  id: string;
  profileId: string;
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  /** Paso a paso para realizar la actividad (US-54); opcional. */
  instrucciones?: string;
  duracionMin?: number;
  nivel?: number;
  completadaEn?: string;
  valoracion?: number;
  proveedor: ProveedorIa;
  /** Imagen generada (data URL, US-59); ausente si no se generó (la app usa respaldo). */
  imagen?: string;
  /** Marcada como favorita por el tutor (US-63). */
  favorito: boolean;
  /** Fecha de generación en ISO 8601 (US-61); la app la muestra formateada. */
  creadoEn?: string;
}

// --- GetHistory ---
export interface GetHistoryRequest {
  profileId: string;
}

export interface HistoryOutput {
  stories: StoryOutput[];
  activities: ActivityOutput[];
}

// --- SaveProgress (partido en dos casos de uso cohesivos) ---
export interface MarkStoryReadRequest {
  storyId: string;
}

export interface CompleteActivityRequest {
  activityId: string;
  valoracion: number;
}

// --- Favoritos (US-63) ---
export interface SetStoryFavoriteRequest {
  storyId: string;
  favorito: boolean;
}

export interface SetActivityFavoriteRequest {
  activityId: string;
  favorito: boolean;
}
