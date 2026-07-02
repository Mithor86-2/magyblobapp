// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import type { ChildProfile, Story } from '../../domain/types';

/**
 * Tests user-centric del generador de cuentos (US-47): la selección de tema y
 * estilo es **múltiple** (chips toggle) y el botón solo genera con ≥1 de cada,
 * enviando las listas al gateway. Tras generar con éxito **navega al lector**
 * (A1/US-73) en vez de mostrar el cuento en línea. Se sustituyen las dependencias
 * de IO (`api`, store, telemetría) y la navegación.
 */
const { generateMock, navigateMock } = vi.hoisted(() => ({
  generateMock: vi.fn(),
  navigateMock: vi.fn(),
}));
vi.mock('../../composition', () => ({
  api: { stories: { generate: generateMock } },
}));
vi.mock('../../infrastructure/telemetry', () => ({ trackAction: vi.fn() }));
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

// La pantalla usa `navigation.getParent().navigate('StoryReader', …)` para abrir el
// lector (A1); el resto de props de navegación no se usan.
const navigation = {
  getParent: () => ({ navigate: navigateMock }),
} as unknown as ComponentProps<typeof StoryGeneratorScreen>['navigation'];
const props = { navigation } as unknown as ComponentProps<typeof StoryGeneratorScreen>;

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
    navigateMock.mockReset();
  });

  it('permite seleccionar varios temas y estilos y los envía como listas', async () => {
    render(<StoryGeneratorScreen {...props} />);

    // Arranca con los intereses (animales, espacio) y un estilo preseleccionados;
    // añadimos un tema más (magia, que no es interés) y un estilo más.
    fireEvent.click(screen.getByRole('button', { name: 'Magia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Divertido' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(1));
    expect(generateMock).toHaveBeenCalledWith({
      profileId: 'p1',
      temas: ['animales', 'espacio', 'magia'],
      estilos: ['aventura', 'divertido'],
      // US-76: por defecto se usa el nombre del niño (el toggle arranca activo).
      usarNombre: true,
    });
  });

  it('al deseleccionar todos los temas no genera (botón deshabilitado)', async () => {
    render(<StoryGeneratorScreen {...props} />);

    // Los temas preseleccionados son los intereses del perfil (animales y espacio):
    // los quitamos los dos para dejar la lista vacía.
    fireEvent.click(screen.getByRole('button', { name: 'Animales' }));
    fireEvent.click(screen.getByRole('button', { name: 'Espacio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    expect(generateMock).not.toHaveBeenCalled();
  });

  it('US-54: ofrece todos los temas (incluidos magia y música), no solo los intereses', () => {
    render(<StoryGeneratorScreen {...props} />);

    // El perfil solo tiene intereses animales/espacio, pero el generador muestra todo
    // el vocabulario para poder elegir libremente.
    expect(screen.getByRole('button', { name: 'Magia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Música' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aventuras' })).toBeInTheDocument();
  });

  it('US-69: envía la enseñanza elegida (selección única opcional)', async () => {
    render(<StoryGeneratorScreen {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Valentía' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(1));
    expect(generateMock.mock.calls[0]![0]).toMatchObject({ ensenanza: 'valentia' });
  });

  it('US-69: es selección única (elegir otra enseñanza reemplaza la anterior)', async () => {
    render(<StoryGeneratorScreen {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Valentía' }));
    fireEvent.click(screen.getByRole('button', { name: 'Amistad y compartir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(1));
    expect(generateMock.mock.calls[0]![0]).toMatchObject({ ensenanza: 'amistad' });
  });

  it('US-69: sin enseñanza no envía ninguna (opcional)', async () => {
    render(<StoryGeneratorScreen {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(1));
    expect(generateMock.mock.calls[0]![0]!.ensenanza).toBeUndefined();
  });

  it('US-76: por defecto envía usarNombre=true y al desactivar el toggle envía false', async () => {
    render(<StoryGeneratorScreen {...props} />);

    // El toggle "Usar el nombre de Lola" arranca activo → usarNombre true por defecto.
    fireEvent.click(screen.getByRole('button', { name: 'Usar el nombre de Lola' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledTimes(1));
    expect(generateMock.mock.calls[0]![0]).toMatchObject({ usarNombre: false });
  });

  it('A1/US-73: tras generar navega al lector con el cuento y no lo muestra en línea', async () => {
    render(<StoryGeneratorScreen {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('StoryReader', { story: STORY }));
    // El cuento no se renderiza en línea en el generador (se lee en StoryReader).
    expect(screen.queryByText('El zorro valiente')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar como leído' })).not.toBeInTheDocument();
  });
});
