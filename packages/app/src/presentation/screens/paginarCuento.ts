/**
 * Trocea el cuerpo de un cuento en **páginas de libro** (A2/US-73) para leerlo
 * pasando página en lugar de en un bloque único. Es lógica **pura** (sin UI ni IO):
 * la usa `StoryReaderScreen` a través de `BookPages`.
 *
 * Reglas de paginado, pensadas para respetar la prosa del cuento:
 * - Se separa primero por párrafos (líneas / dobles saltos), que son las unidades
 *   naturales de lectura.
 * - Un párrafo que quepa en el objetivo (`palabrasPorPagina`) ocupa una página.
 * - Un párrafo más largo se reparte por frases (corte en `. `) acumulando frases
 *   hasta acercarse al objetivo, para no partir a mitad de una idea.
 * - Siempre devuelve al menos una página; un cuerpo vacío devuelve `['']` para que
 *   el lector muestre una página en blanco (indicador "1/1") en vez de nada.
 */
export function paginarCuento(cuerpo: string, palabrasPorPagina = 60): string[] {
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
  return paginas.length > 0 ? paginas : [''];
}

/**
 * Reparte un párrafo largo en varias páginas cortando por frases (`. `) y
 * acumulando hasta aproximarse a `palabrasPorPagina`. Uso interno de `paginarCuento`.
 */
function paginarParrafo(parrafo: string, palabrasPorPagina: number): string[] {
  // Conserva el punto de cada frase al partir por ". ".
  const frases = parrafo
    .split(/(?<=\.)\s+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

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

/** Cuenta palabras de un texto (tokens separados por espacios en blanco). */
function contarPalabras(texto: string): number {
  const t = texto.trim();
  return t === '' ? 0 : t.split(/\s+/).length;
}
