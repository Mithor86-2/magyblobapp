import { useEffect, useState } from 'react';

/** Umbral por defecto (ms) tras el cual una carga se considera "lenta". */
export const SLOW_HINT_THRESHOLD_MS = 6000;

/**
 * Devuelve `true` cuando una carga (`loading`) sigue activa tras `umbralMs`, para
 * mostrar un aviso de "esto está tardando más de lo usual" (US-53, cold-start de
 * Render free: el backend suspendido puede tardar ~50 s+ en despertar). Se reinicia
 * a `false` en cuanto `loading` pasa a falso o cambia el umbral.
 */
export function useSlowHint(loading: boolean, umbralMs: number = SLOW_HINT_THRESHOLD_MS): boolean {
  const [lento, setLento] = useState(false);

  useEffect(() => {
    if (!loading) {
      setLento(false);
      return;
    }
    const timer = setTimeout(() => setLento(true), umbralMs);
    return () => clearTimeout(timer);
  }, [loading, umbralMs]);

  return lento;
}
