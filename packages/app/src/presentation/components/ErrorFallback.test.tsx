// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorFallback } from './ErrorFallback';

/**
 * Tests user-centric de la UI de respaldo del boundary (US-41). Es la parte con
 * lógica del `AppErrorBoundary` (el boundary en sí delega en `Sentry.ErrorBoundary`,
 * que no carga bajo Vitest). El icono se sustituye por un doble.
 */
vi.mock('./Icon', () => ({ Icon: () => null }));

describe('ErrorFallback', () => {
  it('muestra un mensaje amable, sin detalle técnico ni stack', () => {
    render(<ErrorFallback onRetry={vi.fn()} />);

    expect(screen.getByText('¡Vaya! Algo se ha despistado')).toBeInTheDocument();
    expect(screen.getByText('No pasa nada. Vamos a intentarlo otra vez.')).toBeInTheDocument();
  });

  it('ofrece un botón «Reintentar» que invoca onRetry', () => {
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
