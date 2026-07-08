import type { Estilo, Tema } from '../vocabulary.js';

/**
 * Catálogo de portadas de cuento (US-101). Resuelve el **nombre** de la imagen de
 * portada que aplica a un `tema`/`estilo` según la configuración ajustable en caliente
 * (`AppSetting` `story.covers`). Devuelve `null` si no hay ninguna configurada para esa
 * combinación; en ese caso la app cae a su respaldo local por tema.
 */
export interface StoryCoverCatalog {
  pick(tema: Tema, estilo: Estilo): Promise<string | null>;
}
