import { describe, expect, it } from 'vitest';
import {
  parseStoryCovers,
  pickCover,
  SettingsStoryCoverCatalog,
  type StoryCover,
} from '../../src/infrastructure/ai/storyCovers.js';
import { InMemorySettingsRepository } from '../support/doubles.js';

/**
 * US-101: portadas de cuento configurables por BD. `pickCover` elige por prioridad
 * tema+estilo → tema → estilo → null; `parseStoryCovers` sanea el JSON de la config; y
 * `SettingsStoryCoverCatalog` compone ambos leyendo `story.covers` del repositorio.
 */
const COVERS: StoryCover[] = [
  { imagen: 'animales+aventura.png', tema: 'animales', estilo: 'aventura' },
  { imagen: 'animales.png', tema: 'animales' },
  { imagen: 'aventura.png', estilo: 'aventura' },
];

describe('pickCover', () => {
  it('prefiere la coincidencia exacta tema+estilo', () => {
    expect(pickCover(COVERS, 'animales', 'aventura')).toBe('animales+aventura.png');
  });

  it('cae al respaldo por tema cuando no hay combo exacto', () => {
    expect(pickCover(COVERS, 'animales', 'divertido')).toBe('animales.png');
  });

  it('cae al respaldo por estilo cuando no hay tema', () => {
    expect(pickCover(COVERS, 'espacio', 'aventura')).toBe('aventura.png');
  });

  it('devuelve null cuando no hay ninguna que aplique', () => {
    expect(pickCover(COVERS, 'espacio', 'divertido')).toBeNull();
  });
});

describe('parseStoryCovers', () => {
  it('parsea un JSON válido y conserva tema/estilo', () => {
    const raw = JSON.stringify([{ imagen: 'magia.png', tema: 'magia' }]);
    expect(parseStoryCovers(raw)).toEqual([
      { imagen: 'magia.png', tema: 'magia', estilo: undefined },
    ]);
  });

  it('descarta entradas con tema/estilo fuera del vocabulario', () => {
    const raw = JSON.stringify([
      { imagen: 'ok.png', tema: 'animales' },
      { imagen: 'malo.png', tema: 'inexistente' },
      { imagen: 'malo2.png', estilo: 'inexistente' },
    ]);
    expect(parseStoryCovers(raw)).toEqual([
      { imagen: 'ok.png', tema: 'animales', estilo: undefined },
    ]);
  });

  it('devuelve [] ante null, vacío o JSON inválido', () => {
    expect(parseStoryCovers(null)).toEqual([]);
    expect(parseStoryCovers('')).toEqual([]);
    expect(parseStoryCovers('{no es json')).toEqual([]);
    expect(parseStoryCovers('{"settings":1}')).toEqual([]);
  });
});

describe('SettingsStoryCoverCatalog', () => {
  it('lee story.covers del repositorio y resuelve por tema/estilo', async () => {
    const settings = new InMemorySettingsRepository(
      new Map([['story.covers', JSON.stringify(COVERS)]]),
    );
    const catalog = new SettingsStoryCoverCatalog(settings);
    expect(await catalog.pick('animales', 'aventura')).toBe('animales+aventura.png');
    expect(await catalog.pick('espacio', 'divertido')).toBeNull();
  });

  it('devuelve null si la clave no está configurada', async () => {
    const catalog = new SettingsStoryCoverCatalog(new InMemorySettingsRepository());
    expect(await catalog.pick('animales', 'aventura')).toBeNull();
  });
});
