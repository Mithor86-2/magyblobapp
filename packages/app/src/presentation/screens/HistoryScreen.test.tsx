// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import type { Activity, ChildProfile, History, Story } from '../../domain/types';

/**
 * US-62: el Historial muestra la fecha de generación formateada (cuando existe) y
 * filtra en cliente las listas ya cargadas (tema/estilo de cuentos, categoría de
 * actividades) con la opción "Todos" por defecto. Se sustituyen las dependencias
 * de IO (`api`, store) y los subcomponentes con SVG/safe-area que jsdom no
 * transforma; `ActivityCard` se reduce a su título + categoría para asertar el
 * filtrado.
 */
const { getHistoryMock, setStoryFavoriteMock } = vi.hoisted(() => ({
  getHistoryMock: vi.fn(),
  setStoryFavoriteMock: vi.fn(),
}));
vi.mock('../../composition', () => ({
  api: { history: { get: getHistoryMock }, stories: { setFavorite: setStoryFavoriteMock } },
}));
vi.mock('../components/AuthorBadge', () => ({ AuthorBadge: () => null }));
vi.mock('../components/Icon', () => ({ Icon: () => null }));
vi.mock('../components/ActivityCard', async () => {
  const { Text } = await import('react-native');
  return { ActivityCard: ({ activity }: { activity: Activity }) => <Text>{activity.titulo}</Text> };
});
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
// `useFocusEffect` corre el callback como efecto al recibir foco (una vez por
// cambio del callback memoizado), igual que la implementación real.
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

import { HistoryScreen, SearchFiltersModal } from './HistoryScreen';
import { TODOS } from './historyFilters';

const navigation = {
  getParent: () => ({ navigate: vi.fn() }),
} as unknown as ComponentProps<typeof HistoryScreen>['navigation'];
const props = { navigation } as unknown as ComponentProps<typeof HistoryScreen>;

const story = (
  id: string,
  tema: Story['tema'],
  estilo: Story['estilo'],
  creadoEn?: string,
): Story => ({
  id,
  profileId: 'p1',
  tema,
  estilo,
  titulo: `Cuento ${id}`,
  cuerpo: '...',
  idioma: 'es',
  estado: 'nuevo',
  proveedor: 'mock',
  creadoEn,
});

const activity = (id: string, categoria: Activity['categoria']): Activity => ({
  id,
  profileId: 'p1',
  categoria,
  titulo: `Actividad ${id}`,
  descripcion: '...',
  // El Historial muestra las actividades "hechas" por `completadaEn` (US-72), no por
  // la valoración; la puntuación es opcional.
  completadaEn: '2026-06-12T10:00:00.000Z',
  valoracion: 2,
  proveedor: 'mock',
});

const HISTORY: History = {
  stories: [
    story('1', 'animales', 'aventura', '2026-06-25T10:00:00.000Z'),
    story('2', 'espacio', 'educativo'),
  ],
  activities: [activity('a', 'arte'), activity('b', 'musica')],
};

describe('HistoryScreen — fecha y filtros (US-62)', () => {
  beforeEach(() => {
    getHistoryMock.mockReset();
    getHistoryMock.mockResolvedValue(HISTORY);
  });

  it('muestra la fecha de generación formateada cuando el cuento la trae', async () => {
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Cuento 1')).toBeVisible());
    // El cuento 1 trae creadoEn → muestra "Creado el ..."; el 2 no.
    expect(screen.getByText(/Creado el/)).toBeVisible();
  });

  it('por defecto ("Todos") muestra todos los cuentos y actividades', async () => {
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Cuento 1')).toBeVisible());
    expect(screen.getByText('Cuento 2')).toBeVisible();
    expect(screen.getByText('Actividad a')).toBeVisible();
    expect(screen.getByText('Actividad b')).toBeVisible();
  });

  it('A3: los filtros viven en un modal que se abre con "Buscar"', async () => {
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Cuento 1')).toBeVisible());
    // Con el modal cerrado, los chips de filtro no están montados.
    expect(screen.queryByRole('button', { name: 'Espacio' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('button', { name: 'Espacio' })).toBeInTheDocument();
  });

  it('al elegir un tema (en el modal) reduce la lista de cuentos', async () => {
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Cuento 1')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Espacio' }));
    expect(screen.queryByText('Cuento 1')).not.toBeInTheDocument();
    expect(screen.getByText('Cuento 2')).toBeVisible();
  });

  it('al elegir una categoría (en el modal) reduce la lista de actividades', async () => {
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Actividad a')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Arte' }));
    expect(screen.getByText('Actividad a')).toBeVisible();
    expect(screen.queryByText('Actividad b')).not.toBeInTheDocument();
  });

  it('A3: "Limpiar" resetea los filtros y vuelve a mostrar todo', async () => {
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Cuento 1')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Espacio' }));
    expect(screen.queryByText('Cuento 1')).not.toBeInTheDocument();
    // "Limpiar" resetea el filtro (hay uno en la barra y otro en el modal; ambos valen).
    fireEvent.click(screen.getAllByRole('button', { name: 'Limpiar' })[0]!);
    expect(screen.getByText('Cuento 1')).toBeVisible();
    expect(screen.getByText('Cuento 2')).toBeVisible();
  });
});

