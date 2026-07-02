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
export const withTiming = <T>(valor: T): T => valor;
export const runOnJS =
  <A extends unknown[]>(fn: (...args: A) => unknown) =>
  (...args: A) =>
    fn(...args);
export const interpolate = (): number => 0;
export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' } as const;

const Animated = { View };
export default Animated;
