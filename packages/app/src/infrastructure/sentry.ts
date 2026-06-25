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
 * - **`beforeSend` que redacta PII**: se elimina `user`, la `request`, el nombre del
 *   dispositivo y `server_name`, y se redactan correos en mensajes/excepciones.
 * - **Sin Session Replay / Feedback**: no se graba la sesión del niño (no se añade
 *   `mobileReplayIntegration` ni `feedbackIntegration`) y no se hace `setUser`.
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

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const REDACTED = '[redacted]';

function redactEmails(text: string): string {
  return text.replace(EMAIL_RE, REDACTED);
}

/**
 * `beforeSend`: minimiza el evento antes de salir a un tercero. Función pura y
 * testeable (US-35, nivel CORE: protege que no salga PII de un menor).
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  // Identificadores y datos de petición: fuera por completo.
  delete event.user;
  delete event.request;
  delete event.server_name;
  if (event.contexts?.device) {
    // El nombre del dispositivo suele incluir el nombre de la persona ("iPhone de …").
    delete event.contexts.device.name;
  }

  // Correos que se hayan colado en el mensaje o en las excepciones: redactados.
  if (event.message) event.message = redactEmails(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactEmails(exception.value);
  }
  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = redactEmails(crumb.message);
  }

  return event;
}

function isDev(): boolean {
  const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
  return typeof dev === 'boolean' ? dev : process.env.NODE_ENV !== 'production';
}

/** Opciones de `Sentry.init` (extraídas para poder testearlas sin inicializar). */
export function buildSentryOptions(dsn: string): ReactNativeOptions {
  return {
    dsn,
    environment: isDev() ? 'development' : 'production',
    // Solo errores y crashes: sin performance tracing ni Session Replay.
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  };
}
