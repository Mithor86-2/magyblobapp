// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BubblyButton } from './BubblyButton';

/**
 * Tests user-centric del botón principal (US-30). Lo ejercitamos como una
 * persona usuaria: lo localizamos por su **rol** accesible (`button`) y su
 * **nombre** (no por estructura ni estilos) y simulamos la pulsación. El icono
 * (lucide/SVG) se sustituye por un doble: no es lo que se prueba aquí.
 */
vi.mock('./Icon', () => ({ Icon: () => null }));

describe('BubblyButton', () => {
  it('se localiza por su rol de botón y su nombre, e invoca onPress al pulsar', () => {
    const onPress = vi.fn();
    render(<BubblyButton label="Generar cuento" onPress={onPress} />);

    const boton = screen.getByRole('button', { name: 'Generar cuento' });
    fireEvent.click(boton);

    expect(onPress).toHaveBeenCalledTimes(1);
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
  });
});
