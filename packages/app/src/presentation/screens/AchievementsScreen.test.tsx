// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import type { Achievement, ChildProfile } from '../../domain/types';

/**
 * US-68: la vitrina de logros pinta el catálogo agrupado por categoría con su
 * progreso y estado (conseguido/bloqueado). Se sustituyen las dependencias de IO
 * (`api`, store) y el contexto de safe-area que jsdom no transforma.
 */
const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock('../../composition', () => ({ api: { achievements: { get: getMock } } }));
// El icono (lucide/SVG) no es transformable bajo jsdom; lo consume BubblyButton.
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

import { AchievementsScreen } from './AchievementsScreen';

const props = {} as unknown as ComponentProps<typeof AchievementsScreen>;

const logro = (clave: string, extra: Partial<Achievement>): Achievement => ({
  clave,
  categoria: 'cuentos',
  meta: 5,
  progreso: 0,
  conseguido: false,
  ...extra,
});

describe('AchievementsScreen (US-68)', () => {
  beforeEach(() => getMock.mockReset());

  it('muestra el resumen y el objetivo de cada logro', async () => {
    getMock.mockResolvedValue([
      logro('cuentos_leidos_1', { categoria: 'cuentos', meta: 1, progreso: 1, conseguido: true }),
      logro('cuentos_leidos_5', { categoria: 'cuentos', meta: 5, progreso: 1, conseguido: false }),
      logro('tema_animales', { categoria: 'temas', meta: 1, progreso: 1, conseguido: true }),
    ]);

    render(<AchievementsScreen {...props} />);

    await waitFor(() => expect(getMock).toHaveBeenCalledWith('p1'));
    // Resumen: 2 de 3 conseguidos.
    expect(await screen.findByText('2 de 3 logros')).toBeInTheDocument();
    // Objetivos legibles (pluralización + etiqueta de tema).
    expect(screen.getByText('Leer 5 cuentos')).toBeInTheDocument();
    expect(screen.getByText('Explorar Animales')).toBeInTheDocument();
  });

  it('distingue conseguido (¡Conseguido!) de bloqueado (progreso)', async () => {
    getMock.mockResolvedValue([
      logro('cuentos_leidos_1', { categoria: 'cuentos', meta: 1, progreso: 1, conseguido: true }),
      logro('cuentos_leidos_5', { categoria: 'cuentos', meta: 5, progreso: 2, conseguido: false }),
    ]);

    render(<AchievementsScreen {...props} />);

    expect(await screen.findByText('¡Conseguido!')).toBeInTheDocument();
    // Un logro bloqueado muestra su progreso "2/5".
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('muestra el mensaje vacío si no hay logros', async () => {
    getMock.mockResolvedValue([]);
    render(<AchievementsScreen {...props} />);
    expect(await screen.findByText('Aún no hay logros. ¡Empieza a jugar!')).toBeInTheDocument();
  });
});
