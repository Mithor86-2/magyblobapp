// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Activity } from '../../domain/types';
import { ActivityCard, pasosDeInstrucciones } from './ActivityCard';

/**
 * Tests user-centric de la tarjeta de actividad (US-09/US-10/US-30/US-64). Recorre
 * el flujo de la persona usuaria: ver los datos, marcar "Realizado", valorar y
 * marcar favorito. El icono (lucide/SVG) se sustituye por un doble; `StarRating` se
 * usa real. El `api` del composition root se mockea (la tarjeta llama a
 * `activities.setFavorite` al pulsar la estrella, US-64).
 */
vi.mock('./Icon', () => ({ Icon: () => null }));
const { setFavoriteMock } = vi.hoisted(() => ({ setFavoriteMock: vi.fn() }));
vi.mock('../../composition', () => ({
  api: { activities: { setFavorite: setFavoriteMock } },
}));

const base = {
  id: 'a1',
  profileId: 'p1',
  categoria: 'arte',
  titulo: 'Pintar un dragón',
  descripcion: 'Con acuarelas de colores',
  duracionMin: 15,
  nivel: 2,
  proveedor: 'local',
} satisfies Activity;

describe('ActivityCard', () => {
  it('muestra los datos de la actividad y su autor', () => {
    render(<ActivityCard activity={base} />);

    expect(screen.getByText('Pintar un dragón')).toBeVisible();
    expect(screen.getByText('Con acuarelas de colores')).toBeVisible();
    expect(screen.getByText('Arte')).toBeVisible();
    expect(screen.getByText('15 min · Nivel 2')).toBeVisible();
    expect(screen.getByText('Autor: IA local')).toBeVisible();
  });

  it('US-54: muestra las instrucciones como lista de pasos cuando existen', () => {
    render(<ActivityCard activity={{ ...base, instrucciones: '1. Coge el papel. 2. Pinta.' }} />);

    // US-81: los pasos empiezan ocultos; solo se ofrece "Ver pasos".
    expect(screen.getByRole('button', { name: 'Ver pasos' })).toBeVisible();
    expect(screen.queryByText('Coge el papel.')).not.toBeInTheDocument();

    // Al pulsar "Ver pasos" se despliegan como lista (cada paso su elemento).
    fireEvent.click(screen.getByRole('button', { name: 'Ver pasos' }));
    expect(screen.getByText('Coge el papel.')).toBeVisible();
    expect(screen.getByText('Pinta.')).toBeVisible();

    // El botón pasa a "Ocultar pasos" y al pulsarlo se repliegan.
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar pasos' }));
    expect(screen.queryByText('Coge el papel.')).not.toBeInTheDocument();
  });

  it('US-81: si no hay instrucciones, no muestra el botón de pasos', () => {
    render(<ActivityCard activity={base} />);

    expect(screen.queryByRole('button', { name: 'Ver pasos' })).not.toBeInTheDocument();
  });

  it('US-72: al pulsar "Realizado" completa al instante, sin exigir valoración', () => {
    const onComplete = vi.fn();
    render(<ActivityCard activity={base} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Realizado' }));
    // Se notifica sin valoración (la actividad queda hecha ya).
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toBeUndefined();
  });

  it('US-72: hecha pero sin puntuar (con onComplete) invita a valorar y notifica la estrella', () => {
    const onComplete = vi.fn();
    render(
      <ActivityCard
        activity={{ ...base, completadaEn: '2026-06-10T12:00:00.000Z' }}
        onComplete={onComplete}
      />,
    );

    // Ya no ofrece "Realizado" (está hecha) y las estrellas quedan editables.
    expect(screen.queryByRole('button', { name: 'Realizado' })).not.toBeInTheDocument();
    expect(screen.getByText('¿Qué tal estuvo?')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '3 estrellas' }));
    expect(onComplete).toHaveBeenCalledWith(3);
  });

  it('si ya está hecha y valorada, muestra "¡Hecha!" y no ofrece marcarla de nuevo', () => {
    render(
      <ActivityCard
        activity={{ ...base, completadaEn: '2026-06-10T12:00:00.000Z', valoracion: 2 }}
      />,
    );

    expect(screen.getByText('¡Hecha!')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Realizado' })).not.toBeInTheDocument();
  });

  it('US-64: al pulsar la estrella marca la actividad como favorita vía el gateway', () => {
    setFavoriteMock.mockReset();
    setFavoriteMock.mockResolvedValue({ ...base, favorito: true });
    render(<ActivityCard activity={base} />);

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como favorito' }));
    expect(setFavoriteMock).toHaveBeenCalledWith('a1', true);
  });
});

describe('pasosDeInstrucciones', () => {
  it('parte un texto numerado "1. … 2. …" en pasos sin el marcador', () => {
    expect(pasosDeInstrucciones('1. Coge el papel. 2. Pinta. 3. Limpia.')).toEqual([
      'Coge el papel.',
      'Pinta.',
      'Limpia.',
    ]);
  });

  it('parte por líneas si no hay numeración', () => {
    expect(pasosDeInstrucciones('Primero esto\nLuego lo otro')).toEqual([
      'Primero esto',
      'Luego lo otro',
    ]);
  });
});
