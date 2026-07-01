import { readFileSync } from 'node:fs';
import { z } from 'zod';

/**
 * Lógica **pura** de la configuración versionada (`AppSetting`) desde
 * `prisma/app-settings.json` (US-68): validación/normalización del JSON, carga del
 * fichero y la decisión de sync por versión. La orquestación con BD vive en
 * `syncAppSettings.ts` (IO, cubierta por `test:integration`). El JSON NO contiene
 * secretos (las API keys y `DATABASE_URL` siguen en variables de entorno).
 */

/** Entrada de configuración ya validada: `value` normalizado a texto para la BD. */
export interface AppSettingEntry {
  key: string;
  version: number;
  value: string;
  descripcion?: string;
}

/** Acción del sync para una clave, según su versión en JSON vs. la aplicada en BD. */
export type AccionSync = 'crear' | 'actualizar' | 'omitir';

/**
 * Normaliza el `value` del JSON a la cadena que guarda la BD: los strings se dejan
 * igual; number/boolean se convierten con `String`; objetos y arrays se serializan
 * con `JSON.stringify` (así `ai.cloud`/`prompt.story.params` se declaran como JSON
 * legible en el fichero en vez de como texto escapado).
 */
const valueSchema = z
  .union([
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.string(), z.unknown()),
    z.array(z.unknown()),
  ])
  .transform((v) => {
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  });

const entrySchema = z.object({
  key: z.string().trim().min(1),
  version: z.number().int().min(1),
  value: valueSchema,
  descripcion: z.string().trim().min(1).optional(),
});

const fileSchema = z.object({ settings: z.array(entrySchema).min(1) });

/**
 * Valida y normaliza el contenido del JSON de configuración. Lanza `ZodError` si la
 * forma es inválida (clave vacía, versión no entera ≥1, `value` de tipo no admitido).
 */
export function parseAppSettings(data: unknown): AppSettingEntry[] {
  return fileSchema.parse(data).settings;
}

/**
 * Lee y valida `prisma/app-settings.json`. La ruta se resuelve relativa a este
 * módulo, de modo que funciona igual en desarrollo (`src/…` con tsx) y en la imagen
 * (`dist/…` con `prisma/` copiado junto a `dist/`).
 */
export function loadAppSettingsJson(): AppSettingEntry[] {
  const url = new URL('../../../prisma/app-settings.json', import.meta.url);
  return parseAppSettings(JSON.parse(readFileSync(url, 'utf8')));
}

/**
 * Decide qué hacer con una clave: `crear` si no existe en BD; `actualizar` si la
 * versión del JSON supera a la aplicada; `omitir` si es igual o menor (preserva el
 * valor actual, incluidos los cambios hechos en caliente). Función pura (US-68).
 */
export function decidirAccion(jsonVersion: number, dbVersion: number | null): AccionSync {
  if (dbVersion === null) return 'crear';
  return jsonVersion > dbVersion ? 'actualizar' : 'omitir';
}
