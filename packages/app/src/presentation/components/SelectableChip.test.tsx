// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SelectableChip } from './SelectableChip';

/**
 * Tests user-centric del chip seleccionable (US-30). Se localiza por su **rol**
 * (`button`) y su **texto**, y se comprueba que la pulsación llama a `onPress`.
 *
 * Nota: el estado "seleccionado" se transmite a la tecnología de asistencia con
 * `accessibilityState={{ selected }}` (lo anuncia el lector de pantalla en
 * iOS/Android). El adaptador web que usamos para renderizar en los tests no lo
 * proyecta a `aria-selected`, así que aquí verificamos que el chip sigue siendo
 * localizable por rol y nombre en ambos estados y que responde a la pulsación.
 */
describe('SelectableChip', () => {
  it('es localizable por su rol y texto, e invoca onPress al pulsar', () => {
    const onPress = vi.fn();
    render(<SelectableChip label="Animales" selected={false} onPress={onPress} />);

    fireEvent.click(screen.getByRole('button', { name: 'Animales' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sigue siendo accesible (rol + nombre) cuando está seleccionado', () => {
    const onPress = vi.fn();
    render(<SelectableChip label="Espacio" selected onPress={onPress} />);

    const chip = screen.getByRole('button', { name: 'Espacio' });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
