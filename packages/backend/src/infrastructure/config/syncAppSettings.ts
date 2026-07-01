import type { PrismaClient } from '../db/prismaClient.js';
import { decidirAccion, loadAppSettingsJson, type AppSettingEntry } from './appSettings.js';

/**
 * Orquestación con BD del sync **versionado** de la configuración (`AppSetting`,
 * US-70). Aplica la fuente única `prisma/app-settings.json`: crea las claves
 * ausentes y reescribe una clave solo cuando la versión del JSON es **mayor** que la
 * aplicada, de modo que **no pisa** los cambios hechos en caliente (p. ej.
 * `ai.cloud`). Es IO de base de datos: se ejercita en `test:integration` (Postgres
 * real), no en el run unitario. La lógica pura (validación/decisión) vive en
 * `appSettings.ts`.
 */

/** Resumen del sync: qué claves se crearon/actualizaron/omitieron y cuáles quedaron huérfanas. */
export interface SyncSummary {
  creadas: string[];
  actualizadas: string[];
  omitidas: string[];
  /** Claves presentes en la BD pero ausentes del JSON: se conservan (no se borran). */
  huerfanas: string[];
}

/** Sink de log mínimo (compatible con `console` y con el logger de Fastify/pino). */
export interface SyncLogger {
  info: (mensaje: string) => void;
}

/**
 * Aplica la configuración del JSON a la tabla `AppSetting` de forma versionada e
 * idempotente y devuelve un resumen. Las claves de la BD ausentes del JSON se
 * **conservan** y se listan como huérfanas (sin borrado silencioso). Es el mecanismo
 * de "migraciones/actualizaciones de configuración" del arranque y de `config:sync`.
 */
export async function syncAppSettings(
  prisma: PrismaClient,
  settings: AppSettingEntry[] = loadAppSettingsJson(),
  log: SyncLogger = console,
): Promise<SyncSummary> {
  const summary: SyncSummary = { creadas: [], actualizadas: [], omitidas: [], huerfanas: [] };
  const clavesJson = new Set(settings.map((s) => s.key));

  for (const s of settings) {
    const row = await prisma.appSetting.findUnique({
      where: { key: s.key },
      select: { version: true },
    });
    const accion = decidirAccion(s.version, row?.version ?? null);
    if (accion === 'crear') {
      await prisma.appSetting.create({
        data: { key: s.key, value: s.value, descripcion: s.descripcion, version: s.version },
      });
      summary.creadas.push(s.key);
    } else if (accion === 'actualizar') {
      await prisma.appSetting.update({
        where: { key: s.key },
        data: { value: s.value, descripcion: s.descripcion, version: s.version },
      });
      summary.actualizadas.push(s.key);
    } else {
      summary.omitidas.push(s.key);
    }
  }

  const todas = await prisma.appSetting.findMany({ select: { key: true } });
  summary.huerfanas = todas.map((r) => r.key).filter((k) => !clavesJson.has(k));

  log.info(
    `config sync (AppSetting): ${summary.creadas.length} creadas, ` +
      `${summary.actualizadas.length} actualizadas, ${summary.omitidas.length} omitidas, ` +
      `${summary.huerfanas.length} huérfanas.`,
  );
  return summary;
}
