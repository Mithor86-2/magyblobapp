import type { GeneratedActivity, GeneratedStory } from '../../domain/ai/AIProvider.js';
import { CATEGORIAS, type Categoria, type ProveedorIa } from '../../domain/vocabulary.js';

/**
 * Parseo y saneo de la salida JSON de un LLM, compartido por `OllamaProvider` y
 * `CloudProvider`: ambos reciben un objeto ya parseado y deben validar/sanear lo
 * mismo (un LLM pequeño inventa números fuera de rango o categorías inexistentes).
 * `fuente` solo se usa para el mensaje de error (qué proveedor falló); `proveedor`
 * es el valor efectivo que se estampa en el resultado (`local` | `cloud`).
 */

export function parseStory(
  data: { titulo?: unknown; cuerpo?: unknown },
  fuente: string,
  proveedor: ProveedorIa,
): GeneratedStory {
  const titulo = typeof data.titulo === 'string' ? data.titulo.trim() : '';
  const cuerpo = typeof data.cuerpo === 'string' ? data.cuerpo.trim() : '';
  if (titulo === '' || cuerpo === '') {
    throw new Error(`${fuente} devolvió un cuento sin título o sin cuerpo.`);
  }
  return { titulo, cuerpo, proveedor };
}

export function parseActivities(
  data: { actividades?: unknown },
  cantidad: number,
  fuente: string,
  proveedor: ProveedorIa,
): GeneratedActivity[] {
  const crudas = Array.isArray(data.actividades) ? data.actividades : [];
  const actividades = crudas
    .map((raw) => parseActividad(raw, proveedor))
    .filter((a): a is GeneratedActivity => a !== null);
  if (actividades.length === 0) {
    throw new Error(`${fuente} no devolvió ninguna actividad válida.`);
  }
  return actividades.slice(0, cantidad);
}

function parseActividad(raw: unknown, proveedor: ProveedorIa): GeneratedActivity | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const categoria = o.categoria;
  if (
    typeof categoria !== 'string' ||
    !(CATEGORIAS as readonly string[]).includes(categoria) ||
    typeof o.titulo !== 'string' ||
    typeof o.descripcion !== 'string' ||
    o.titulo.trim() === '' ||
    o.descripcion.trim() === ''
  ) {
    return null;
  }
  return {
    categoria: categoria as Categoria,
    titulo: o.titulo.trim(),
    descripcion: o.descripcion.trim(),
    // El LLM a veces inventa números fuera de rango (p. ej. nivel 1000):
    // saneamos a rangos sensatos y descartamos lo no válido.
    duracionMin: enteroEnRango(o.duracionMin, 1, 60),
    nivel: enteroEnRango(o.nivel, 1, 3),
    proveedor,
  };
}

/** Entero dentro de `[min, max]`, o `undefined` si no lo es (descarta basura del LLM). */
function enteroEnRango(value: unknown, min: number, max: number): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : undefined;
}
