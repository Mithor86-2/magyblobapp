/**
 * Redacción de PII para la generación de portadas (US-59, cumplimiento C-5).
 *
 * El título de un cuento/actividad suele incluir el **nombre del niño** (el LLM lo
 * usa como protagonista). Antes de construir el prompt de imagen que sale a un
 * tercero (Gemini/Imagen) se quita ese nombre, de modo que solo viajan
 * tema/estilo/título sin datos del menor.
 */

/**
 * Quita las apariciones del nombre (case-insensitive, por palabra completa) de un
 * texto y normaliza los espacios sobrantes. Si `nombre` está vacío, devuelve el
 * texto sin cambios; si tras la redacción el texto queda vacío, devuelve `''` (el
 * constructor del prompt lo tolera y omite el título).
 */
export function redactarNombre(texto: string, nombre: string): string {
  const limpio = nombre.trim();
  if (limpio === '') return texto;
  const escapado = limpio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return texto
    .replace(new RegExp(`\\b${escapado}\\b`, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
