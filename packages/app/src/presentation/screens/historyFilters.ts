/**
 * Lógica pura de filtrado del Historial en cliente (US-62, ampliada en US-64). Vive
 * aparte de la pantalla para poder probarla sin renderizar React Native: filtra las
 * listas ya cargadas por tema/estilo (cuentos) y categoría (actividades), por
 * **favorito** y por una **búsqueda de texto** normalizada. El valor especial
 * `TODOS` significa "sin filtro" (la opción por defecto de los chips).
 */
import type { Activity, Categoria, Ensenanza, Estilo, Story, Tema } from '../../domain/types';

/** Opción por defecto de los chips: no filtra (muestra todo). */
export const TODOS = 'todos' as const;

export type FiltroTema = Tema | typeof TODOS;
export type FiltroEstilo = Estilo | typeof TODOS;
export type FiltroCategoria = Categoria | typeof TODOS;
export type FiltroEnsenanza = Ensenanza | typeof TODOS;

/**
 * Normaliza un texto para comparar por subcadena sin distinguir mayúsculas ni
 * acentos: minúsculas + descomposición Unicode (NFD) quitando las marcas diacríticas
 * (p. ej. "Águila" → "aguila"). Base común de la búsqueda (US-64).
 */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Cierto si `texto` contiene `consulta` (ambos normalizados); consulta vacía ⇒ siempre cierto. */
function coincide(texto: string, consulta: string): boolean {
  return consulta === '' || normalizar(texto).includes(consulta);
}

/**
 * Filtra los cuentos por tema, estilo, favorito, búsqueda de texto y enseñanza
 * (US-69). `TODOS` en tema/estilo/enseñanza no restringe; `soloFavoritos` deja solo
 * los marcados; la `busqueda` (normalizada) compara contra título, cuerpo, tema y
 * estilo. Combina todos a la vez. La `ensenanza` va al final para no cambiar el orden
 * de los parámetros ya existentes (US-62/US-64).
 */
export function filtrarCuentos(
  stories: Story[],
  tema: FiltroTema,
  estilo: FiltroEstilo,
  soloFavoritos = false,
  busqueda = '',
  ensenanza: FiltroEnsenanza = TODOS,
): Story[] {
  const q = normalizar(busqueda.trim());
  return stories.filter(
    (s) =>
      (tema === TODOS || s.tema === tema) &&
      (estilo === TODOS || s.estilo === estilo) &&
      (ensenanza === TODOS || s.ensenanza === ensenanza) &&
      (!soloFavoritos || s.favorito === true) &&
      (q === '' ||
        coincide(s.titulo, q) ||
        coincide(s.cuerpo, q) ||
        coincide(s.tema, q) ||
        coincide(s.estilo, q)),
  );
}

/**
 * Filtra las actividades por categoría, favorito y búsqueda de texto. `TODOS` no
 * restringe; `soloFavoritos` deja solo las marcadas; la `busqueda` (normalizada)
 * compara contra título, descripción, instrucciones y categoría. Combina todos a la vez.
 */
export function filtrarActividades(
  activities: Activity[],
  categoria: FiltroCategoria,
  soloFavoritos = false,
  busqueda = '',
): Activity[] {
  const q = normalizar(busqueda.trim());
  return activities.filter(
    (a) =>
      (categoria === TODOS || a.categoria === categoria) &&
      (!soloFavoritos || a.favorito === true) &&
      (q === '' ||
        coincide(a.titulo, q) ||
        coincide(a.descripcion, q) ||
        coincide(a.instrucciones ?? '', q) ||
        coincide(a.categoria, q)),
  );
}
