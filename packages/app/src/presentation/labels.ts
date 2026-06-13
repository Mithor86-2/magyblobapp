/**
 * Presentación con acentos de los vocabularios cerrados del dominio. El dominio
 * guarda identificadores ASCII (`musica`, `tutor_legal`); la UI los muestra
 * bonitos. Único sitio donde vive esta traducción id→etiqueta.
 */
import type {
  Categoria,
  CodigoIdioma,
  Estilo,
  Parentesco,
  ProveedorIa,
  Tema,
} from '../domain/types';

export const TEMA_LABEL: Record<Tema, string> = {
  animales: 'Animales',
  espacio: 'Espacio',
  magia: 'Magia',
  aventuras: 'Aventuras',
  musica: 'Música',
};

export const ESTILO_LABEL: Record<Estilo, string> = {
  aventura: 'Aventura',
  divertido: 'Divertido',
  educativo: 'Educativo',
};

export const PARENTESCO_LABEL: Record<Parentesco, string> = {
  madre: 'Madre',
  padre: 'Padre',
  tutor_legal: 'Tutor/a legal',
  abuelo_a: 'Abuelo/a',
  otro: 'Otro',
};

export const IDIOMA_LABEL: Record<CodigoIdioma, string> = {
  es: 'Español',
  en: 'English',
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  arte: 'Arte',
  musica: 'Música',
  logica: 'Lógica',
};

/** Etiqueta e icono del proveedor de IA que generó el contenido (Autor, US-25). */
export const PROVEEDOR_LABEL: Record<ProveedorIa, string> = {
  mock: 'Simulada',
  local: 'IA local',
  cloud: 'IA en la nube',
};

export const PROVEEDOR_ICONO: Record<ProveedorIa, string> = {
  mock: '🎭',
  local: '🖥️',
  cloud: '☁️',
};
