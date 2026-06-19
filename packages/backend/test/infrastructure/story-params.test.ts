import { describe, expect, it } from 'vitest';
import {
  parseStoryParams,
  resolveStoryParams,
  type StoryParams,
} from '../../src/infrastructure/ai/storyParams.js';

const valido = JSON.stringify({
  palabrasMin: 50,
  palabrasMax: 120,
  rima: true,
  formatos: ['cuento', 'fabula', 'poema'],
});

describe('parseStoryParams', () => {
  it('parsea y sanea un JSON válido (dedup de formatos)', () => {
    const raw = JSON.stringify({
      palabrasMin: 50,
      palabrasMax: 120,
      rima: true,
      formatos: ['cuento', 'cuento', 'inventado', 'poema'],
    });
    expect(parseStoryParams(raw)).toEqual({
      palabrasMin: 50,
      palabrasMax: 120,
      rima: true,
      formatos: ['cuento', 'poema'], // 'inventado' descartado, 'cuento' deduplicado
    });
  });

  it('devuelve null si falta, no es JSON o no cumple la forma', () => {
    expect(parseStoryParams(null)).toBeNull();
    expect(parseStoryParams('')).toBeNull();
    expect(parseStoryParams('no es json')).toBeNull();
    expect(parseStoryParams(JSON.stringify({ palabrasMin: 50 }))).toBeNull();
  });

  it('rechaza min/max inválidos o max < min, y formatos vacíos', () => {
    expect(
      parseStoryParams(
        JSON.stringify({ palabrasMin: 0, palabrasMax: 10, rima: false, formatos: ['cuento'] }),
      ),
    ).toBeNull();
    expect(
      parseStoryParams(
        JSON.stringify({ palabrasMin: 100, palabrasMax: 50, rima: false, formatos: ['cuento'] }),
      ),
    ).toBeNull();
    expect(
      parseStoryParams(
        JSON.stringify({ palabrasMin: 10, palabrasMax: 20, rima: false, formatos: ['xxx'] }),
      ),
    ).toBeNull();
    expect(parseStoryParams(valido)).not.toBeNull();
  });
});

describe('resolveStoryParams', () => {
  const params: StoryParams = {
    palabrasMin: 50,
    palabrasMax: 120,
    rima: true,
    formatos: ['cuento', 'fabula', 'poema'],
  };

  it('elige el formato según el rng (determinista en tests)', () => {
    expect(resolveStoryParams(params, () => 0).formato).toBe('cuento');
    expect(resolveStoryParams(params, () => 0.5).formato).toBe('fabula');
    expect(resolveStoryParams(params, () => 0.99).formato).toBe('poema');
  });

  it('conserva longitud y rima', () => {
    const r = resolveStoryParams(params, () => 0);
    expect(r).toMatchObject({ palabrasMin: 50, palabrasMax: 120, rima: true });
  });
});
