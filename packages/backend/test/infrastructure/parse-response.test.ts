import { describe, expect, it } from 'vitest';
import { parseStory, parseActivities } from '../../src/infrastructure/ai/parseResponse.js';

/**
 * `parseResponse` es CORE (Strategic Coverage 100/80/0, US-35): sanea la salida del
 * LLM ANTES de mostrarla a un niño. Un modelo pequeño inventa números fuera de rango
 * o categorías inexistentes; aquí se verifica que esa basura se descarta y que, si no
 * queda contenido válido, se lanza (el `FallbackProvider` cae a mock).
 */
describe('parseStory', () => {
  it('recorta y estampa el proveedor cuando el cuento es válido', () => {
    const story = parseStory(
      { titulo: '  El zorro  ', cuerpo: '  Érase una vez.  ' },
      'Ollama',
      'local',
    );
    expect(story).toEqual({ titulo: 'El zorro', cuerpo: 'Érase una vez.', proveedor: 'local' });
  });

  it('lanza si falta el título', () => {
    expect(() => parseStory({ titulo: '   ', cuerpo: 'Cuerpo.' }, 'Ollama', 'local')).toThrow(
      /sin título o sin cuerpo/,
    );
  });

  it('lanza si falta el cuerpo', () => {
    expect(() => parseStory({ titulo: 'Título' }, 'Cloud', 'cloud')).toThrow(
      /sin título o sin cuerpo/,
    );
  });

  it('trata tipos no-string como vacío (lanza)', () => {
    expect(() =>
      parseStory({ titulo: 42 as unknown, cuerpo: null as unknown }, 'Ollama', 'local'),
    ).toThrow(/sin título o sin cuerpo/);
  });
});

describe('parseActivities', () => {
  const ok = { categoria: 'arte', titulo: 'Pintar', descripcion: 'Pinta con los dedos.' };

  it('acepta actividades válidas, recorta y estampa el proveedor', () => {
    const acts = parseActivities(
      { actividades: [ok, { ...ok, categoria: 'musica' }, { ...ok, categoria: 'logica' }] },
      2,
      'Ollama',
      'local',
    );
    expect(acts).toHaveLength(2); // recortado a `cantidad`
    expect(acts.every((a) => a.proveedor === 'local')).toBe(true);
    expect(acts[0]).toMatchObject({ categoria: 'arte', titulo: 'Pintar' });
  });

  it('descarta categorías inventadas por el LLM', () => {
    const acts = parseActivities(
      { actividades: [{ ...ok, categoria: 'cocina' }, ok] },
      5,
      'Ollama',
      'local',
    );
    expect(acts).toHaveLength(1);
    expect(acts[0]!.categoria).toBe('arte');
  });

  it('descarta actividades sin título o descripción', () => {
    const acts = parseActivities(
      { actividades: [{ ...ok, titulo: '   ' }, { ...ok, descripcion: '' }, ok] },
      5,
      'Ollama',
      'local',
    );
    expect(acts).toHaveLength(1);
  });

  it('sanea números fuera de rango: nivel 1000 y duración negativa → undefined', () => {
    const acts = parseActivities(
      { actividades: [{ ...ok, nivel: 1000, duracionMin: -5 }] },
      5,
      'Ollama',
      'local',
    );
    expect(acts[0]!.nivel).toBeUndefined();
    expect(acts[0]!.duracionMin).toBeUndefined();
  });

  it('US-54: conserva y recorta las instrucciones cuando vienen', () => {
    const acts = parseActivities(
      { actividades: [{ ...ok, instrucciones: '  1. Haz esto. 2. Luego aquello.  ' }] },
      5,
      'Ollama',
      'local',
    );
    expect(acts[0]!.instrucciones).toBe('1. Haz esto. 2. Luego aquello.');
  });

  it('US-54: deja instrucciones en undefined si faltan o vienen vacías', () => {
    const acts = parseActivities(
      { actividades: [ok, { ...ok, instrucciones: '   ' }, { ...ok, instrucciones: 42 }] },
      5,
      'Ollama',
      'local',
    );
    expect(acts.every((a) => a.instrucciones === undefined)).toBe(true);
  });

  it('conserva números válidos dentro de rango', () => {
    const acts = parseActivities(
      { actividades: [{ ...ok, nivel: 2, duracionMin: 15 }] },
      5,
      'Ollama',
      'local',
    );
    expect(acts[0]!.nivel).toBe(2);
    expect(acts[0]!.duracionMin).toBe(15);
  });

  it('descarta nivel/duración no enteros', () => {
    const acts = parseActivities(
      { actividades: [{ ...ok, nivel: 2.5, duracionMin: 10.1 }] },
      5,
      'Ollama',
      'local',
    );
    expect(acts[0]!.nivel).toBeUndefined();
    expect(acts[0]!.duracionMin).toBeUndefined();
  });

  it('ignora elementos que no son objetos', () => {
    const acts = parseActivities({ actividades: [null, 'texto', 42, ok] }, 5, 'Ollama', 'local');
    expect(acts).toHaveLength(1);
  });

  it('lanza si `actividades` no es un array', () => {
    expect(() => parseActivities({ actividades: 'nope' as unknown }, 3, 'Ollama', 'local')).toThrow(
      /ninguna actividad válida/,
    );
  });

  it('lanza si no queda ninguna actividad válida tras sanear', () => {
    expect(() =>
      parseActivities({ actividades: [{ ...ok, categoria: 'inexistente' }] }, 3, 'Cloud', 'cloud'),
    ).toThrow(/ninguna actividad válida/);
  });
});
