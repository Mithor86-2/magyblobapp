/**
 * Monitorización de errores/crashes con Sentry (US-40).
 *
 * **Desviación de cumplimiento asumida (TFM).** Sentry es un SDK de terceros que
 * transmite informes de error a la nube (sentry.io); rompe C-2/C-5 de
 * `Docs/cumplimiento-menores.md` y es incompatible con Apple Kids. Mitigaciones
 * implementadas aquí:
 *
 * - **Init condicional al DSN**: sin `EXPO_PUBLIC_SENTRY_DSN` no se inicializa, así
 *   que el modo por defecto, el desarrollo y los E2E en `mock` **no** envían nada.
 * - **`sendDefaultPii: false`**: no se envían IP ni identificadores por defecto.
 * - **`beforeSend` que protege al NIÑO**: el dato sensible a proteger es la PII del
 *   menor. Se registra el nombre del perfil activo (`setActiveChildName`) y se
 *   **redacta** de mensajes, excepciones y breadcrumbs antes de salir, porque los
 *   cuentos se generan con el nombre del niño y puede colarse en un evento. Los
 *   datos del **adulto administrador** (p. ej. su email) **sí** pueden salir: es
 *   una decisión consciente (ver US-40 y C-12 de cumplimiento-menores).
 * - **Sin Session Replay / Feedback**: no se graba la sesión del niño (no se añade
 *   `mobileReplayIntegration` ni `feedbackIntegration`) y no se hace `setUser` del niño.
 * - **Sin performance tracing** (`tracesSampleRate: 0`): solo errores y crashes.
 */
// Solo tipos: `import type` se borra en runtime, así que este módulo NO carga
// `@sentry/react-native` (que arrastra react-native y no es importable bajo Vitest).
// La inicialización real vive en `sentry.bootstrap.ts`.
import type { ErrorEvent, ReactNativeOptions } from '@sentry/react-native';

/** DSN del proyecto Sentry; llega por env de Expo (`EXPO_PUBLIC_*`). */
export function getSentryDsn(): string | undefined {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  return dsn && dsn.trim() !== '' ? dsn : undefined;
}

/** Sentry solo se activa si hay DSN; sin DSN, comportamiento conforme (nada sale). */
export function isSentryEnabled(): boolean {
  return getSentryDsn() !== undefined;
}

const CHILD_REDACTED = '[child]';

// Nombre del niño del perfil activo. Lo mantiene el store (presentation) vía
// `setActiveChildName`; `scrubEvent` lo usa para redactarlo. Se guarda aquí
// (módulo de infraestructura) para no acoplar la lógica pura al store.
let activeChildName: string | undefined;

/**
 * Registra (o limpia) el nombre del niño del perfil activo para redactarlo de los
 * eventos antes de enviarlos. Llamar al elegir/cambiar/cerrar perfil. `undefined`
 * o cadena en blanco lo desactiva.
 */
export function setActiveChildName(nombre: string | undefined): void {
  activeChildName = nombre && nombre.trim() !== '' ? nombre.trim() : undefined;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Redacta el nombre del niño activo (sin distinguir mayúsculas) si está registrado. */
function redactChildName(text: string): string {
  if (!activeChildName) return text;
  return text.replace(new RegExp(escapeRegExp(activeChildName), 'gi'), CHILD_REDACTED);
}

/**
 * `beforeSend`: minimiza el evento antes de salir a un tercero. Función pura y
 * testeable (US-35, nivel CORE: protege que no salga PII de un menor).
 *
 * Política: proteger al NIÑO (su nombre nunca sale), permitir al ADULTO. Los
 * identificadores de bajo valor de diagnóstico (`user`, `request`, `server_name`,
 * nombre de dispositivo) se eliminan por minimización.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  // Identificadores y datos de petición de bajo valor: fuera por completo.
  delete event.user;
  delete event.request;
  delete event.server_name;
  if (event.contexts?.device) {
    // El nombre del dispositivo suele incluir el nombre de la persona ("iPhone de …").
    delete event.contexts.device.name;
  }

  // El nombre del niño no debe salir nunca: redactado donde pueda aparecer
  // (incluido el texto de un cuento que se haya colado en el evento).
  if (event.message) event.message = redactChildName(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactChildName(exception.value);
  }
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = redactChildName(crumb.message);
  }

  return event;
}

function isDev(): boolean {
  const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
  return typeof dev === 'boolean' ? dev : process.env.NODE_ENV !== 'production';
}

/**
 * Opciones de `Sentry.init` (extraídas para poder testearlas sin inicializar).
 * `release` (versión del app) lo aporta el bootstrap desde `expo-constants`, para
 * mantener este módulo libre de dependencias de runtime.
 */
export function buildSentryOptions(dsn: string, release?: string): ReactNativeOptions {
  return {
    dsn,
    environment: isDev() ? 'development' : 'production',
    // Versión del app: agrupa los errores por release en el dashboard.
    release,
    // Logs de Sentry en consola solo en desarrollo (verificar el setup).
    debug: isDev(),
    // Solo errores y crashes: sin performance tracing ni Session Replay.
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  };
}
