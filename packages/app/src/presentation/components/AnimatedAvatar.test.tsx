// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedAvatar } from './AnimatedAvatar';

/**
 * El avatar del niño se renderiza como emoji estático. (US-90 introdujo un balanceo idle
 * + estallido de estrellas con reanimated; se desactivó por un crash nativo de reanimated 4 /
 * New Arch al procesar eventos táctiles con animaciones activas — ver lecciones-aprendidas.
 * `interactive` se conserva por compatibilidad pero ya no anima.)
 */
describe('AnimatedAvatar', () => {
  it('renderiza el emoji que recibe', () => {
    render(<AnimatedAvatar emoji="🦊" />);
    expect(screen.getByText('🦊')).toBeInTheDocument();
  });

  it('expone la etiqueta accesible', () => {
    render(<AnimatedAvatar emoji="🦊" accessibilityLabel="zorro" />);
    expect(screen.getByLabelText('zorro')).toBeInTheDocument();
  });

  it('acepta interactive sin romper (sin efecto tras desactivar la animación)', () => {
    render(<AnimatedAvatar emoji="🦊" accessibilityLabel="zorro" interactive />);
    expect(screen.getByText('🦊')).toBeInTheDocument();
    // Ya no hay estallido de estrellas.
    expect(screen.queryAllByText('⭐')).toHaveLength(0);
  });
});
