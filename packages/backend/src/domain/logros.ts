/**
 * Catálogo de **logros/recompensas** del niño (US-68) y su lógica pura de evaluación.
 * Vive en `/domain` sin dependencias externas: se calcula sobre las entidades que ya
 * se persisten (`Story`/`Activity`), sin IO. La persistencia (qué logro se desbloqueó
 * y cuándo) es responsabilidad de la capa de aplicación/infraestructura.
 *
 * Cuatro categorías (decisión del usuario): cuentos leídos, actividades completadas,
 * racha de días de uso y explorar temas (un logro por tema del vocabulario).
 */
import type { Activity } from './entities/Activity.js';
import type { Story } from './entities/Story.js';
import { TEMAS, type Tema } from './vocabulary.js';

/** Categoría de un logro: agrupa las medallas por tipo de hito. */
export type CategoriaLogro = 'cuentos' | 'actividades' | 'racha' | 'temas';

/**
 * Definición de un logro del catálogo. `clave` es su identificador estable (se
 * persiste); `meta` es el umbral a alcanzar; `tema` solo aplica a la categoría
 * `temas` (un logro por tema).
 */
export interface Logro {
  clave: string;
  categoria: CategoriaLogro;
  meta: number;
  tema?: Tema;
}

/** Umbrales (hitos) de cuentos leídos y actividades completadas. */
const HITOS_CUENTOS = [1, 5, 10, 25] as const;
const HITOS_ACTIVIDADES = [1, 5, 10, 25] as const;
/** Umbrales de la racha de días seguidos de uso. */
const HITOS_RACHA = [3, 7] as const;

/**
 * Catálogo completo de logros (US-68), en orden de presentación. El orden importa:
 * la app lo pinta tal cual (hitos crecientes, luego racha, luego temas).
 */
export const LOGROS: readonly Logro[] = [
  ...HITOS_CUENTOS.map(
    (meta): Logro => ({ clave: `cuentos_leidos_${meta}`, categoria: 'cuentos', meta }),
  ),
  ...HITOS_ACTIVIDADES.map(
    (meta): Logro => ({ clave: `actividades_completadas_${meta}`, categoria: 'actividades', meta }),
  ),
  ...HITOS_RACHA.map((meta): Logro => ({ clave: `racha_dias_${meta}`, categoria: 'racha', meta })),
  ...TEMAS.map((tema): Logro => ({ clave: `tema_${tema}`, categoria: 'temas', meta: 1, tema })),
];

/** Estadísticas del perfil sobre las que se evalúan los logros. */
export interface StatsLogros {
  /** Nº de cuentos en estado `leido`. */
  cuentosLeidos: number;
  /** Nº de actividades con `completadaEn`. */
  actividadesCompletadas: number;
  /** Racha máxima de días de calendario (UTC) seguidos con uso. */
  rachaDias: number;
  /** Temas de los que se ha leído al menos un cuento. */
  temasLeidos: ReadonlySet<Tema>;
}

/** Día de calendario (UTC, `AAAA-MM-DD`) de una fecha, para agrupar el uso por día. */
function diaUtc(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Racha máxima de días de calendario **consecutivos** con al menos un día de uso, a
 * partir de un conjunto de fechas. Un solo día cuenta como racha 1; días con hueco
 * reinician el conteo. Se toma la racha máxima alcanzada (una vez lograda, el logro
 * queda desbloqueado para siempre).
 */
export function rachaMaximaDias(fechas: readonly Date[]): number {
  const dias = [...new Set(fechas.map(diaUtc))].sort();
  if (dias.length === 0) return 0;
  const DIA_MS = 24 * 60 * 60 * 1000;
  let mejor = 1;
  let actual = 1;
  for (let i = 1; i < dias.length; i++) {
    const diff =
      Date.parse(`${dias[i]}T00:00:00.000Z`) - Date.parse(`${dias[i - 1]}T00:00:00.000Z`);
    actual = diff === DIA_MS ? actual + 1 : 1;
    if (actual > mejor) mejor = actual;
  }
  return mejor;
}

/**
 * Calcula las estadísticas de logros de un perfil a partir de sus cuentos y
 * actividades. Función pura (sin IO). La racha usa como días de uso las fechas de los
 * cuentos leídos (`creadoEn`, mejor señal disponible) y de las actividades completadas
 * (`completadaEn`).
 */
export function computeStatsLogros(
  stories: readonly Story[],
  activities: readonly Activity[],
): StatsLogros {
  const leidos = stories.filter((s) => s.estado === 'leido');
  const completadas = activities.filter((a) => a.completadaEn != null);
  const temasLeidos = new Set<Tema>(leidos.map((s) => s.tema));
  const fechasUso: Date[] = [
    ...leidos.map((s) => s.creadoEn),
    ...completadas.map((a) => a.completadaEn!),
  ];
  return {
    cuentosLeidos: leidos.length,
    actividadesCompletadas: completadas.length,
    rachaDias: rachaMaximaDias(fechasUso),
    temasLeidos,
  };
}

/** Progreso actual (0..meta) hacia un logro, para pintar la barra de avance. */
export function progresoLogro(logro: Logro, stats: StatsLogros): number {
  switch (logro.categoria) {
    case 'cuentos':
      return Math.min(stats.cuentosLeidos, logro.meta);
    case 'actividades':
      return Math.min(stats.actividadesCompletadas, logro.meta);
    case 'racha':
      return Math.min(stats.rachaDias, logro.meta);
    case 'temas':
      return logro.tema && stats.temasLeidos.has(logro.tema) ? 1 : 0;
  }
}

/** ¿Está conseguido el logro con las estadísticas dadas? */
export function logroConseguido(logro: Logro, stats: StatsLogros): boolean {
  return progresoLogro(logro, stats) >= logro.meta;
}

/** Claves de los logros conseguidos con las estadísticas dadas. */
export function evaluarLogros(stats: StatsLogros): string[] {
  return LOGROS.filter((logro) => logroConseguido(logro, stats)).map((logro) => logro.clave);
}
