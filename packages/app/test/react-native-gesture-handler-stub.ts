/**
 * Stub de `react-native-gesture-handler` para los tests (Vitest + jsdom).
 *
 * La librería es nativa y no resuelve bajo el runner. `BookPages` (US-79) usa
 * `Gesture.Pan()` + `GestureDetector` para el arrastre, y `App` usa
 * `GestureHandlerRootView`; los aliasamos a este stub en `vitest.config.ts`. El
 * detector y la raíz son passthrough (renderizan sus hijos) y el constructor de gestos
 * devuelve un objeto encadenable inerte: el gesto no se ejercita en jsdom (los ‹/› sí).
 */
import type { ReactNode } from 'react';

export const GestureDetector = ({ children }: { children: ReactNode }): ReactNode => children;
export const GestureHandlerRootView = ({ children }: { children: ReactNode }): ReactNode =>
  children;

/** Objeto de gesto encadenable e inerte: cada método devuelve el propio objeto. */
function gestoEncadenable(): Record<string, () => unknown> {
  const obj: Record<string, () => unknown> = {};
  const metodos = [
    'onBegin',
    'onStart',
    'onUpdate',
    'onChange',
    'onEnd',
    'onFinalize',
    'activeOffsetX',
    'activeOffsetY',
    'failOffsetX',
    'failOffsetY',
    'minDistance',
    'enabled',
    'runOnJS',
  ];
  for (const m of metodos) obj[m] = () => obj;
  return obj;
}

export const Gesture = {
  Pan: gestoEncadenable,
  Tap: gestoEncadenable,
  Fling: gestoEncadenable,
};
