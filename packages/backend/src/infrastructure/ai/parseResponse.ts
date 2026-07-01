import { z } from 'zod';
import type { GeneratedActivity, GeneratedStory } from '../../domain/ai/AIProvider.js';
import { CATEGORIAS, type ProveedorIa } from '../../domain/vocabulary.js';

/**
 * Parseo y saneo de la salida JSON de un LLM, compartido por `OllamaProvider` y
 * `CloudProvider`: ambos reciben un objeto ya parseado y deben validar/sanear lo
 * mismo (un LLM pequeño inventa números fuera de rango o categorías inexistentes).
 * `fuente` solo se usa para el mensaje de error (qué proveedor falló); `proveedor`
 * es el valor efectivo que se estampa en el resultado (`local` | `cloud`).
 *
 * La validación se declara con Zod (esquemas abajo) en lugar de chequeos `typeof`
 * imperativos: el comportamiento es **sanear, no solo rechazar** (recorta espacios,
 * descarta números fuera de rango a `undefined` y categorías inexistentes).
 */

/** Texto saneado: recorta espacios; lo no-string cuenta como vacío; exige no vacío. */
const textoNoVacio = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim() : ''),
  z.string().min(1),
);

/** Texto opcional saneado: recorta; lo no-string o vacío queda como `undefined`. */
const textoOpcional = z.preprocess((v) => {
  const t = typeof v === 'string' ? v.trim() : '';
  return t === '' ? undefined : t;
}, z.string().optional());

/**
 * Entero dentro de `[min, max]`, o `undefined` si no lo es (descarta basura del LLM).
 * Clave opcional: si falta, `undefined`; si está con basura, también `undefined`.
 */
const enteroEnRango = (min: number, max: number) =>
  z
    .unknown()
    .transform((v) =>
      typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : undefined,
    )
    .optional();

const storySchema = z.object({ titulo: textoNoVacio, cuerpo: textoNoVacio });

/** Valida y normaliza la respuesta del LLM en un `GeneratedStory` (lanza si falta título o cuerpo). */
export function parseStory(
  data: { titulo?: unknown; cuerpo?: unknown },
  fuente: string,
  proveedor: ProveedorIa,
  /** Prompt realmente enviado (system + user) para trazabilidad (US-61). */
  prompt: string,
): GeneratedStory {
  const result = storySchema.safeParse(data);
  if (!result.success) {
    throw new Error(`${fuente} devolvió un cuento sin título o sin cuerpo.`);
  }
  return { ...result.data, proveedor, prompt };
}

const actividadSchema = z.object({
  categoria: z.enum(CATEGORIAS),
  titulo: textoNoVacio,
  descripcion: textoNoVacio,
  // Paso a paso opcional (US-54): si el LLM no lo da, queda undefined.
  instrucciones: textoOpcional,
  // El LLM a veces inventa números fuera de rango (p. ej. nivel 1000):
  // saneamos a rangos sensatos y descartamos lo no válido.
  duracionMin: enteroEnRango(1, 60),
  nivel: enteroEnRango(1, 3),
});

/** Valida y normaliza la respuesta del LLM en una lista de `GeneratedActivity` (sanea rangos, descarta inválidas). */
export function parseActivities(
  data: { actividades?: unknown },
  cantidad: number,
  fuente: string,
  proveedor: ProveedorIa,
  /** Prompt realmente enviado (system + user) para trazabilidad (US-61). */
  prompt: string,
): GeneratedActivity[] {
  const crudas = Array.isArray(data.actividades) ? data.actividades : [];
  const actividades = crudas
    .map((raw) => parseActividad(raw, proveedor, prompt))
    .filter((a): a is GeneratedActivity => a !== null);
  if (actividades.length === 0) {
    throw new Error(`${fuente} no devolvió ninguna actividad válida.`);
  }
  return actividades.slice(0, cantidad);
}

function parseActividad(
  raw: unknown,
  proveedor: ProveedorIa,
  prompt: string,
): GeneratedActivity | null {
  const result = actividadSchema.safeParse(raw);
  return result.success ? { ...result.data, proveedor, prompt } : null;
}
