import { describe, expect, it } from 'vitest';
import { paginarCuento } from './paginarCuento';

/**
 * A2/US-73: paginado del cuerpo del cuento en páginas de libro. Es lógica pura:
 * separa por párrafos, reparte párrafos largos por frases sin superar mucho el
 * objetivo de palabras, y siempre devuelve al menos una página.
 */
const contar = (t: string) => (t.trim() === '' ? 0 : t.trim().split(/\s+/).length);

describe('paginarCuento (A2/US-73)', () => {
  it('un párrafo por página cuando cada uno cabe en el objetivo', () => {
    const cuerpo = 'Primer párrafo corto.\n\nSegundo párrafo corto.\nTercero.';
    const paginas = paginarCuento(cuerpo, 60);
    expect(paginas).toEqual(['Primer párrafo corto.', 'Segundo párrafo corto.', 'Tercero.']);
  });

  it('un párrafo largo se reparte por frases en varias páginas', () => {
    // Cinco frases de ~5 palabras (25 en total); con objetivo 10 → ~3 páginas.
    const parrafo =
      'El zorro corría muy rápido. La liebre saltaba sin parar. El búho miraba desde arriba. ' +
      'El río sonaba con calma. Todos volvieron a casa.';
    const paginas = paginarCuento(parrafo, 10);
    expect(paginas.length).toBeGreaterThan(1);
    // Ninguna página se dispara muy por encima del objetivo (respeta el límite aprox).
    for (const pagina of paginas) {
      expect(contar(pagina)).toBeLessThanOrEqual(14);
    }
    // No se pierde texto: al reunir las páginas están todas las frases.
    const unido = paginas.join(' ');
    expect(unido).toContain('El zorro corría muy rápido.');
    expect(unido).toContain('Todos volvieron a casa.');
  });

  it('un cuerpo de una sola línea sin puntos cabe en una página', () => {
    const paginas = paginarCuento('Había una vez un dragón amable', 60);
    expect(paginas).toEqual(['Había una vez un dragón amable']);
  });

  it('cuerpo vacío devuelve una única página en blanco', () => {
    expect(paginarCuento('', 60)).toEqual(['']);
    expect(paginarCuento('   \n\n  ', 60)).toEqual(['']);
  });

  it('siempre devuelve al menos una página', () => {
    expect(paginarCuento('Solo esto.').length).toBeGreaterThanOrEqual(1);
  });

  it('respeta el límite aproximado: cada frase que quepa no se parte', () => {
    // Objetivo pequeño (5) con frases de 3 palabras: una frase por página como mucho.
    const parrafo = 'Uno dos tres. Cuatro cinco seis. Siete ocho nueve.';
    const paginas = paginarCuento(parrafo, 5);
    for (const pagina of paginas) {
      expect(contar(pagina)).toBeLessThanOrEqual(6);
    }
  });
});
