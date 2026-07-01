// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSlowHint } from './useSlowHint';

/**
 * US-53 (cold-start Render): `useSlowHint` avisa cuando una carga se alarga. Con
 * timers falsos comprobamos el umbral y el reinicio al terminar la carga.
 */
describe('useSlowHint', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('empieza en false y no marca lento antes del umbral', () => {
    const { result } = renderHook(() => useSlowHint(true, 6000));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(5999));
    expect(result.current).toBe(false);
  });

  it('marca lento al superar el umbral mientras sigue cargando', () => {
    const { result } = renderHook(() => useSlowHint(true, 6000));
    act(() => vi.advanceTimersByTime(6000));
    expect(result.current).toBe(true);
  });

  it('no marca lento si la carga termina antes del umbral', () => {
    const { result, rerender } = renderHook(({ loading }) => useSlowHint(loading, 6000), {
      initialProps: { loading: true },
    });
    act(() => vi.advanceTimersByTime(3000));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(6000));
    expect(result.current).toBe(false);
  });
});
