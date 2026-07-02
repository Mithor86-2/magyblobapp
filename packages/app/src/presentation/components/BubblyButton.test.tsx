// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BubblyButton } from './BubblyButton';
import { lightColors } from '../theme/tokens';

/** Convierte un hex "#rrggbb" a la forma "rgb(r, g, b)" que expone react-native-web. */
function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/**
 * Tests user-centric del botón principal (US-30). Lo ejercitamos como una
 * persona usuaria: lo localizamos por su **rol** accesible (`button`) y su
 * **nombre** (no por estructura ni estilos) y simulamos la pulsación. El icono
 * (lucide/SVG) se sustituye por un doble: no es lo que se prueba aquí.
 */
vi.mock('./Icon', () => ({ Icon: () => null }));

// `expo-haptics` es un módulo nativo no importable bajo Vitest; lo sustituimos por un
// doble. Captura el háptico para verificar la confirmación táctil (US-56) sin tocar el SO.
const impactAsync = vi.fn((_style?: string) => Promise.resolve());
vi.mock('expo-haptics', () => ({
  impactAsync: (style?: string) => impactAsync(style),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('BubblyButton', () => {
  beforeEach(() => {
    impactAsync.mockClear();
  });

  it('se localiza por su rol de botón y su nombre, e invoca onPress al pulsar', () => {
    const onPress = vi.fn();
    render(<BubblyButton label="Generar cuento" onPress={onPress} />);

    const boton = screen.getByRole('button', { name: 'Generar cuento' });
    fireEvent.click(boton);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('al pulsar dispara una confirmación háptica suave (US-56)', () => {
    render(<BubblyButton label="Generar cuento" onPress={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generar cuento' }));

    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenCalledWith('light');
  });

  it('usa accessibilityLabel como nombre accesible en botones solo-icono', () => {
    render(<BubblyButton icon="play" accessibilityLabel="Reproducir" onPress={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeInTheDocument();
  });

  it('deshabilitado: se anuncia como deshabilitado y no invoca onPress', () => {
    const onPress = vi.fn();
    render(<BubblyButton label="Continuar" onPress={onPress} disabled />);

    const boton = screen.getByRole('button', { name: 'Continuar' });
    expect(boton).toBeDisabled();

    fireEvent.click(boton);
    expect(onPress).not.toHaveBeenCalled();
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it('cargando: muestra un indicador de progreso, queda deshabilitado y no invoca onPress', () => {
    const onPress = vi.fn();
    render(<BubblyButton label="Guardando" onPress={onPress} loading />);

    // El spinner se anuncia con rol "progressbar" (lo percibe un lector de pantalla).
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    const boton = screen.getByRole('button', { name: 'Guardando' });
    expect(boton).toBeDisabled();

    fireEvent.click(boton);
    expect(onPress).not.toHaveBeenCalled();
    expect(impactAsync).not.toHaveBeenCalled();
  });
});

/**
 * US-87 (ajuste #6): cada variante pinta su propio color de fondo y su "sombra" (borde
 * inferior) es un **tono oscuro del propio color** (no el borde coral fijo de antes).
 * La variante `quaternary` (ámbar) es el 4º color de acción ("Mis logros").
 */
describe('BubblyButton — color por variante (US-87)', () => {
  const CASOS = [
    { variante: 'primary', bg: lightColors.primary, borde: lightColors.primaryBorder },
    { variante: 'secondary', bg: lightColors.secondary, borde: lightColors.secondaryBorder },
    { variante: 'accent', bg: lightColors.tertiary, borde: lightColors.tertiaryBorder },
    { variante: 'quaternary', bg: lightColors.quaternary, borde: lightColors.quaternaryBorder },
    { variante: 'danger', bg: lightColors.error, borde: lightColors.errorBorder },
  ] as const;

  it.each(CASOS)(
    '$variante: fondo propio y borde inferior en tono oscuro propio',
    ({ variante, bg, borde }) => {
      render(<BubblyButton label={variante} onPress={vi.fn()} variant={variante} />);
      const boton = screen.getByRole('button', { name: variante });
      expect(boton).toHaveStyle({ backgroundColor: rgb(bg) });
      expect(boton).toHaveStyle({ borderBottomColor: rgb(borde) });
    },
  );

  it('la variante quaternary (ámbar) renderiza como botón accesible', () => {
    render(<BubblyButton label="Mis logros" onPress={vi.fn()} variant="quaternary" />);
    expect(screen.getByRole('button', { name: 'Mis logros' })).toBeInTheDocument();
  });
});
