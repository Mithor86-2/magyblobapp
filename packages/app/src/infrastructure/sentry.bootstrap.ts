/**
 * Arranque de Sentry (US-40). Aislado de `sentry.ts` porque importa
 * `@sentry/react-native` en runtime (arrastra react-native, no importable bajo
 * Vitest). La lógica pura y testeable —gating por DSN y `beforeSend`— vive en
 * `sentry.ts`; aquí solo se hace el efecto: `Sentry.init`. Nivel INFRASTRUCTURE
 * (bootstrap), excluido de la medición de cobertura como `composition.ts`.
 */
import * as Sentry from '@sentry/react-native';
import { buildSentryOptions, getSentryDsn } from './sentry';

/**
 * Inicializa Sentry **solo si hay DSN**. Llamar lo antes posible (entrada de la app).
 * Sin DSN no hace nada: el arranque por defecto sigue siendo conforme (US-06).
 */
export function initSentry(): void {
  const dsn = getSentryDsn();
  if (!dsn) return;
  Sentry.init(buildSentryOptions(dsn));
}
