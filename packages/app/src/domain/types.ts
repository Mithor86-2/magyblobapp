/**
 * Modelos y vocabularios del dominio del app. Espejo del contrato de cable del
 * backend (`packages/backend/src/application/dto.ts`): cliente y servidor se
 * comunican por la frontera JSON, así que el app declara su propia copia en lugar
 * de acoplarse al código del backend.
 *
 * Capa `domain`: sin dependencias de framework (ni React, ni fetch, ni Expo).
 *
 * Los vocabularios son cerrados (ver `packages/backend/src/domain/vocabulary.ts`):
 * valores ASCII en minúscula; la presentación con acentos es cosa de la UI.
 */

export const TEMAS = ['animales', 'espacio', 'magia', 'aventuras', 'musica'] as const;
export type Tema = (typeof TEMAS)[number];

export const ESTILOS = ['aventura', 'divertido', 'educativo'] as const;
export type Estilo = (typeof ESTILOS)[number];

export const CATEGORIAS = ['arte', 'musica', 'logica'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const PARENTESCOS = ['madre', 'padre', 'tutor_legal', 'abuelo_a', 'otro'] as const;
export type Parentesco = (typeof PARENTESCOS)[number];

export const IDIOMAS = ['es', 'en'] as const;
export type CodigoIdioma = (typeof IDIOMAS)[number];

export type EstadoStory = 'nuevo' | 'leido';

// --- Guardian (adulto responsable) ---
export interface RegisterGuardianInput {
  nombre: string;
  apellidos: string;
  email: string;
  parentesco: Parentesco;
  telefono?: string;
  consentimientoAceptado: boolean;
  consentimientoVersion: string;
}

export interface Guardian {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  parentesco: Parentesco;
  consentimientoDado: boolean;
}

// --- ChildProfile ---
export interface CreateChildProfileInput {
  guardianId: string;
  nombre: string;
  edad: number;
  idioma?: CodigoIdioma;
  avatar: string;
  intereses: Tema[];
}

export interface ChildProfile {
  id: string;
  guardianId: string;
  nombre: string;
  edad: number;
  idioma: CodigoIdioma;
  avatar: string;
  intereses: Tema[];
}

// --- Story ---
export interface GenerateStoryRequest {
  profileId: string;
  tema: Tema;
  estilo: Estilo;
}

export interface Story {
  id: string;
  profileId: string;
  tema: Tema;
  estilo: Estilo;
  titulo: string;
  cuerpo: string;
  idioma: CodigoIdioma;
  estado: EstadoStory;
}

// --- Activity ---
export interface RecommendActivitiesRequest {
  profileId: string;
  categoria?: Categoria;
  cantidad?: number;
}

export interface Activity {
  id: string;
  profileId: string;
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  duracionMin?: number;
  nivel?: number;
  completadaEn?: string;
  valoracion?: number;
}

// --- Historial ---
export interface History {
  stories: Story[];
  activities: Activity[];
}
