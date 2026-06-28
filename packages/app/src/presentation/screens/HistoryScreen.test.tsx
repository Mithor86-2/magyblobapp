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
const { getHistoryMock } = vi.hoisted(() => ({ getHistoryMock: vi.fn() }));
vi.mock('../../composition', () => ({ api: { history: { get: getHistoryMock } } }));
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

import { HistoryScreen } from './HistoryScreen';

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
  valoracion: 4,
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

  it('al elegir un tema reduce la lista de cuentos', async () => {
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Cuento 1')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Espacio' }));
    expect(screen.queryByText('Cuento 1')).not.toBeInTheDocument();
    expect(screen.getByText('Cuento 2')).toBeVisible();
  });

  it('al elegir una categoría reduce la lista de actividades', async () => {
    render(<HistoryScreen {...props} />);
    await waitFor(() => expect(screen.getByText('Actividad a')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Arte' }));
    expect(screen.getByText('Actividad a')).toBeVisible();
    expect(screen.queryByText('Actividad b')).not.toBeInTheDocument();
  });
});
