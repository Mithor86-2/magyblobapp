// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { BookPages } from './BookPages';

/**
 * US-83 (#1/#5): lector paginado como libro con page-curl real
 * (`react-native-page-flipper`, aliasado a un stub bajo Vitest que refleja el índice).
 * Muestra una página a la vez; los controles ‹/› pasan de página (deshabilitados en los
 * extremos) y el indicador refleja "Página n de total". La hoja se pinta en blanco tipo
 * papel. Corre sobre react-native-web bajo jsdom (US-30).
 */
const PAGINAS = ['Primera página', 'Segunda página', 'Tercera página'];

const siguiente = () => fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
const anterior = () => fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));

describe('BookPages (US-83)', () => {
  it('renderiza la primera página y el indicador correcto', () => {
    render(<BookPages paginas={PAGINAS} />);
    expect(screen.getByText('Primera página')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('la hoja se pinta en fondo blanco tipo papel', () => {
    render(<BookPages paginas={PAGINAS} />);
    const hoja = screen.getByText('Primera página').parentElement as HTMLElement;
    expect(hoja).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
  });

  it('› avanza a la siguiente página y ‹ vuelve', () => {
    render(<BookPages paginas={PAGINAS} />);
    siguiente();
    expect(screen.getByText('Segunda página')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();

    anterior();
    expect(screen.getByText('Primera página')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('‹ está deshabilitado en la primera página', () => {
    render(<BookPages paginas={PAGINAS} />);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).not.toBeDisabled();
  });

  it('› está deshabilitado en la última página', () => {
    render(<BookPages paginas={PAGINAS} />);
    siguiente();
    siguiente();
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página anterior' })).not.toBeDisabled();
  });

  it('con una sola página no permite pasar en ningún sentido', () => {
    render(<BookPages paginas={['Única']} />);
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('#5: portada primero, historia en medio y "FIN" al final', () => {
    render(
      <BookPages paginas={['Había una vez']} portada={<Text>Mi portada</Text>} finLabel="FIN" />,
    );
    // Total = portada (1) + texto (1) + FIN (1) = 3; empieza en la portada.
    expect(screen.getByText('Mi portada')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();

    siguiente();
    expect(screen.getByText('Había una vez')).toBeInTheDocument();

    siguiente();
    expect(screen.getByText('FIN')).toBeInTheDocument();
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });
});
