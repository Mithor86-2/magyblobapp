// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TextField } from './TextField';

/**
 * Tests user-centric del campo de texto (US-30). Lo localizamos por su **rol**
 * (`textbox`) y comprobamos que su **etiqueta** visible se muestra y que escribir
 * en él propaga el texto vía `onChangeText`, tal como haría una persona usuaria
 * rellenando el formulario de la zona de adultos.
 */
describe('TextField', () => {
  it('muestra la etiqueta y el campo es localizable por su rol', () => {
    render(<TextField label="Correo electrónico" value="" onChangeText={vi.fn()} />);

    expect(screen.getByText('Correo electrónico')).toBeVisible();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('refleja el valor actual y notifica los cambios al escribir', () => {
    const onChangeText = vi.fn();
    render(<TextField label="Nombre" value="Ana" onChangeText={onChangeText} />);

    const campo = screen.getByRole('textbox');
    expect(campo).toHaveValue('Ana');

    fireEvent.change(campo, { target: { value: 'Ana María' } });
    expect(onChangeText).toHaveBeenCalledWith('Ana María');
  });

  it('muestra el placeholder como pista para la persona usuaria', () => {
    render(
      <TextField
        label="Correo electrónico"
        value=""
        placeholder="tu@correo.com"
        onChangeText={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument();
  });
});
