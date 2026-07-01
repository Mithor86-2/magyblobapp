import { z } from 'zod';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';

/** Clave de `AppSetting` con los parámetros configurables de generación de cuentos. */
export const STORY_PARAMS_SETTING_KEY = 'prompt.story.params';

/** Formatos narrativos entre los que se elige (variación dinámica por cuento). */
export const FORMATOS_CUENTO = ['cuento', 'fabula', 'poema', 'adivinanza'] as const;
export type FormatoCuento = (typeof FORMATOS_CUENTO)[number];

/** Type guard: ¿`value` es un formato de cuento válido? */
export function esFormatoCuento(value: unknown): value is FormatoCuento {
  return typeof value === 'string' && (FORMATOS_CUENTO as readonly string[]).includes(value);
}

/**
 * Parámetros que afinan el prompt del cuento, configurables en caliente vía
 * `AppSetting` (clave `prompt.story.params`, JSON). `formatos` es la lista de la
 * que se **elige uno al azar** en cada generación, para dar dinámica al cuento.
 */
export interface StoryParams {
  palabrasMin: number;
  palabrasMax: number;
  /** Si el cuento debe rimar. */
  rima: boolean;
  /** Formatos candidatos; se elige uno por generación. */
  formatos: FormatoCuento[];
}

/** Parámetros ya resueltos para una generación concreta (un único `formato`). */
export interface ResolvedStoryParams {
  palabrasMin: number;
  palabrasMax: number;
  rima: boolean;
  formato: FormatoCuento;
}

/**
 * Esquema de `prompt.story.params`: límites enteros positivos con `min <= max`,
 * `rima` booleana y `formatos` no vacío tras filtrar al vocabulario y deduplicar.
 */
const storyParamsSchema = z
  .object({
    palabrasMin: z.number().int().positive(),
    palabrasMax: z.number().int().positive(),
    rima: z.boolean(),
    formatos: z.array(z.unknown()).transform((arr) => [...new Set(arr.filter(esFormatoCuento))]),
  })
  .refine((o) => o.palabrasMax >= o.palabrasMin)
  .refine((o) => o.formatos.length > 0);

/**
 * Parsea y valida el JSON de `prompt.story.params`. Devuelve `null` (no inválido =
 * comportamiento por defecto, sin bloque de formato) si falta, no es JSON o no cumple
 * la forma esperada. Sanea: límites enteros positivos con `min <= max` y `formatos`
 * no vacío con valores del vocabulario.
 */
export function parseStoryParams(raw: string | null | undefined): StoryParams | null {
  if (raw === null || raw === undefined || raw.trim() === '') return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = storyParamsSchema.safeParse(data);
  return result.success ? result.data : null;
}

/** Lee y valida `prompt.story.params` del repositorio de settings. */
export async function readStoryParams(settings: SettingsRepository): Promise<StoryParams | null> {
  return parseStoryParams(await settings.get(STORY_PARAMS_SETTING_KEY));
}

/**
 * Resuelve los parámetros para una generación: **elige un formato al azar** de la
 * lista (variación dinámica). `rng` inyectable para tests deterministas.
 */
export function resolveStoryParams(
  params: StoryParams,
  rng: () => number = Math.random,
): ResolvedStoryParams {
  const i = Math.min(params.formatos.length - 1, Math.floor(rng() * params.formatos.length));
  return {
    palabrasMin: params.palabrasMin,
    palabrasMax: params.palabrasMax,
    rima: params.rima,
    formato: params.formatos[i]!,
  };
}
