// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

// El icono (lucide/SVG) no es transformable bajo jsdom.
vi.mock('./Icon', () => ({ Icon: () => null }));

import { AdultsButton } from './AdultsButton';

/** A6: botón fijo de acceso a la zona de adultos; dispara su `onPress`. */
describe('AdultsButton', () => {
  it('invoca onPress al pulsarlo y expone su etiqueta accesible', () => {
    const onPress = vi.fn();
    render(<AdultsButton onPress={onPress} />);
    const boton = screen.getByRole('button', { name: 'Zona de personas adultas' });
    fireEvent.click(boton);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
