// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BouncingHeaderImage } from './BouncingHeaderImage';

/**
 * US-86 (ajuste #4): la cabecera rebota en loop. La animación (reanimated) está
 * aliasada a un stub inerte bajo Vitest; aquí solo verificamos que el componente
 * sigue renderizando la imagen con su rol de accesibilidad y su etiqueta (la
 * oscilación real se comprueba a mano/E2E en dispositivo).
 */
describe('BouncingHeaderImage (US-86)', () => {
  it('renderiza la imagen con rol image y su accessibilityLabel', () => {
    render(<BouncingHeaderImage source={{ uri: 'x' }} accessibilityLabel="Cabecera" />);
    // react-native-web traduce accessibilityRole="image" a role="img" (con
    // resizeMode="contain" pinta un contenedor + <img>, ambos con el nombre accesible).
    expect(screen.getAllByRole('img', { name: 'Cabecera' }).length).toBeGreaterThan(0);
  });
});
