/**
 * Fuente única del **color por valor de vocabulario** (US-100): tema, estilo, enseñanza y
 * categoría de actividad. Es el equivalente en color de `chipIcons.ts` (que hace lo mismo para
 * los iconos): centraliza el color para que un mismo valor se pinte igual en toda la app
 * (chips, tarjetas, iconos). Como las claves son la unión de los cuatro vocabularios, **un
 * mismo texto comparte color** — p. ej. `musica` es tema y categoría, y "Música" se ve con el
 * mismo color en ambos sitios.
 *
 * Devuelve el color resuelto contra la paleta activa (claro/oscuro) del `ColorTokens`, así que
 * respeta el tema automáticamente.
 */
import type { Categoria, Ensenanza, Estilo, Tema } from '../domain/types';
import type { CategoryColor, ColorTokens } from './theme/tokens';

/** Cualquier valor de vocabulario con color propio. */
export type VocabValor = Tema | Estilo | Ensenanza | Categoria;

/**
 * Color de un valor de vocabulario en el tema activo: `{ color, on }` (base para
 * borde/icono/relleno y el color legible encima).
 */
export function vocabColor(colors: ColorTokens, valor: VocabValor): CategoryColor {
  return colors.category[valor];
}
