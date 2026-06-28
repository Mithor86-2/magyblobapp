// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FavoriteButton } from './FavoriteButton';

/**
 * US-64: el botón estrella alterna el favorito de forma **optimista**. El icono
 * (lucide/SVG) se sustituye por un doble; se comprueba el nombre accesible (que
 * refleja el estado) y que el `onToggle` recibe el nuevo valor. Si la promesa falla,
 * el estado vuelve atrás.
 */
vi.mock('./Icon', () => ({ Icon: () => null }));

describe('FavoriteButton', () => {
  it('no favorito: pulsar marca como favorito y notifica true (optimista)', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(<FavoriteButton favorito={false} onToggle={onToggle} />);

    const btn = screen.getByRole('button', { name: 'Marcar como favorito' });
    fireEvent.click(btn);

    expect(onToggle).toHaveBeenCalledWith(true);
    // Estado optimista: el nombre accesible pasa a "quitar".
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Quitar de favoritos' })).toBeInTheDocument(),
    );
  });

  it('favorito: pulsar lo quita y notifica false', () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(<FavoriteButton favorito onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Quitar de favoritos' }));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('si onToggle falla, revierte el estado optimista', async () => {
    const onToggle = vi.fn().mockRejectedValue(new Error('boom'));
    render(<FavoriteButton favorito={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como favorito' }));
    // Tras el rechazo, vuelve a "no favorito".
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Marcar como favorito' })).toBeInTheDocument(),
    );
  });
});
