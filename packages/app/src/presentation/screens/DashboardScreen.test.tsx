// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import type { AnonymousActivity, AnonymousStory } from '../../domain/types';

/**
 * Inicio sin sesión (US-50): el Dashboard genera cuentos y actividades en modo
 * anónimo efímero (gateways públicos, sin sesión) y limita el uso con un contador
 * en el cliente (3 + 3). Se sustituyen las dependencias de IO (`api`, telemetría)
 * y los subcomponentes con SVG/safe-area que jsdom no transforma.
 */
const { generateAnonymousMock, recommendAnonymousMock } = vi.hoisted(() => ({
  generateAnonymousMock: vi.fn(),
  recommendAnonymousMock: vi.fn(),
}));
vi.mock('../../composition', () => ({
  api: {
    stories: { generateAnonymous: generateAnonymousMock },
    activities: { recommendAnonymous: recommendAnonymousMock },
  },
}));
vi.mock('../../infrastructure/telemetry', () => ({ trackAction: vi.fn() }));
vi.mock('../components/AuthorBadge', () => ({ AuthorBadge: () => null }));
vi.mock('../components/ActivityCard', () => ({
  ActivityCard: ({ activity }: { activity: { titulo: string } }) => activity.titulo,
}));
vi.mock('../components/Icon', () => ({ Icon: () => null }));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

import { DashboardScreen } from './DashboardScreen';

const navigation = { navigate: vi.fn() };
const props = { navigation } as unknown as ComponentProps<typeof DashboardScreen>;

const STORY: AnonymousStory = {
  tema: 'animales',
  estilo: 'aventura',
  titulo: 'El zorro valiente',
  cuerpo: 'Érase una vez...',
  idioma: 'es',
  proveedor: 'mock',
};

const ACTIVITY: AnonymousActivity = {
  categoria: 'arte',
  titulo: 'Pintar con dedos',
  descripcion: 'Mezcla colores con las manos.',
  proveedor: 'mock',
};

describe('DashboardScreen — modo anónimo efímero (US-50)', () => {
  beforeEach(() => {
    generateAnonymousMock.mockReset();
    generateAnonymousMock.mockResolvedValue(STORY);
    recommendAnonymousMock.mockReset();
    recommendAnonymousMock.mockResolvedValue([ACTIVITY]);
    navigation.navigate.mockReset();
  });

  it('genera un cuento anónimo (sin profileId ni nombre) y abre el lector (US-96)', async () => {
    render(<DashboardScreen {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    await waitFor(() => expect(generateAnonymousMock).toHaveBeenCalledTimes(1));
    const arg = generateAnonymousMock.mock.calls[0][0];
    expect(arg).not.toHaveProperty('profileId');
    expect(arg.temas.length).toBeGreaterThan(0);
    expect(arg.estilos.length).toBeGreaterThan(0);

    // US-96: ya no pinta el cuento inline; navega al lector en modo anónimo con el
    // `AnonymousStory` adaptado a `Story` (id/perfil 'anon', estado 'nuevo').
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(
        'StoryReader',
        expect.objectContaining({
          anonimo: true,
          story: expect.objectContaining({
            id: 'anon',
            profileId: 'anon',
            titulo: 'El zorro valiente',
            estado: 'nuevo',
          }),
        }),
      ),
    );
    expect(screen.queryByText('Érase una vez...')).not.toBeInTheDocument();
  });

  it('genera actividades anónimas al pulsar Generar actividades', async () => {
    render(<DashboardScreen {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generar actividades' }));

    await waitFor(() => expect(recommendAnonymousMock).toHaveBeenCalledTimes(1));
    expect(recommendAnonymousMock.mock.calls[0][0]).not.toHaveProperty('profileId');
  });

  it('muestra la cabecera ilustrada del Dashboard (US-58)', () => {
    render(<DashboardScreen {...props} />);

    // El Screen pinta la imagen de cabecera (headerImageName="dashboard");
    // react-native-web la expone con role="img".
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('navega a crear cuenta y a iniciar sesión desde el Dashboard', () => {
    render(<DashboardScreen {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(navigation.navigate).toHaveBeenCalledWith('Consent');

    fireEvent.click(screen.getByRole('button', { name: 'Ya tengo cuenta' }));
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('deshabilita el botón de cuento al alcanzar el límite de 3 usos', async () => {
    render(<DashboardScreen {...props} />);

    for (let i = 0; i < 3; i++) {
      // Re-consulta el botón "Generar cuento" tras cada generación (su estado cambia
      // mientras carga); espera a que el contador suba antes del siguiente uso.
      // eslint-disable-next-line no-await-in-loop
      const boton = await screen.findByRole('button', { name: 'Generar cuento' });
      fireEvent.click(boton);
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => expect(generateAnonymousMock).toHaveBeenCalledTimes(i + 1));
    }

    // Tras 3 usos, el botón pasa a "Límite alcanzado" y no vuelve a llamar al gateway.
    const botonLimite = await screen.findByRole('button', { name: /Límite alcanzado/ });
    fireEvent.click(botonLimite);
    expect(generateAnonymousMock).toHaveBeenCalledTimes(3);
  });
});
