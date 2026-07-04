import { createContext } from 'react';

/**
 * Stub de `@react-navigation/native` para Vitest. El paquete real arrastra código
 * (Flow/ESM) que no parsea bajo jsdom; aquí solo exponemos lo que los componentes
 * importan a nivel de módulo. Sin provider de navegación en los tests, `useContext`
 * devuelve `undefined` y `useIsScreenActive` cae a "activo" (no pausa animaciones).
 * Los tests que ejercitan el foco (p. ej. HomeScreen) siguen mockeando el módulo aparte.
 */
export const NavigationContext = createContext<unknown>(undefined);

/** No-op: en los tests no ejercitamos el ciclo de foco de navegación. */
export function useFocusEffect(): void {}

/** Por defecto, "enfocado" en tests. */
export function useIsFocused(): boolean {
  return true;
}

/** Objeto de navegación mínimo para tests que lo consulten sin mockear. */
export function useNavigation(): Record<string, unknown> {
  return {};
}
