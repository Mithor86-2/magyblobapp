// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import type { Activity, ChildProfile, History, Story } from '../../domain/types';

/**
 * US-82: búsqueda global. Sobre la biblioteca del perfil (cuentos + actividades),
 * al escribir en el campo aparecen en un mismo listado los que coinciden (por título,
 * cuerpo/descripción, etc.), separados en secciones Cuentos y Actividades; sin texto se
 * muestra una pista. Se sustituyen las dependencias de IO (`api`, store, navegación) y
 * los subcomponentes con SVG/safe-area que jsdom no transforma.
 */
const { getHistoryMock, setFavoriteMock } = vi.hoisted(() => ({
  getHistoryMock: vi.fn(),
  setFavoriteMock: vi.fn(),
}));
vi.mock('../../composition', () => ({
  api: { history: { get: getHistoryMock }, activities: { setFavorite: setFavoriteMock } },
}));
vi.mock('../components/Icon', () => ({ Icon: () => null }));
vi.mock('../components/ActivityCard', async () => {
  const { Text } = await import('react-native');
  return { ActivityCard: ({ activity }: { activity: Activity }) => <Text>{activity.titulo}</Text> };
});
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => {
    useEffect(() => cb(), [cb]);
  },
}));

const perfil: ChildProfile = {
  id: 'p1',
  guardianId: 'g1',
  nombre: 'Lola',
  edad: 5,
  idioma: 'es',
  avatar: 'zorro',
  intereses: ['animales'],
};
vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: { currentProfile: ChildProfile }) => unknown) =>
    selector({ currentProfile: perfil }),
}));

import { SearchResultsScreen } from './SearchResultsScreen';

const navigate = vi.fn();
const navigation = { navigate } as unknown as ComponentProps<
  typeof SearchResultsScreen
>['navigation'];
const props = { navigation } as unknown as ComponentProps<typeof SearchResultsScreen>;

const HISTORY: History = {
  stories: [
    {
      id: 's1',
      profileId: 'p1',
      tema: 'animales',
      estilo: 'aventura',
      titulo: 'El dragón valiente',
      cuerpo: '...',
      idioma: 'es',
      estado: 'nuevo',
      proveedor: 'mock',
    },
    {
      id: 's2',
      profileId: 'p1',
      tema: 'espacio',
      estilo: 'educativo',
      titulo: 'Viaje a la luna',
      cuerpo: '...',
      idioma: 'es',
      estado: 'nuevo',
      proveedor: 'mock',
    },
  ],
  activities: [
    {
      id: 'a1',
      profileId: 'p1',
      categoria: 'arte',
      titulo: 'Pintar un dragón',
      descripcion: '...',
      proveedor: 'mock',
    },
  ],
};

beforeEach(() => {
  getHistoryMock.mockReset();
  getHistoryMock.mockResolvedValue(HISTORY);
  navigate.mockReset();
});

describe('SearchResultsScreen (US-82)', () => {
  it('sin texto muestra la pista y ningún resultado', async () => {
    render(<SearchResultsScreen {...props} />);
    await waitFor(() => expect(getHistoryMock).toHaveBeenCalledWith('p1'));
    expect(screen.getByText('Escribe para buscar en tu biblioteca.')).toBeVisible();
    expect(screen.queryByText('El dragón valiente')).not.toBeInTheDocument();
  });

  it('busca por texto y lista cuentos y actividades que coinciden', async () => {
    render(<SearchResultsScreen {...props} />);
    await waitFor(() => expect(getHistoryMock).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'dragón' } });

    // Coinciden el cuento "El dragón valiente" y la actividad "Pintar un dragón".
    expect(await screen.findByText('El dragón valiente')).toBeVisible();
    expect(screen.getByText('Pintar un dragón')).toBeVisible();
    // No coincide "Viaje a la luna".
    expect(screen.queryByText('Viaje a la luna')).not.toBeInTheDocument();
  });

  it('sin coincidencias muestra el mensaje de vacío', async () => {
    render(<SearchResultsScreen {...props} />);
    await waitFor(() => expect(getHistoryMock).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'zzzzz' } });
    expect(screen.getByText(/No hay resultados/)).toBeVisible();
  });

  it('al tocar un cuento abre el lector', async () => {
    render(<SearchResultsScreen {...props} />);
    await waitFor(() => expect(getHistoryMock).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'luna' } });
    fireEvent.click(await screen.findByText('Viaje a la luna'));
    expect(navigate).toHaveBeenCalledWith(
      'StoryReader',
      expect.objectContaining({ story: expect.any(Object) }),
    );
  });
});
