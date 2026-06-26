import type { ChildProfile } from '../entities/ChildProfile.js';
import type { Categoria, Estilo, ProveedorIa, Tema } from '../vocabulary.js';

export interface GenerateStoryInput {
  perfil: ChildProfile;
  /** Temas elegidos (multi-selección, US-47); no vacío por contrato. */
  temas: Tema[];
  /** Estilos elegidos (multi-selección, US-47); no vacío por contrato. */
  estilos: Estilo[];
}

/** Texto del cuento producido por la IA (el dominio le pone id, estado, etc.). */
export interface GeneratedStory {
  titulo: string;
  cuerpo: string;
  /** Proveedor que generó realmente el contenido (lo estampa el provider concreto). */
  proveedor: ProveedorIa;
}

export interface RecommendActivitiesInput {
  perfil: ChildProfile;
  /** Si se indica, acota a una categoría; si no, libre. */
  categoria?: Categoria;
  cantidad: number;
}

export interface GeneratedActivity {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  duracionMin?: number;
  nivel?: number;
  /** Proveedor que generó realmente la actividad (lo estampa el provider concreto). */
  proveedor: ProveedorIa;
}

/**
 * Puerto de la capa de IA: una sola interfaz con tres implementaciones
 * intercambiables (mock | local), que se construyen en la Fase 2.
 * El cuento se genera en el idioma del perfil (`perfil.idioma`).
 */
export interface AIProvider {
  generateStory(input: GenerateStoryInput): Promise<GeneratedStory>;
  recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]>;
}
