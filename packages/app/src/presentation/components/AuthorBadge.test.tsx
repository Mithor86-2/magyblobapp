// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthorBadge } from './AuthorBadge';

/**
 * Tests user-centric del badge "Autor" (US-25/US-30). Es presentacional: muestra
 * la etiqueta del proveedor que generó el contenido y expone un nombre accesible.
 * El icono (lucide/SVG) se sustituye por un doble.
 */
vi.mock('./Icon', () => ({ Icon: () => null }));

describe('AuthorBadge', () => {
  it('muestra el autor con la etiqueta legible del proveedor', () => {
    render(<AuthorBadge proveedor="local" />);

    expect(screen.getByText('Autor: IA local')).toBeVisible();
  });

  it('expone un nombre accesible con el proveedor', () => {
    render(<AuthorBadge proveedor="cloud" />);

    expect(screen.getByLabelText('Autor: IA en la nube')).toBeInTheDocument();
  });
});
