// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import type { Achievement, ChildProfile } from '../../domain/types';

/**
 * A4: Home muestra un resumen de logros ("conseguidos/total") con barra de progreso
 * y una **fila de trofeos** 🏆 (uno por logro conseguido, tope 8 + "+N"); si aún no
 * hay ninguno, un texto de ánimo. El resumen lleva a "Mis logros". Se sustituyen IO
 * (`api`), store, navegación e `Icon`.
 */
const { getMock, navigateMock } = vi.hoisted(() => ({ getMock: vi.fn(), navigateMock: vi.fn() }));
vi.mock('../../composition', () => ({ api: { achievements: { get: getMock } } }));
vi.mock('../components/Icon', () => ({ Icon: () => null }));
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

import { HomeScreen } from './HomeScreen';

const navigation = {
  navigate: navigateMock,
  getParent: () => ({ navigate: navigateMock }),
} as unknown as ComponentProps<typeof HomeScreen>['navigation'];
const props = { navigation } as unknown as ComponentProps<typeof HomeScreen>;

const logro = (clave: string, conseguido: boolean): Achievement => ({
  clave,
  categoria: 'cuentos',
  meta: 1,
  progreso: conseguido ? 1 : 0,
  conseguido,
});

describe('HomeScreen — resumen de logros (A4)', () => {
  beforeEach(() => {
    getMock.mockReset();
    navigateMock.mockReset();
  });

  it('muestra el resumen conseguidos/total y navega a Mis logros al tocarlo', async () => {
    getMock.mockResolvedValue([logro('a', true), logro('b', true), logro('c', false)]);
    render(<HomeScreen {...props} />);

    await waitFor(() => expect(getMock).toHaveBeenCalledWith('p1'));
    const resumen = await screen.findByText('2/3');
    expect(resumen).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mis logros/ }));
    expect(navigateMock).toHaveBeenCalledWith('Achievements');
  });

  it('no muestra el resumen si el catálogo viene vacío', async () => {
    getMock.mockResolvedValue([]);
    render(<HomeScreen {...props} />);
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(screen.queryByText('0/0')).not.toBeInTheDocument();
  });

  it('A4: muestra un 🏆 por cada logro conseguido', async () => {
    getMock.mockResolvedValue([logro('a', true), logro('b', true), logro('c', false)]);
    render(<HomeScreen {...props} />);

    await waitFor(() => expect(screen.getByText('2/3')).toBeInTheDocument());
    expect(screen.getAllByText('🏆')).toHaveLength(2);
    // Sin excedente no aparece el resumen "+N".
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
  });

  it('A4: acota a 8 trofeos y resume el resto como "+N"', async () => {
    // 10 conseguidos → 8 🏆 + "+2".
    const items = Array.from({ length: 10 }, (_, i) => logro(`c${i}`, true));
    getMock.mockResolvedValue(items);
    render(<HomeScreen {...props} />);

    await waitFor(() => expect(screen.getByText('10/10')).toBeInTheDocument());
    expect(screen.getAllByText('🏆')).toHaveLength(8);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('A4: sin logros conseguidos muestra el texto de ánimo y ningún 🏆', async () => {
    getMock.mockResolvedValue([logro('a', false), logro('b', false)]);
    render(<HomeScreen {...props} />);

    await waitFor(() => expect(screen.getByText('0/2')).toBeInTheDocument());
    expect(screen.queryByText('🏆')).not.toBeInTheDocument();
    expect(
      screen.getByText('¡Lee cuentos y haz actividades para ganar tus primeros trofeos!'),
    ).toBeInTheDocument();
  });
});

/**
 * US-94: los cuatro accesos rápidos de Inicio (rejilla de 2 columnas con icono) siguen siendo
 * botones accesibles por su nombre y navegan a su destino. Localizamos por rol/nombre, no por
 * estructura, así que la disposición en columnas o el icono no afectan al contrato.
 */
describe('HomeScreen — accesos rápidos (US-94)', () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue([]);
    navigateMock.mockReset();
  });

  const CASOS = [
    { nombre: 'Crear un cuento', destino: 'Cuentos' },
    { nombre: 'Ver actividades', destino: 'Actividades' },
    { nombre: 'Mis logros', destino: 'Achievements' },
    { nombre: 'Buscar', destino: 'SearchResults' },
  ] as const;

  it.each(CASOS)('el botón "$nombre" navega a $destino', async ({ nombre, destino }) => {
    render(<HomeScreen {...props} />);
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: nombre }));
    expect(navigateMock).toHaveBeenCalledWith(destino);
  });
});
