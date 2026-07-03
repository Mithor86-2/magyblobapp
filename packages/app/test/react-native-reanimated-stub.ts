/**
 * Stub de `react-native-reanimated` para los tests (Vitest + jsdom).
 *
 * Reanimated (v4) arrastra worklets y binarios nativos que no cargan bajo el
 * adaptador web del runner. Como `BookPages` (US-79) lo usa para el page-curl, lo
 * aliasamos a este stub en `vitest.config.ts` (mismo patrón que `expo-haptics`). El
 * índice de página es estado de React, así que la navegación por ‹/› sigue siendo
 * verificable sin el hilo de UI real; aquí solo se evita que el import rompa: los
 * hooks devuelven valores inertes y `Animated.View` es la `View` de react-native-web.
 */
import { View } from 'react-native';

export const useSharedValue = <T>(valorInicial: T): { value: T } => ({ value: valorInicial });

export const useAnimatedStyle = (fn: () => object): object => {
  try {
    return fn() ?? {};
  } catch {
    return {};
  }
};

export const withSpring = <T>(valor: T): T => valor;
// `cancelAnimation` (limpieza al desmontar): no-op inerte bajo el runner.
export const cancelAnimation = (_sv?: unknown): void => {};
// Invoca el callback de fin de forma síncrona (como si la animación acabara al instante),
// para que el cambio de página (que ocurre en ese callback) siga siendo verificable en tests.
export const withTiming = <T>(
  valor: T,
  _config?: unknown,
  callback?: (finished: boolean) => void,
): T => {
  if (typeof callback === 'function') callback(true);
  return valor;
};
// `withRepeat` (US-86, rebote de cabecera): devuelve el valor de forma inerte (sin
// bucle real); la oscilación se verifica a mano/E2E. `Easing` expone las funciones que
// usamos como identidades para que las llamadas no rompan bajo el runner.
export const withRepeat = <T>(valor: T): T => valor;
// `withSequence` (US-90, animación por fases): devuelve el primer valor de forma inerte.
export const withSequence = <T>(...valores: T[]): T => valores[0] as T;
// `withDelay` (US-90, pausas entre fases): devuelve la animación sin esperar.
export const withDelay = <T>(_ms: number, valor: T): T => valor;
export const Easing = {
  quad: (t: number): number => t,
  ease: (t: number): number => t,
  linear: (t: number): number => t,
  inOut: (fn: (t: number) => number) => fn,
  in: (fn: (t: number) => number) => fn,
  out: (fn: (t: number) => number) => fn,
} as const;
export const runOnJS =
  <A extends unknown[]>(fn: (...args: A) => unknown) =>
  (...args: A) =>
    fn(...args);
export const interpolate = (): number => 0;
export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' } as const;

const Animated = { View };
export default Animated;
