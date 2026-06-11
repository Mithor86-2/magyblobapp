/**
 * Vocabularios cerrados del dominio (ver Docs/modelo-datos.md). Los valores son
 * identificadores ASCII en minúscula; la presentación con acentos (p. ej. "música")
 * es responsabilidad de la UI, no del dominio.
 */

/** Temática única compartida por los intereses del perfil y el tema del cuento. */
export const TEMAS = ['animales', 'espacio', 'magia', 'aventuras', 'musica'] as const;
export type Tema = (typeof TEMAS)[number];

/** Estilo narrativo del cuento. */
export const ESTILOS = ['aventura', 'divertido', 'educativo'] as const;
export type Estilo = (typeof ESTILOS)[number];

/** Categoría de una actividad. */
export const CATEGORIAS = ['arte', 'musica', 'logica'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Parentesco del adulto responsable respecto al niño. */
export const PARENTESCOS = ['madre', 'padre', 'tutor_legal', 'abuelo_a', 'otro'] as const;
export type Parentesco = (typeof PARENTESCOS)[number];

/** Estado de lectura de un cuento. */
export const ESTADOS_STORY = ['nuevo', 'leido'] as const;
export type EstadoStory = (typeof ESTADOS_STORY)[number];

export function esTema(value: string): value is Tema {
  return (TEMAS as readonly string[]).includes(value);
}

export function esEstilo(value: string): value is Estilo {
  return (ESTILOS as readonly string[]).includes(value);
}

export function esParentesco(value: string): value is Parentesco {
  return (PARENTESCOS as readonly string[]).includes(value);
}
