// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedAvatar } from './AnimatedAvatar';

/**
 * El avatar del niño se renderiza como **imagen** estática empaquetada (US-95; antes era un
 * emoji, US-90). `interactive` se conserva por compatibilidad pero ya no anima (crash de
 * reanimated 4 / New Arch — ver lecciones-aprendidas).
 */
describe('AnimatedAvatar', () => {
  it('renderiza la imagen con su etiqueta accesible', () => {
    render(<AnimatedAvatar source={{ uri: 'x' }} size={40} accessibilityLabel="zorro" />);
    expect(screen.getByLabelText('zorro')).toBeInTheDocument();
  });

  it('acepta interactive sin romper (sin efecto tras desactivar la animación)', () => {
    render(
      <AnimatedAvatar source={{ uri: 'x' }} size={40} accessibilityLabel="zorro" interactive />,
    );
    expect(screen.getByLabelText('zorro')).toBeInTheDocument();
    // Ya no hay estallido de estrellas.
    expect(screen.queryAllByText('⭐')).toHaveLength(0);
  });
});
