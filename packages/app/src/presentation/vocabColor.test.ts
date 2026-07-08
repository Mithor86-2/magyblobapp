import { describe, expect, it } from 'vitest';
import { CATEGORIAS, ENSENANZAS, ESTILOS, TEMAS } from '../domain/types';
import { categoriaLabel, ensenanzaLabel, estiloLabel, temaLabel } from './labels';
import { darkColors, lightColors } from './theme/tokens';
import { type VocabValor, vocabColor } from './vocabColor';

/**
 * Verifica la fuente única de color por vocabulario (US-100): cada valor tiene color en claro
 * y oscuro, los colores son distintos por valor, y **mismo texto → mismo color** (el caso real
 * es "Música", que es tema y categoría a la vez).
 */
const TODOS: VocabValor[] = [...TEMAS, ...ESTILOS, ...ENSENANZAS, ...CATEGORIAS];
const CLAVES_UNICAS = [...new Set(TODOS)];
const HEX = /^#[0-9a-f]{6}$/i;

describe('vocabColor', () => {
  it('resuelve un color válido para cada valor de vocabulario en claro y oscuro', () => {
    for (const valor of TODOS) {
      const claro = vocabColor(lightColors, valor);
      const oscuro = vocabColor(darkColors, valor);
      expect(claro.color, `claro:${valor}`).toMatch(HEX);
      expect(claro.on, `claro-on:${valor}`).toMatch(HEX);
      expect(oscuro.color, `oscuro:${valor}`).toMatch(HEX);
      expect(oscuro.on, `oscuro-on:${valor}`).toMatch(HEX);
    }
  });

  it('asigna un color distinto a cada valor distinto (sin colisiones), en ambos temas', () => {
    for (const palette of [lightColors, darkColors]) {
      const colores = CLAVES_UNICAS.map((v) => vocabColor(palette, v).color);
      expect(new Set(colores).size).toBe(CLAVES_UNICAS.length);
    }
  });

  it('mismo texto → mismo color: "Música" comparte color como tema y como categoría', () => {
    // El caso real de solapamiento entre vocabularios es "musica".
    expect(temaLabel('musica')).toBe(categoriaLabel('musica'));
    expect(vocabColor(lightColors, 'musica')).toEqual(vocabColor(lightColors, 'musica'));
    // Agrupa TODOS los valores por su etiqueta visible y comprueba que cada grupo tiene un
    // único color (invariante general "mismo texto, mismo color").
    const label = (v: VocabValor): string => {
      if ((TEMAS as readonly string[]).includes(v)) return temaLabel(v as never);
      if ((ESTILOS as readonly string[]).includes(v)) return estiloLabel(v as never);
      if ((ENSENANZAS as readonly string[]).includes(v)) return ensenanzaLabel(v as never);
      return categoriaLabel(v as never);
    };
    const porEtiqueta = new Map<string, Set<string>>();
    for (const v of TODOS) {
      const key = label(v);
      const set = porEtiqueta.get(key) ?? new Set<string>();
      set.add(vocabColor(lightColors, v).color);
      porEtiqueta.set(key, set);
    }
    for (const [etiqueta, colores] of porEtiqueta) {
      expect(colores.size, `etiqueta:${etiqueta}`).toBe(1);
    }
  });
});
