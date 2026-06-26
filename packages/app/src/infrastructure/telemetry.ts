/**
 * Telemetría del recorrido del usuario con breadcrumbs de Sentry (US-42).
 *
 * Reconstruye los pasos previos a un error (navegación → acciones → llamadas API)
 * para reproducir bugs. Categorías: `navigation` (cambios de pantalla), `api`
 * (llamadas al backend) y `ui` (acciones de negocio). Niveles `info`/`error`.
 *
 * **Cumplimiento de menores (C-12).** Este módulo NO transporta PII: los wrappers
 * aceptan solo enums/ids/contadores, nunca el nombre del niño ni texto libre (el
 * prompt o el cuerpo de un cuento). Como red de seguridad, `beforeBreadcrumb`
 * (`scrubBreadcrumb` en `sentry.ts`) redacta el nombre del niño de message/data.
 *
 * Igual que `sentry.ts`, este módulo usa solo `import type` de
 * `@sentry/react-native` para no cargar react-native bajo Vitest: el efecto real
 * (`Sentry.addBreadcrumb`) entra por un **sink inyectado** desde el bootstrap. Sin
 * Sentry activo (sin DSN) el sink no se cablea y los wrappers son no-op.
 */
import type { Breadcrumb } from '@sentry/react-native';

/** Valor seguro para `data` de un breadcrumb: nunca PII, solo enums/ids/contadores. */
type SafeValue = string | number | boolean | undefined;
type SafeData = Record<string, SafeValue>;

type BreadcrumbSink = (breadcrumb: Breadcrumb) => void;

let sink: BreadcrumbSink | undefined;

/**
 * Cablea (o desactiva) el destino real de los breadcrumbs. Lo llama el bootstrap
 * con `Sentry.addBreadcrumb` solo cuando Sentry está activo; sin él, no-op.
 */
export function setBreadcrumbSink(fn: BreadcrumbSink | undefined): void {
  sink = fn;
}

function emit(breadcrumb: Breadcrumb): void {
  sink?.(breadcrumb);
}

/** Breadcrumb de navegación: cambio de pantalla (nombre de ruta, sin parámetros). */
export function trackNavigation(routeName: string): void {
  emit({ category: 'navigation', level: 'info', message: routeName });
}

export interface ApiBreadcrumb {
  method: string;
  path: string;
  /** Código HTTP; ausente en fallo de red. */
  status?: number;
  ok: boolean;
}

/** Breadcrumb de una llamada API: método, ruta y resultado (sin cuerpo ni PII). */
export function trackApi({ method, path, status, ok }: ApiBreadcrumb): void {
  emit({
    category: 'api',
    level: ok ? 'info' : 'error',
    message: `${method} ${path}`,
    data: status === undefined ? { ok } : { status, ok },
  });
}

/** Breadcrumb de una acción de negocio del usuario (solo enums/ids/contadores). */
export function trackAction(name: string, data?: SafeData): void {
  emit({ category: 'ui', level: 'info', message: name, data });
}
