/**
 * Presentación con acentos de los vocabularios cerrados del dominio. El dominio
 * guarda identificadores ASCII (`musica`, `tutor_legal`); la UI los muestra
 * bonitos. Tras la i18n (US-57) la traducción id→etiqueta vive en los
 * diccionarios `es`/`en` (clave `vocab.*`); estas funciones resuelven la etiqueta
 * en el idioma activo del app. Los componentes que las usan se suscriben a los
 * cambios de idioma vía `useTranslation`, así re-renderizan al cambiar de idioma.
 */
import i18n from '../i18n';
import type {
  Categoria,
  CodigoIdioma,
  Ensenanza,
  Estilo,
  Parentesco,
  ProveedorIa,
  Tema,
} from '../domain/types';

export const temaLabel = (tema: Tema): string => i18n.t(`vocab.tema.${tema}`);

export const estiloLabel = (estilo: Estilo): string => i18n.t(`vocab.estilo.${estilo}`);

/** Etiqueta legible de la enseñanza/valor del cuento (US-69). */
export const ensenanzaLabel = (ensenanza: Ensenanza): string =>
  i18n.t(`vocab.ensenanza.${ensenanza}`);

export const parentescoLabel = (parentesco: Parentesco): string =>
  i18n.t(`vocab.parentesco.${parentesco}`);

export const idiomaLabel = (idioma: CodigoIdioma): string => i18n.t(`vocab.idioma.${idioma}`);

export const categoriaLabel = (categoria: Categoria): string =>
  i18n.t(`vocab.categoria.${categoria}`);

/**
 * Etiqueta del proveedor de IA que generó el contenido (Autor, US-25). El icono
 * por proveedor lo resuelve el wrapper `Icon` (`prov-mock|prov-local|prov-cloud`).
 */
export const proveedorLabel = (proveedor: ProveedorIa): string =>
  i18n.t(`vocab.proveedor.${proveedor}`);
