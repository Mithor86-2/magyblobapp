// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { cancelAnimation } from 'react-native-reanimated';
import { AnimatedAvatar } from './AnimatedAvatar';

// Espía `cancelAnimation` conservando el resto del stub de reanimated, para verificar
// que las animaciones se cancelan al desmontar (regresión del crash nativo al navegar).
vi.mock('react-native-reanimated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native-reanimated')>();
  return { ...actual, cancelAnimation: vi.fn() };
});

/**
 * US-90 (ajuste #2): el avatar del niño se mueve por fases en bucle y, al tocarlo (modo
 * interactivo), lanza un estallido de estrellas. La animación (reanimated) está aliasada a
 * un stub inerte bajo Vitest; aquí verificamos el render del emoji y que el toque muestra
 * las estrellas (el movimiento/estallido reales se comprueban a mano/E2E en dispositivo).
 */
describe('AnimatedAvatar (US-90)', () => {
  it('renderiza el emoji que recibe', () => {
    render(<AnimatedAvatar emoji="🦊" />);
    expect(screen.getByText('🦊')).toBeInTheDocument();
  });

  it('no es pulsable por defecto (sin estrellas hasta tocar)', () => {
    render(<AnimatedAvatar emoji="🦊" />);
    expect(screen.queryAllByText('⭐')).toHaveLength(0);
  });

  it('interactivo: al tocarlo lanza un estallido de estrellas', () => {
    render(<AnimatedAvatar emoji="🦊" accessibilityLabel="zorro" interactive />);
    expect(screen.queryAllByText('⭐')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'zorro' }));
    expect(screen.getAllByText('⭐').length).toBeGreaterThan(0);
  });

  it('cancela las animaciones al desmontar (evita crash nativo al navegar)', () => {
    const { unmount } = render(<AnimatedAvatar emoji="🦊" />);
    expect(() => unmount()).not.toThrow();
    expect(cancelAnimation).toHaveBeenCalled();
  });

  it('cancela también el estallido de estrellas al desmontar tras tocar', () => {
    vi.mocked(cancelAnimation).mockClear();
    const { unmount } = render(
      <AnimatedAvatar emoji="🦊" accessibilityLabel="zorro" interactive />,
    );
    // Toca para montar las estrellas (cada una con su animación en vuelo).
    fireEvent.click(screen.getByRole('button', { name: 'zorro' }));
    expect(screen.getAllByText('⭐').length).toBeGreaterThan(0);
    // Al desmontar (navegar fuera de Inicio) se cancelan las animaciones de las estrellas
    // además de las del propio avatar; sin ello el estallido en vuelo crashea en nativo.
    const antes = vi.mocked(cancelAnimation).mock.calls.length;
    expect(() => unmount()).not.toThrow();
    // Avatar (progreso + escala) + una cancelación por estrella (8) ⇒ > 2 llamadas nuevas.
    expect(vi.mocked(cancelAnimation).mock.calls.length - antes).toBeGreaterThan(2);
  });
});
