/**
 * Trocea el cuerpo de un cuento en **páginas de libro** (A2/US-73, A1/US-74) para
 * leerlo pasando página en lugar de en un bloque único. Es lógica **pura** (sin UI
 * ni IO): la usa `StoryReaderScreen` a través de `BookPages`.
 *
 * Reglas de paginado, pensadas para respetar la prosa del cuento:
 * - **Respeta los cortes de la IA** (A1/US-74): se separa primero por párrafos
 *   (líneas / dobles saltos), que son las unidades de página que entrega la IA.
 *   Cada párrafo que quepa en el objetivo (`palabrasPorPagina`) ocupa una página.
 * - Un párrafo más largo se reparte por frases (corte en `. `) acumulando frases
 *   hasta acercarse al objetivo, para no partir a mitad de una idea.
 * - **Garantiza un mínimo de páginas** (`minPaginas`, A1/US-74): si tras respetar
 *   los cortes hay menos páginas de las pedidas y aún queda contenido divisible, se
 *   subdivide por frases la página más larga (repetidamente) hasta alcanzar el
 *   mínimo o hasta que ninguna página se pueda partir más (una página de una sola
 *   frase no se parte).
 * - Un cuerpo vacío devuelve `['']` (una página en blanco, indicador "1/1") y **no**
 *   se intenta rellenar hasta el mínimo: sin contenido no hay nada que paginar.
 */
export function paginarCuento(cuerpo: string, palabrasPorPagina = 120, minPaginas = 4): string[] {
  const parrafos = cuerpo
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parrafos.length === 0) return [''];

  const paginas: string[] = [];
  for (const parrafo of parrafos) {
    if (contarPalabras(parrafo) <= palabrasPorPagina) {
      paginas.push(parrafo);
      continue;
    }
    paginas.push(...paginarParrafo(parrafo, palabrasPorPagina));
  }

  return garantizarMinimo(paginas.length > 0 ? paginas : [''], minPaginas);
}

/**
 * Asegura al menos `minPaginas` páginas subdividiendo por frases la página más larga
 * mientras se pueda (una página de una sola frase ya no se parte). Uso interno.
 */
function garantizarMinimo(paginas: string[], minPaginas: number): string[] {
  let resultado = paginas;
  while (resultado.length < minPaginas) {
    // Índice de la página más larga (por nº de palabras) que aún se puede partir.
    let idx = -1;
    let maxPalabras = 0;
    for (let i = 0; i < resultado.length; i++) {
      const palabras = contarPalabras(resultado[i]!);
      if (palabras > maxPalabras && contarFrases(resultado[i]!) > 1) {
        maxPalabras = palabras;
        idx = i;
      }
    }
    if (idx === -1) break; // ninguna página es divisible: no se puede llegar al mínimo

    // Parte esa página en dos mitades (por frases, aproximadamente por la mitad).
    const trozos = partirPorLaMitad(resultado[idx]!);
    resultado = [...resultado.slice(0, idx), ...trozos, ...resultado.slice(idx + 1)];
  }
  return resultado;
}

/**
 * Reparte un párrafo largo en varias páginas cortando por frases (`. `) y
 * acumulando hasta aproximarse a `palabrasPorPagina`. Uso interno de `paginarCuento`.
 */
function paginarParrafo(parrafo: string, palabrasPorPagina: number): string[] {
  const frases = separarFrases(parrafo);

  const paginas: string[] = [];
  let actual = '';
  for (const frase of frases) {
    const candidata = actual ? `${actual} ${frase}` : frase;
    if (actual && contarPalabras(candidata) > palabrasPorPagina) {
      paginas.push(actual);
      actual = frase;
    } else {
      actual = candidata;
    }
  }
  if (actual) paginas.push(actual);
  return paginas;
}

/** Parte una página en dos por frases, dejando la primera mitad de las frases en cada trozo. */
function partirPorLaMitad(pagina: string): string[] {
  const frases = separarFrases(pagina);
  if (frases.length <= 1) return [pagina];
  const corte = Math.ceil(frases.length / 2);
  return [frases.slice(0, corte).join(' '), frases.slice(corte).join(' ')];
}

/** Separa un texto en frases conservando el punto de cada una (corte en ". "). */
function separarFrases(texto: string): string[] {
  return texto
    .split(/(?<=\.)\s+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

/** Cuenta las frases de un texto (unidades separables por ". "). */
function contarFrases(texto: string): number {
  return separarFrases(texto).length;
}

/** Cuenta palabras de un texto (tokens separados por espacios en blanco). */
function contarPalabras(texto: string): number {
  const t = texto.trim();
  return t === '' ? 0 : t.split(/\s+/).length;
}
