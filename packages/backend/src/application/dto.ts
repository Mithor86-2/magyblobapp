import type { Parentesco, Tema, Estilo, EstadoStory } from '../domain/vocabulary.js';
import type { CodigoIdioma } from '../domain/value-objects/Idioma.js';

// --- RegisterGuardian ---
export interface RegisterGuardianInput {
  nombre: string;
  apellidos: string;
  email: string;
  parentesco: Parentesco;
  telefono?: string;
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
  tema: string;
  estilo: string;
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
