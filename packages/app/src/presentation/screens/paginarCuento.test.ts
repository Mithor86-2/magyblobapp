import { describe, expect, it } from 'vitest';
import { paginarCuento } from './paginarCuento';

/**
 * A2/US-73 + A1/US-74: paginado del cuerpo del cuento en páginas de libro. Es lógica
 * pura: respeta los cortes de párrafo de la IA (una línea en blanco = una página),
 * reparte párrafos largos por frases sin superar mucho el objetivo de palabras,
 * garantiza un mínimo de páginas cuando hay contenido divisible, y siempre devuelve
 * al menos una página.
 */
const contar = (t: string) => (t.trim() === '' ? 0 : t.trim().split(/\s+/).length);

describe('paginarCuento (A2/US-73, A1/US-74)', () => {
  it('respeta los cortes \\n\\n: un párrafo por página cuando cada uno cabe (minPaginas=1)', () => {
    const cuerpo = 'Primer párrafo corto.\n\nSegundo párrafo corto.\nTercero.';
    const paginas = paginarCuento(cuerpo, 60, 1);
    expect(paginas).toEqual(['Primer párrafo corto.', 'Segundo párrafo corto.', 'Tercero.']);
  });

  it('A1/US-74: un cuento en ≥4 párrafos da ≥4 páginas respetando los cortes', () => {
    const cuerpo =
      'Había una vez un dragón.\n\n' +
      'Un día salió a volar.\n\n' +
      'Encontró a un amigo búho.\n\n' +
      'Juntos vieron el amanecer.\n\n' +
      'Y volvieron felices a casa.';
    const paginas = paginarCuento(cuerpo);
    expect(paginas).toEqual([
      'Había una vez un dragón.',
      'Un día salió a volar.',
      'Encontró a un amigo búho.',
      'Juntos vieron el amanecer.',
      'Y volvieron felices a casa.',
    ]);
  });

  it('A1/US-74: garantiza ≥4 páginas subdividiendo cuando hay pocos párrafos', () => {
    // Un solo párrafo con muchas frases: se reparte hasta alcanzar el mínimo de 4.
    const cuerpo =
      'El zorro corría muy rápido. La liebre saltaba sin parar. El búho miraba desde arriba. ' +
      'El río sonaba con calma. Todos volvieron a casa contentos. Y durmieron muy felices.';
    const paginas = paginarCuento(cuerpo);
    expect(paginas.length).toBeGreaterThanOrEqual(4);
    // No se pierde texto al subdividir.
    const unido = paginas.join(' ');
    expect(unido).toContain('El zorro corría muy rápido.');
    expect(unido).toContain('Y durmieron muy felices.');
  });

  it('un párrafo largo se reparte por frases en varias páginas', () => {
    // Cinco frases de ~5 palabras (25 en total); con objetivo 10 → ~3 páginas.
    const parrafo =
      'El zorro corría muy rápido. La liebre saltaba sin parar. El búho miraba desde arriba. ' +
      'El río sonaba con calma. Todos volvieron a casa.';
    const paginas = paginarCuento(parrafo, 10, 1);
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

  it('un cuerpo de una sola frase sin puntos no se puede partir: queda en una página', () => {
    // Sin frases divisibles no se alcanza el mínimo (no se inventa contenido).
    const paginas = paginarCuento('Había una vez un dragón amable', 60);
    expect(paginas).toEqual(['Había una vez un dragón amable']);
  });

  it('cuerpo vacío devuelve una única página en blanco (no se rellena al mínimo)', () => {
    expect(paginarCuento('')).toEqual(['']);
    expect(paginarCuento('   \n\n  ')).toEqual(['']);
  });

  it('siempre devuelve al menos una página', () => {
    expect(paginarCuento('Solo esto.').length).toBeGreaterThanOrEqual(1);
  });

  it('US-97: con el objetivo por defecto (60) ninguna página supera 60 palabras', () => {
    // Cuerpo largo en varios párrafos, algunos claramente por encima de 60 palabras,
    // para forzar el reparto por frases. Con el objetivo por defecto (~60), cada página
    // debe caber en el alto mínimo de la hoja del lector sin recortar la última línea.
    const frase = 'El pequeño dragón sobrevoló el valle buscando a su amigo el búho sabio.';
    const parrafoLargo = Array.from({ length: 8 }, () => frase).join(' ');
    const cuerpo = `${parrafoLargo}\n\n${parrafoLargo}\n\n${parrafoLargo}`;

    const paginas = paginarCuento(cuerpo);

    for (const pagina of paginas) {
      expect(contar(pagina)).toBeLessThanOrEqual(60);
    }
    // No se pierde texto al trocear: la primera y la última frase siguen presentes.
    const unido = paginas.join(' ');
    expect(unido).toContain(frase);
  });

  it('respeta el límite aproximado: cada frase que quepa no se parte', () => {
    // Objetivo pequeño (5) con frases de 3 palabras: una frase por página como mucho.
    const parrafo = 'Uno dos tres. Cuatro cinco seis. Siete ocho nueve.';
    const paginas = paginarCuento(parrafo, 5, 1);
    for (const pagina of paginas) {
      expect(contar(pagina)).toBeLessThanOrEqual(6);
    }
  });
});
