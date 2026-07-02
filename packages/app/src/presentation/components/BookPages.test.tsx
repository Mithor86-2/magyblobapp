// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BookPages } from './BookPages';

/**
 * A2/US-73, US-74: lector paginado como libro. Muestra una página a la vez, los
 * controles ‹/› pasan de página (deshabilitados en los extremos) y el indicador
 * refleja "Página n de total". La hoja se pinta en fondo blanco tipo papel (US-74).
 * Corre sobre react-native-web bajo jsdom (US-30).
 */
const PAGINAS = ['Primera página', 'Segunda página', 'Tercera página'];

// Los cambios de página los orquesta una animación con callback; se avanzan los timers.
function pasar(label: string) {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: label }));
  });
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

describe('BookPages (A2/US-73)', () => {
  it('renderiza la primera página y el indicador correcto', () => {
    render(<BookPages paginas={PAGINAS} />);
    expect(screen.getByText('Primera página')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('la hoja se pinta en fondo blanco tipo papel (US-74)', () => {
    render(<BookPages paginas={PAGINAS} />);
    // La hoja es el contenedor animado padre del texto de la página.
    const hoja = screen.getByText('Primera página').parentElement as HTMLElement;
    expect(hoja).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
  });

  it('› avanza a la siguiente página y ‹ vuelve', () => {
    vi.useFakeTimers();
    try {
      render(<BookPages paginas={PAGINAS} />);
      pasar('Página siguiente');
      expect(screen.getByText('Segunda página')).toBeInTheDocument();
      expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();

      pasar('Página anterior');
      expect(screen.getByText('Primera página')).toBeInTheDocument();
      expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('‹ está deshabilitado en la primera página', () => {
    render(<BookPages paginas={PAGINAS} />);
    const anterior = screen.getByRole('button', { name: 'Página anterior' });
    expect(anterior).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).not.toBeDisabled();
  });

  it('› está deshabilitado en la última página', () => {
    vi.useFakeTimers();
    try {
      render(<BookPages paginas={PAGINAS} />);
      pasar('Página siguiente');
      pasar('Página siguiente');
      expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Página anterior' })).not.toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('con una sola página no permite pasar en ningún sentido', () => {
    render(<BookPages paginas={['Única']} />);
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });
});
