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

/** Acción sensible del adulto registrada en el AuditLog. */
export const ACCIONES_AUDIT = ['crear', 'editar', 'borrar', 'consentimiento', 'login'] as const;
export type AccionAudit = (typeof ACCIONES_AUDIT)[number];

/** Tipo de evento de uso de primera parte (InteractionEvent). */
export const TIPOS_EVENTO = ['pantalla_vista', 'cuento_generado', 'actividad_completada'] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

/** Proveedor de IA que generó realmente el contenido (el efectivo, incluido el fallback). */
export const PROVEEDORES_IA = ['mock', 'local', 'cloud'] as const;
export type ProveedorIa = (typeof PROVEEDORES_IA)[number];

export function esTema(value: string): value is Tema {
  return (TEMAS as readonly string[]).includes(value);
}

export function esEstilo(value: string): value is Estilo {
  return (ESTILOS as readonly string[]).includes(value);
}

export function esParentesco(value: string): value is Parentesco {
  return (PARENTESCOS as readonly string[]).includes(value);
}

export function esAccionAudit(value: string): value is AccionAudit {
  return (ACCIONES_AUDIT as readonly string[]).includes(value);
}

export function esProveedorIa(value: string): value is ProveedorIa {
  return (PROVEEDORES_IA as readonly string[]).includes(value);
}

export function esTipoEvento(value: string): value is TipoEvento {
  return (TIPOS_EVENTO as readonly string[]).includes(value);
}
