// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StarRating } from './StarRating';

/**
 * Tests user-centric de la valoración en estrellas (US-30). El icono (lucide/SVG)
 * se sustituye por un doble. En modo valoración cada estrella es un botón con
 * nombre accesible (lo que anunciaría un lector de pantalla); en modo solo-lectura
 * no hay nada pulsable.
 */
vi.mock('./Icon', () => ({ Icon: () => null }));

describe('StarRating', () => {
  it('en modo valoración expone cada estrella como botón con nombre y notifica el valor', () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);

    expect(screen.getByRole('button', { name: '1 estrella' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2 estrellas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3 estrellas' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2 estrellas' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('en modo solo-lectura no ofrece nada que pulsar', () => {
    render(<StarRating value={2} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
