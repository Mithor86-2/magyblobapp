// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

// `Icon` usa lucide-react-native (no carga bajo Vitest); lo sustituimos por un doble que
// expone el nombre del icono para poder verificar que el chip lo renderiza (US-89).
vi.mock('./Icon', () => ({
  Icon: ({ name }: { name: string }) => name,
}));

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

  it('#1: renderiza el icono indicado delante de la etiqueta', () => {
    render(
      <SelectableChip
        label="Animales"
        selected
        onPress={vi.fn()}
        icon="tema-animales"
        color="tertiary"
      />,
    );
    // El doble de Icon expone el nombre; el chip sigue localizándose por su etiqueta.
    expect(screen.getByRole('button', { name: /Animales/ })).toBeInTheDocument();
    expect(screen.getByText('tema-animales')).toBeInTheDocument();
  });

  it('#1: el chip seleccionado se pinta con el color de su categoría', () => {
    render(<SelectableChip label="Amistad" selected onPress={vi.fn()} color="quaternary" />);
    // lightColors.quaternary = #8a5300 → rgb(138, 83, 0).
    expect(screen.getByRole('button', { name: /Amistad/ })).toHaveStyle({
      backgroundColor: 'rgb(138, 83, 0)',
    });
  });

  it('US-100: con `tint`, el chip seleccionado usa el color por valor (prioridad sobre la familia)', () => {
    render(
      <SelectableChip
        label="Animales"
        selected
        onPress={vi.fn()}
        color="quaternary"
        tint={{ color: '#3f8a5c', on: '#ffffff' }}
      />,
    );
    // El `tint` (#3f8a5c → rgb(63, 138, 92)) gana a la familia `quaternary`.
    expect(screen.getByRole('button', { name: /Animales/ })).toHaveStyle({
      backgroundColor: 'rgb(63, 138, 92)',
    });
  });
});
