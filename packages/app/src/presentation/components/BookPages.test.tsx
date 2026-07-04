// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
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
    // El texto va dentro de un contenedor centrado; la hoja blanca es su abuelo.
    const hoja = screen.getByText('Primera página').parentElement?.parentElement as HTMLElement;
    expect(hoja).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
  });

  it('#3: imprime el número de página en la hoja y cambia al pasar', () => {
    render(<BookPages paginas={PAGINAS} />);
    expect(screen.getByTestId('page-number')).toHaveTextContent('1');
    siguiente();
    expect(screen.getByTestId('page-number')).toHaveTextContent('2');
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

  it('#5: portada primero, historia en medio y fin con imagen al final', () => {
    render(
      <BookPages
        paginas={['Había una vez']}
        portada={<Text>Mi portada</Text>}
        finLabel="¡Fin de la historia!"
        finImagen={<Text>Imagen fin</Text>}
      />,
    );
    // Total = portada (1) + texto (1) + fin (1) = 3; empieza en la portada.
    expect(screen.getByText('Mi portada')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();

    siguiente();
    expect(screen.getByText('Había una vez')).toBeInTheDocument();

    siguiente();
    // La página de fin muestra la imagen de portada y el texto de fin.
    expect(screen.getByText('Imagen fin')).toBeInTheDocument();
    expect(screen.getByText('¡Fin de la historia!')).toBeInTheDocument();
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('US-27: llama onReachedEnd una sola vez al llegar a la última página', () => {
    const onReachedEnd = vi.fn();
    render(<BookPages paginas={PAGINAS} onReachedEnd={onReachedEnd} />);

    // En la primera página aún no se ha avisado.
    expect(onReachedEnd).not.toHaveBeenCalled();

    siguiente(); // página 2 de 3
    expect(onReachedEnd).not.toHaveBeenCalled();

    siguiente(); // página 3 de 3 (última) → avisa
    expect(onReachedEnd).toHaveBeenCalledTimes(1);

    // Volver atrás y avanzar de nuevo NO vuelve a avisar (una sola vez por lectura).
    anterior();
    siguiente();
    expect(onReachedEnd).toHaveBeenCalledTimes(1);
  });
});
