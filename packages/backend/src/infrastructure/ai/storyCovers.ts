import { z } from 'zod';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import type { StoryCoverCatalog } from '../../domain/repositories/StoryCoverCatalog.js';
import { esEstilo, esTema, type Estilo, type Tema } from '../../domain/vocabulary.js';

/** Clave de `AppSetting` con la lista de portadas de cuento configurables (US-101). */
export const STORY_COVERS_SETTING_KEY = 'story.covers';

/**
 * Entrada de la lista `story.covers`: el **nombre** de una imagen empaquetada en la app y
 * el tema/estilo al que aplica. Ambos opcionales: una entrada solo-tema es respaldo del
 * tema, una solo-estilo respaldo del estilo, y tema+estilo la más específica (US-101).
 */
export interface StoryCover {
  imagen: string;
  tema?: Tema;
  estilo?: Estilo;
}

/** Esquema de una entrada; `tema`/`estilo` se validan luego contra el vocabulario cerrado. */
const storyCoverSchema = z.object({
  imagen: z.string().min(1),
  tema: z.string().optional(),
  estilo: z.string().optional(),
});

/**
 * Parsea y sanea `story.covers`: JSON array; descarta entradas sin `imagen` o con
 * `tema`/`estilo` fuera del vocabulario. Devuelve `[]` si falta, no es JSON o no cumple la
 * forma (comportamiento seguro: sin portada configurada ⇒ la app usa su respaldo por tema).
 */
export function parseStoryCovers(raw: string | null | undefined): StoryCover[] {
  if (raw === null || raw === undefined || raw.trim() === '') return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const result = z.array(storyCoverSchema).safeParse(data);
  if (!result.success) return [];
  return result.data
    .filter(
      (c) =>
        (c.tema === undefined || esTema(c.tema)) && (c.estilo === undefined || esEstilo(c.estilo)),
    )
    .map((c) => ({
      imagen: c.imagen,
      tema: c.tema as Tema | undefined,
      estilo: c.estilo as Estilo | undefined,
    }));
}

/**
 * Elige la portada que aplica a `(tema, estilo)` con prioridad de más a menos específica:
 * **tema+estilo → tema → estilo → `null`**. `null` = ninguna configurada (respaldo local).
 */
export function pickCover(covers: StoryCover[], tema: Tema, estilo: Estilo): string | null {
  const exacta = covers.find((c) => c.tema === tema && c.estilo === estilo);
  if (exacta) return exacta.imagen;
  const porTema = covers.find((c) => c.tema === tema && c.estilo === undefined);
  if (porTema) return porTema.imagen;
  const porEstilo = covers.find((c) => c.estilo === estilo && c.tema === undefined);
  if (porEstilo) return porEstilo.imagen;
  return null;
}

/** Lee y sanea `story.covers` del repositorio de settings. */
export async function readStoryCovers(settings: SettingsRepository): Promise<StoryCover[]> {
  return parseStoryCovers(await settings.get(STORY_COVERS_SETTING_KEY));
}

/**
 * Implementación del puerto `StoryCoverCatalog` (US-101): lee `story.covers` de la
 * configuración en caliente y resuelve la portada por tema/estilo con `pickCover`.
 */
export class SettingsStoryCoverCatalog implements StoryCoverCatalog {
  constructor(private readonly settings: SettingsRepository) {}

  async pick(tema: Tema, estilo: Estilo): Promise<string | null> {
    return pickCover(await readStoryCovers(this.settings), tema, estilo);
  }
}