describe('HistoryScreen — favoritos y búsqueda (US-64)', () => {
  beforeEach(() => {
    getHistoryMock.mockReset();
    setStoryFavoriteMock.mockReset();
    setStoryFavoriteMock.mockResolvedValue(undefined);
  });

  it('la búsqueda de texto reduce las listas (normalizada) y vacía muestra todo', async () => {
    getHistoryMock.mockResolvedValue(HISTORY);
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Cuento 1')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    const buscador = screen.getByPlaceholderText('Busca por título, tema, categoría…');
    // "espacio" coincide con el tema del Cuento 2 (id del vocabulario).
    fireEvent.change(buscador, { target: { value: 'espacio' } });
    expect(screen.queryByText('Cuento 1')).not.toBeInTheDocument();
    expect(screen.getByText('Cuento 2')).toBeVisible();

    // Vaciar el campo restaura todo.
    fireEvent.change(buscador, { target: { value: '' } });
    expect(screen.getByText('Cuento 1')).toBeVisible();
    expect(screen.getByText('Cuento 2')).toBeVisible();
  });

  it('el chip "Solo favoritos" deja solo los marcados, combinándose con la búsqueda', async () => {
    getHistoryMock.mockResolvedValue({
      stories: [
        story('1', 'animales', 'aventura'),
        { ...story('2', 'espacio', 'educativo'), favorito: true },
      ],
      activities: [activity('a', 'arte')],
    });
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Cuento 1')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solo favoritos' }));
    expect(screen.queryByText('Cuento 1')).not.toBeInTheDocument();
    expect(screen.getByText('Cuento 2')).toBeVisible();
  });
});

/**
 * A3: la modal de búsqueda tiene un botón "X" (Cerrar) arriba a la derecha que
 * dispara el cierre. Se prueba el componente exportado en aislamiento con un espía
 * de `onClose` (el `Modal` con animación no desmonta su contenido bajo jsdom, así que
 * la aserción es sobre el callback, no sobre el DOM).
 */
describe('SearchFiltersModal — botón cerrar (A3/US-73)', () => {
  const modalProps = () => ({
    visible: true,
    onClose: vi.fn(),
    onClear: vi.fn(),
    busqueda: '',
    setBusqueda: vi.fn(),
    temaFiltro: TODOS,
    setTemaFiltro: vi.fn(),
    estiloFiltro: TODOS,
    setEstiloFiltro: vi.fn(),
    ensenanzaFiltro: TODOS,
    setEnsenanzaFiltro: vi.fn(),
    categoriaFiltro: TODOS,
    setCategoriaFiltro: vi.fn(),
    soloFavoritos: false,
    setSoloFavoritos: vi.fn(),
  });

  it('el botón "Cerrar" dispara onClose', () => {
    const p = modalProps();
    render(<SearchFiltersModal {...p} />);

    const cerrar = screen.getByRole('button', { name: 'Cerrar' });
    expect(cerrar).toBeInTheDocument();
    fireEvent.click(cerrar);
    expect(p.onClose).toHaveBeenCalledTimes(1);
  });
});
