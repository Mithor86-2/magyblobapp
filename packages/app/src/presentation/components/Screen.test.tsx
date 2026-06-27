// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { Screen } from './Screen';

/**
 * Test del lienzo base (US-30, US-58). Es chrome de layout; verificamos que muestra su
 * contenido y el `footer`, y la cabecera ilustrada opcional (US-58). `SafeAreaView`
 * (de react-native-safe-area-context, que requiere su propio provider) se sustituye por
 * un passthrough.
 */
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

describe('Screen', () => {
  it('renderiza el contenido y el footer', () => {
    render(
      <Screen footer={<Text>Acción principal</Text>}>
        <Text>Contenido de la pantalla</Text>
      </Screen>,
    );

    expect(screen.getByText('Contenido de la pantalla')).toBeVisible();
    expect(screen.getByText('Acción principal')).toBeVisible();
  });

  it('renderiza la imagen de cabecera cuando se pasa headerImageName (US-58)', () => {
    render(
      <Screen headerImageName="welcome">
        <Text>Contenido de la pantalla</Text>
      </Screen>,
    );

    // react-native-web traduce accessibilityRole="image" a role="img".
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Contenido de la pantalla')).toBeVisible();
  });

  it('no renderiza cabecera cuando no se pasa headerImageName (US-58)', () => {
    render(
      <Screen>
        <Text>Contenido de la pantalla</Text>
      </Screen>,
    );

    expect(screen.queryByRole('img')).toBeNull();
  });
});
