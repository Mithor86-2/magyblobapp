// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { NavigationContext } from '@react-navigation/native';
import { useIsScreenActive } from './useIsScreenActive';

/**
 * `useIsScreenActive` sigue el foco de la pantalla para pausar animaciones en bucle al
 * cambiar de pestaña (evita el crash nativo por animar una vista desacoplada). Aquí se
 * verifica con un objeto de navegación falso; sin contexto devuelve `true` (no pausa).
 */
function crearNav(enfocado: boolean) {
  const listeners: Record<string, () => void> = {};
  return {
    nav: {
      isFocused: () => enfocado,
      addListener: (evento: string, cb: () => void) => {
        listeners[evento] = cb;
        return () => delete listeners[evento];
      },
    },
    emitir: (evento: string) => listeners[evento]?.(),
  };
}

describe('useIsScreenActive', () => {
  it('sin contexto de navegación devuelve true (no pausa; p. ej. tests aislados)', () => {
    const { result } = renderHook(() => useIsScreenActive());
    expect(result.current).toBe(true);
  });

  it('sigue el foco: false al desenfocar (blur) y true al enfocar (focus)', () => {
    const { nav, emitir } = crearNav(true);
    const wrapper = ({ children }: { children: ReactNode }) => (
      // El objeto de navegación falso solo implementa lo que el hook usa (isFocused/addListener).
      <NavigationContext.Provider value={nav as never}>{children}</NavigationContext.Provider>
    );
    const { result } = renderHook(() => useIsScreenActive(), { wrapper });

    expect(result.current).toBe(true);
    act(() => emitir('blur'));
    expect(result.current).toBe(false);
    act(() => emitir('focus'));
    expect(result.current).toBe(true);
  });
});
