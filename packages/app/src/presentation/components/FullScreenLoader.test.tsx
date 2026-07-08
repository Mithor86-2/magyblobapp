// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FullScreenLoader } from './FullScreenLoader';

/**
 * Loader a pantalla completa (US-102): muestra el mensaje y el indicador cuando `visible`,
 * y no renderiza nada cuando está oculto.
 */
describe('FullScreenLoader', () => {
  it('muestra el mensaje cuando visible', () => {
    render(<FullScreenLoader visible message="Creando un cuento mágico…" />);
    expect(screen.getByText('Creando un cuento mágico…')).toBeVisible();
  });

  it('no muestra nada cuando no es visible', () => {
    render(<FullScreenLoader visible={false} message="Creando un cuento mágico…" />);
    expect(screen.queryByText('Creando un cuento mágico…')).not.toBeInTheDocument();
  });
});
