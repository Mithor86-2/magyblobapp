// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pressable, Text } from 'react-native';
import type { ComponentProps, ReactNode } from 'react';
import i18n, { cambiarIdiomaApp } from '../../i18n';

/**
 * Test de i18n a nivel de pantalla (US-57): `WelcomeScreen` renderiza el texto
 * **traducido** según el idioma activo. `Screen` (safe-area-context) y
 * `BubblyButton` (icono lucide, no carga bajo Vitest) se sustituyen por dobles;
 * el foco es el texto que produce `t(...)`. Se restaura `es` al final.
 */
vi.mock('../components/Screen', () => ({
  Screen: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../components/BubblyButton', () => ({
  BubblyButton: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Text>{label}</Text>
    </Pressable>
  ),
}));

import { WelcomeScreen } from './WelcomeScreen';

const props = {
  navigation: { navigate: vi.fn() },
} as unknown as ComponentProps<typeof WelcomeScreen>;

afterEach(() => {
  void i18n.changeLanguage('es');
});

describe('WelcomeScreen — i18n (US-57)', () => {
  it('renderiza el texto en español por defecto', () => {
    cambiarIdiomaApp('es');
    render(<WelcomeScreen {...props} />);

    expect(screen.getByText('Aprendizaje Mágico')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ya tengo cuenta' })).toBeVisible();
  });

  it('renderiza el texto en inglés cuando el idioma activo es en', () => {
    cambiarIdiomaApp('en');
    render(<WelcomeScreen {...props} />);

    expect(screen.getByText('Magical Learning')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'I already have an account' })).toBeVisible();
  });
});
