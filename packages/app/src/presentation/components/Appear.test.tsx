// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { Appear } from './Appear';

/**
 * A5: la animación de entrada no debe ocultar el contenido: `Appear` renderiza a sus
 * hijos y estos quedan visibles desde el primer frame (anima translateY/scale, no la
 * opacidad).
 */
describe('Appear', () => {
  it('renderiza a sus hijos y los deja visibles', () => {
    render(
      <Appear>
        <Text>Contenido animado</Text>
      </Appear>,
    );
    expect(screen.getByText('Contenido animado')).toBeVisible();
  });
});
