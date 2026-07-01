import type { ChildProfile } from '../entities/ChildProfile.js';
import type { Categoria, Ensenanza, Estilo, Parentesco, ProveedorIa, Tema } from '../vocabulary.js';

export interface GenerateStoryInput {
  perfil: ChildProfile;
  /** Temas elegidos (multi-selección, US-47); no vacío por contrato. */
  temas: Tema[];
  /** Estilos elegidos (multi-selección, US-47); no vacío por contrato. */
  estilos: Estilo[];
  /** Enseñanza/valor a transmitir (US-69); opcional, dirige la moraleja del cuento. */
  ensenanza?: Ensenanza;
}

/** Texto del cuento producido por la IA (el dominio le pone id, estado, etc.). */
export interface GeneratedStory {
  titulo: string;
  cuerpo: string;
  /** Proveedor que generó realmente el contenido (lo estampa el provider concreto). */
  proveedor: ProveedorIa;
  /**
   * Prompt realmente usado para generar el contenido (system + user), para
   * trazabilidad técnica (US-61). Lo estampa el provider concreto: Ollama/Cloud el
   * que enviaron, Mock uno representativo, Fallback el del proveedor que sirvió. Se
   * persiste solo en BD (no se expone en el DTO público).
   */
  prompt: string;
}

export interface RecommendActivitiesInput {
  perfil: ChildProfile;
  /** Si se indica, acota a una categoría; si no, libre. */
  categoria?: Categoria;
  cantidad: number;
  /**
   * Parentesco del adulto acompañante (el guardián con sesión, US-67). Las
   * instrucciones se dirigen a él por su trato ("mamá", "papá", "el abuelo o la
   * abuela"…) en vez de "el adulto". Ausente (p. ej. modo anónimo) → trato genérico.
   */
  parentesco?: Parentesco;
}

export interface GeneratedActivity {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  /** Paso a paso para realizar la actividad (US-54); opcional. */
  instrucciones?: string;
  duracionMin?: number;
  nivel?: number;
  /** Proveedor que generó realmente la actividad (lo estampa el provider concreto). */
  proveedor: ProveedorIa;
  /**
   * Prompt realmente usado para generar la actividad (system + user), para
   * trazabilidad técnica (US-61). Lo estampa el provider concreto. Todas las
   * actividades de una misma petición comparten el prompt del lote. Se persiste solo
   * en BD (no se expone en el DTO público).
   */
  prompt: string;
}

/**
 * Entrada para generar una portada ilustrada (US-59). Datos mínimos y **sin
 * nombre del niño ni identificadores** (cumplimiento C-5): solo tema/estilo/título,
 * con los que el adaptador (Gemini/Imagen) construye el prompt de imagen.
 */
export interface GenerateImageInput {
  /**
   * Sujeto representativo del contenido para orientar la ilustración: el `tema` del
   * cuento (`animales`, `espacio`…) o la `categoria` de la actividad (`arte`…). Es
   * material de prompt, no PII del niño; por eso `string` y no el vocabulario cerrado.
   */
  tema: string;
  /** Estilo/registro que orienta la ilustración (p. ej. `aventura`, `divertido`). */
  estilo: string;
  /** Título del cuento/actividad; orienta la ilustración (no es PII del niño). */
  titulo: string;
}

/**
 * Puerto de la capa de IA: una sola interfaz con varias implementaciones
 * intercambiables (mock | local | cloud), que se construyen en la Fase 2.
 * El cuento se genera en el idioma del perfil (`perfil.idioma`).
 */
export interface AIProvider {
  generateStory(input: GenerateStoryInput): Promise<GeneratedStory>;
  recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]>;
  /**
   * Genera una portada ilustrada (US-59) y la devuelve como **data URL**
   * (`data:image/png;base64,...`), o `null` si no hay generador disponible (sin
   * `GEMINI_API_KEY`) o la generación falla. Es **best-effort**: nunca lanza, para
   * no romper la creación del cuento/actividad; si devuelve `null`, la app usa el
   * respaldo local empaquetado. El prompt se construye sin el nombre del niño (C-5).
   */
  generateImage(input: GenerateImageInput): Promise<string | null>;
}
