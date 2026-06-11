/**
 * Tipos del contrato HTTP del backend. Espejo intencional de los DTO de
 * `packages/backend/src/application/dto.ts`: la app y el servidor se comunican
 * por la frontera de cable (JSON), así que el cliente declara su propia copia en
 * lugar de acoplarse al código del backend.
 *
 * Los vocabularios son cerrados (ver `packages/backend/src/domain/vocabulary.ts`):
 * valores ASCII en minúscula; la presentación con acentos es cosa de la UI.
 */

export const TEMAS = ['animales', 'espacio', 'magia', 'aventuras', 'musica'] as const;
export type Tema = (typeof TEMAS)[number];

export const ESTILOS = ['aventura', 'divertido', 'educativo'] as const;
export type Estilo = (typeof ESTILOS)[number];

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

export interface GuardianOutput {
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

export interface ChildProfileOutput {
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

export interface StoryOutput {
  id: string;
  profileId: string;
  tema: Tema;
  estilo: Estilo;
  titulo: string;
  cuerpo: string;
  idioma: CodigoIdioma;
  estado: EstadoStory;
}

/** Cuerpo de error uniforme del backend (errorHandler centralizado). */
export interface ApiErrorBody {
  error: { tipo: string; mensaje: string };
}
