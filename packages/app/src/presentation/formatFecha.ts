/**
 * Formateo localizado de la fecha de generación (US-62). El backend envía
 * `creadoEn` en ISO 8601; aquí se convierte a una fecha legible en el idioma
 * activo del app (ES/EN). Vive en `presentation`: es una decisión de UI (depende
 * del idioma de la interfaz, no del dominio).
 *
 * Devuelve `null` cuando no hay fecha o es inválida, de modo que la UI
 * simplemente no muestra nada (sin error), tal como exige la historia.
 */
import type { AppLanguage } from '../i18n';

/** Mapa idioma del app → locale de `Intl`/`toLocaleDateString`. */
const LOCALES: Record<AppLanguage, string> = {
  es: 'es-ES',
  en: 'en-US',
};

/**
 * Formatea una fecha ISO al idioma del app (p. ej. "25 jun 2026" / "Jun 25, 2026").
 * Si `creadoEn` falta o no es una fecha válida, devuelve `null`.
 */
export function formatearFecha(creadoEn: string | undefined, idioma: AppLanguage): string | null {
  if (!creadoEn) return null;
  const fecha = new Date(creadoEn);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString(LOCALES[idioma], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
