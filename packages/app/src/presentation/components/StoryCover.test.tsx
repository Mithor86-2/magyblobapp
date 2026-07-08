// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoryCover, portadaSource, temaDeCategoria } from './StoryCover';

/**
 * Test del fallback de portada por tema (US-59). La app SIEMPRE muestra una
 * portada: la imagen generada (data URL) si existe, o el respaldo local por tema.
 */
describe('portadaSource', () => {
  it('usa la imagen generada (data URL) cuando existe', () => {
    const url = 'data:image/png;base64,ABC';
    expect(portadaSource(url, 'animales')).toEqual({ uri: url });
  });

  it('cae al respaldo local del tema cuando no hay imagen generada', () => {
    const animales = portadaSource(undefined, 'animales');
    const espacio = portadaSource(undefined, 'espacio');
    // Cada tema resuelve a un respaldo (módulo empaquetado) y son distintos entre sí.
    expect(animales).toBeTruthy();
    expect(espacio).toBeTruthy();
    expect(animales).not.toEqual(espacio);
  });

  it('cae al respaldo local también con cadena vacía (no es una data URL válida)', () => {
    expect(portadaSource('', 'magia')).toEqual(portadaSource(undefined, 'magia'));
  });

  it('usa un respaldo neutro (default) ante un tema desconocido', () => {
    // El tema desconocido cae al respaldo de `aventuras` (default), nunca a undefined.
    expect(portadaSource(undefined, 'piratas')).toEqual(portadaSource(undefined, 'aventuras'));
  });

  // US-101: portada empaquetada elegida por el backend (`portadaKey`).
  it('usa la portada empaquetada indicada por portadaKey (tema+estilo)', () => {
    const combo = portadaSource(undefined, 'animales', 'animales+aventura.png');
    // Debe ser una portada distinta del respaldo por tema simple.
    expect(combo).toBeTruthy();
    expect(combo).not.toEqual(portadaSource(undefined, 'animales'));
  });

  it('la imagen generada (data URL) tiene prioridad sobre portadaKey', () => {
    const url = 'data:image/png;base64,ABC';
    expect(portadaSource(url, 'animales', 'animales+aventura.png')).toEqual({ uri: url });
  });

  it('cae al respaldo por tema si portadaKey no está en el catálogo', () => {
    expect(portadaSource(undefined, 'magia', 'inexistente.png')).toEqual(
      portadaSource(undefined, 'magia'),
    );
  });
});

describe('temaDeCategoria', () => {
  it('mapea cada categoría de actividad a un tema con respaldo', () => {
    expect(temaDeCategoria('arte')).toBe('magia');
    expect(temaDeCategoria('musica')).toBe('musica');
    expect(temaDeCategoria('logica')).toBe('espacio');
  });

  it('cae a aventuras ante una categoría desconocida', () => {
    expect(temaDeCategoria('desconocida')).toBe('aventuras');
  });
});

describe('StoryCover', () => {
  it('renderiza una imagen accesible', () => {
    render(<StoryCover tema="animales" accessibilityLabel="Mi cuento" />);
    expect(screen.getByLabelText('Mi cuento')).toBeInTheDocument();
  });
});
