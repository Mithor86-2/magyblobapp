// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cancelAnimation } from 'react-native-reanimated';
import { BouncingHeaderImage } from './BouncingHeaderImage';

// Espía `cancelAnimation` conservando el resto del stub de reanimated, para verificar
// que la animación en bucle se cancela al desmontar (regresión del crash nativo).
vi.mock('react-native-reanimated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native-reanimated')>();
  return { ...actual, cancelAnimation: vi.fn() };
});

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

  it('cancela la animación en bucle al desmontar (evita crash nativo al navegar)', () => {
    const { unmount } = render(
      <BouncingHeaderImage source={{ uri: 'x' }} accessibilityLabel="Cabecera" />,
    );
    expect(() => unmount()).not.toThrow();
    expect(cancelAnimation).toHaveBeenCalled();
  });
});
