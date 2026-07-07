import { useEffect, useState } from 'react';
import { getBaseUrl, warmUp } from '../../infrastructure/http';

/** Estado del warm-up del backend: despertando o ya listo (US-95). */
export type WarmupStatus = 'warming' | 'ready';

/**
 * Sigue el estado del warm-up del backend para hacerlo **visible** al arrancar la app
 * (US-95, cold-start de Render free: la instancia suspendida puede tardar ~50 s+ en
 * despertar). Empieza en `'warming'`, dispara el ping a `/health` con reintentos una
 * sola vez al montar (delegando en `warmUp` de la capa HTTP, best-effort) y pasa a
 * `'ready'` cuando el backend responde o cuando se agotan los reintentos, de modo que
 * el banner nunca quede pegado. No bloquea la interfaz: la app es navegable mientras
 * el servidor despierta.
 */
export function useServerWarmup(): WarmupStatus {
  const [status, setStatus] = useState<WarmupStatus>('warming');

  useEffect(() => {
    // Guarda contra un `setState` tras el desmontaje (el ping puede tardar más que la
    // vida del componente en un arranque muy corto).
    let activo = true;
    warmUp(getBaseUrl(), () => {
      if (activo) setStatus('ready');
    });
    return () => {
      activo = false;
    };
  }, []);

  return status;
}
