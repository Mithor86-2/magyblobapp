// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useServerWarmup } from './useServerWarmup';

/**
 * US-95 (warm-up visible): `useServerWarmup` empieza en `'warming'` y pasa a
 * `'ready'` tanto si `/health` responde OK como si el ping falla y se agotan los
 * reintentos (para que el banner nunca quede pegado). Se mockea `fetch` global, que
 * es lo que usa `warmUp` de la capa HTTP por debajo.
 */
function okResponse(): Response {
  return { ok: true, status: 200, json: async () => ({ status: 'ok' }) } as unknown as Response;
}

describe('useServerWarmup', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('empieza en warming y pasa a ready cuando /health responde OK', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse()));

    const { result } = renderHook(() => useServerWarmup());

    expect(result.current).toBe('warming');
    await waitFor(() => expect(result.current).toBe('ready'));
  });

  it('llega a ready aunque el ping falle y se agoten los reintentos', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('backend caído')));

    const { result } = renderHook(() => useServerWarmup());

    expect(result.current).toBe('warming');
    // Deja correr los 3 pings con su backoff (500 + 1000 + 2000 ms) hasta agotarlos.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500 + 1000 + 2000 + 50);
    });
    expect(result.current).toBe('ready');
  });
});
