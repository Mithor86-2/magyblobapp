// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Story } from '../../domain/types';
import { NarrationControls } from './NarrationControls';

/**
 * Tests user-centric de los controles de narración (US-22/US-30). La lógica de
 * audio (`useNarration`: ElevenLabs + voz nativa + limpieza) se sustituye por un
 * doble para controlar el estado y verificar que cada botón dispara su acción. El
 * icono (lucide/SVG) también se sustituye.
 */
vi.mock('./Icon', () => ({ Icon: () => null }));
const { narrationMock } = vi.hoisted(() => ({ narrationMock: vi.fn() }));
vi.mock('../hooks/useNarration', () => ({ useNarration: () => narrationMock() }));

const story = {
  id: 's1',
  profileId: 'p1',
  tema: 'animales',
  estilo: 'aventura',
  titulo: 'El zorro valiente',
  cuerpo: 'Érase una vez...',
  idioma: 'es',
  estado: 'nuevo',
  proveedor: 'mock',
} satisfies Story;

describe('NarrationControls', () => {
  it('en reposo muestra "Escuchar" y al pulsarlo inicia la narración', () => {
    const escuchar = vi.fn();
    narrationMock.mockReturnValue({ estado: 'idle', escuchar, pausar: vi.fn(), parar: vi.fn() });

    render(<NarrationControls story={story} />);

    expect(screen.queryByRole('button', { name: 'Parar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Escuchar' }));
    expect(escuchar).toHaveBeenCalledTimes(1);
  });

  it('mientras suena ofrece "Pausar" y "Parar", cada uno con su acción', () => {
    const pausar = vi.fn();
    const parar = vi.fn();
    narrationMock.mockReturnValue({ estado: 'playing', escuchar: vi.fn(), pausar, parar });

    render(<NarrationControls story={story} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(pausar).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Parar' }));
    expect(parar).toHaveBeenCalledTimes(1);
  });
});
