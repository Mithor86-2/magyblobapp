// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import type { ChildProfile, Story } from '../../domain/types';

/**
 * Tests user-centric del generador de cuentos (US-47): la selección de tema y
 * estilo es **múltiple** (chips toggle) y el botón solo genera con ≥1 de cada,
 * enviando las listas al gateway. Se sustituyen las dependencias de IO (`api`,
 * store, telemetría) y la subvista de narración (audio nativo).
 */
const { generateMock } = vi.hoisted(() => ({ generateMock: vi.fn() }));
vi.mock('../../composition', () => ({ api: { stories: { generate: generateMock } } }));
vi.mock('../../infrastructure/telemetry', () => ({ trackAction: vi.fn() }));
vi.mock('../components/NarrationControls', () => ({ NarrationControls: () => null }));
vi.mock('../components/AuthorBadge', () => ({ AuthorBadge: () => null }));
// El icono (lucide/SVG) y el contexto de safe-area no son transformables bajo jsdom.
vi.mock('../components/Icon', () => ({ Icon: () => null }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

const perfil: ChildProfile = {
  id: 'p1',
  guardianId: 'g1',
  nombre: 'Lola',
  edad: 5,
  idioma: 'es',
  avatar: 'zorro',
  intereses: ['animales', 'espacio'],
};

vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: { currentProfile: ChildProfile }) => unknown) =>
    selector({ currentProfile: perfil }),
}));

// Importado tras los mocks para que los consuma.
import { StoryGeneratorScreen } from './StoryGeneratorScreen';

// La pantalla ignora sus props de navegación (`_props`); basta un objeto vacío.
const props = {} as unknown as ComponentProps<typeof StoryGeneratorScreen>;

const STORY: Story = {
  id: 's1',
  profileId: 'p1',
  tema: 'animales',
  estilo: 'aventura',
  titulo: 'El zorro valiente',
  cuerpo: 'Érase una vez...',
  idioma: 'es',
  estado: 'nuevo',
  proveedor: 'mock',
};

describe('StoryGeneratorScreen — multi-selección (US-47)', () => {
  beforeEach(() => {
    generateMock.mockReset();
    generateMock.mockResolvedValue(STORY);
  });

  it('permite seleccionar varios temas y estilos y los envía como listas', async () => {
    render(<StoryGeneratorScreen {...props} />);

    // Arranca con un tema (primer interés) y un estilo preseleccionados; añadimos más.
    fireEvent.click(screen.getByRole('button', { name: 'Espacio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Divertido' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(1));
    expect(generateMock).toHaveBeenCalledWith({
      profileId: 'p1',
      temas: ['animales', 'espacio'],
      estilos: ['aventura', 'divertido'],
    });
  });

  it('al deseleccionar todos los temas no genera (botón deshabilitado)', async () => {
    render(<StoryGeneratorScreen {...props} />);

    // El único tema preseleccionado es el primer interés (animales): lo quitamos.
    fireEvent.click(screen.getByRole('button', { name: 'Animales' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    expect(generateMock).not.toHaveBeenCalled();
  });
});
