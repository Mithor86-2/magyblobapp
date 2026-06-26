import type { ReactNode } from 'react';
import * as Sentry from '@sentry/react-native';
import { ErrorFallback } from './ErrorFallback';

interface AppErrorBoundaryProps {
  children: ReactNode;
  /**
   * Etiqueta del origen del boundary (p. ej. `cuentos`). Se añade como tag
   * `boundary` en Sentry para localizar dónde ocurrió el fallo.
   */
  label?: string;
}

/**
 * Boundary de errores de render sobre `Sentry.ErrorBoundary` (US-41): captura el
 * error, lo reporta a Sentry (ya sin PII del niño vía `scrubEvent`) y muestra una
 * UI de respaldo propia en lugar de la pantalla en blanco. Colocado de forma
 * global (envolviendo la navegación) y por zona (pantallas de contenido) para que
 * un fallo aislado no tumbe toda la app.
 *
 * **Sin `showDialog`** (diálogo de _feedback_ de Sentry): rompe C-12 (UI/red de
 * tercero con PII) y la app usa su `DialogProvider` propio.
 *
 * Importa `@sentry/react-native` en runtime, así que (como `Icon`/`sentry.bootstrap`)
 * no carga bajo Vitest y queda fuera de la cobertura; su `ErrorFallback` —la parte
 * con lógica de UI— sí se prueba por separado.
 */
export function AppErrorBoundary({ children, label }: AppErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => <ErrorFallback onRetry={resetError} />}
      beforeCapture={(scope) => {
        if (label) scope.setTag('boundary', label);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
