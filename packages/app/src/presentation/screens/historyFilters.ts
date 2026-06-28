/**
 * Lógica pura de filtrado del Historial en cliente (US-62). Vive aparte de la
 * pantalla para poder probarla sin renderizar React Native: filtra las listas ya
 * cargadas por tema/estilo (cuentos) y categoría (actividades). El valor especial
 * `TODOS` significa "sin filtro" (la opción por defecto de los chips).
 */
import type { Activity, Categoria, Estilo, Story, Tema } from '../../domain/types';

/** Opción por defecto de los chips: no filtra (muestra todo). */
export const TODOS = 'todos' as const;

export type FiltroTema = Tema | typeof TODOS;
export type FiltroEstilo = Estilo | typeof TODOS;
export type FiltroCategoria = Categoria | typeof TODOS;

/** Filtra los cuentos por tema y estilo; `TODOS` en cualquiera no restringe. */
export function filtrarCuentos(stories: Story[], tema: FiltroTema, estilo: FiltroEstilo): Story[] {
  return stories.filter(
    (s) => (tema === TODOS || s.tema === tema) && (estilo === TODOS || s.estilo === estilo),
  );
}

/** Filtra las actividades por categoría; `TODOS` no restringe. */
export function filtrarActividades(activities: Activity[], categoria: FiltroCategoria): Activity[] {
  return activities.filter((a) => categoria === TODOS || a.categoria === categoria);
}
