// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BouncingHeaderImage } from './BouncingHeaderImage';

/**
 * La cabecera se renderiza como imagen estática con su rol y etiqueta accesibles. (US-86
 * introdujo un rebote en bucle con reanimated; se desactivó por un crash nativo de
 * reanimated 4 / New Arch al procesar eventos táctiles con animaciones en bucle activas —
 * ver Docs/lecciones-aprendidas.md.)
 */
describe('BouncingHeaderImage', () => {
  it('renderiza la imagen con rol image y su accessibilityLabel', () => {
    render(<BouncingHeaderImage source={{ uri: 'x' }} accessibilityLabel="Cabecera" />);
    // react-native-web traduce accessibilityRole="image" a role="img".
    expect(screen.getAllByRole('img', { name: 'Cabecera' }).length).toBeGreaterThan(0);
  });
});
