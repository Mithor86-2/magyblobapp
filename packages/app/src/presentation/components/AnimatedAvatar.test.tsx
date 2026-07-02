// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedAvatar } from './AnimatedAvatar';

/**
 * US-90 (ajuste #2): el avatar del niño se mueve suave en bucle. La animación (reanimated)
 * está aliasada a un stub inerte bajo Vitest; aquí solo verificamos que el componente sigue
 * renderizando el emoji (el movimiento se comprueba a mano/E2E en dispositivo).
 */
describe('AnimatedAvatar (US-90)', () => {
  it('renderiza el emoji que recibe', () => {
    render(<AnimatedAvatar emoji="🦊" />);
    expect(screen.getByText('🦊')).toBeInTheDocument();
  });
});
