// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Activity } from '../../domain/types';
import { ActivityCard, pasosDeInstrucciones } from './ActivityCard';

/**
 * Tests user-centric de la tarjeta de actividad (US-09/US-10/US-30). Recorre el
 * flujo de la persona usuaria: ver los datos, marcar "Realizado" y valorar. El
 * icono (lucide/SVG) se sustituye por un doble; `StarRating` se usa real.
 */
vi.mock('./Icon', () => ({ Icon: () => null }));

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

    expect(screen.getByText('Cómo hacerlo')).toBeVisible();
    // Cada paso es un elemento propio (lista), no un párrafo único.
    expect(screen.getByText('Coge el papel.')).toBeVisible();
    expect(screen.getByText('Pinta.')).toBeVisible();
  });

  it('US-54: si no hay instrucciones, no muestra la sección "Cómo hacerlo"', () => {
    render(<ActivityCard activity={base} />);

    expect(screen.queryByText('Cómo hacerlo')).not.toBeInTheDocument();
  });

  it('con onComplete: al marcar "Realizado" pide la valoración y la notifica', () => {
    const onComplete = vi.fn();
    render(<ActivityCard activity={base} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Realizado' }));
    expect(screen.getByText('¿Qué tal estuvo?')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '3 estrellas' }));
    expect(onComplete).toHaveBeenCalledWith(3);
  });

  it('si ya está valorada, muestra "¡Hecha!" y no ofrece marcarla de nuevo', () => {
    render(<ActivityCard activity={{ ...base, valoracion: 2 }} onComplete={vi.fn()} />);

    expect(screen.getByText('¡Hecha!')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Realizado' })).not.toBeInTheDocument();
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
