import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import { esCloudTarget, type CloudTarget } from './cloudPresets.js';

/** Clave de `AppSetting` con la configuración (no secreta) del modo cloud. */
export const AI_CLOUD_SETTING_KEY = 'ai.cloud';

/**
 * Selección del proveedor cloud, guardada como JSON en `AppSetting.ai.cloud`.
 * Solo selectores **no secretos**: la API key del `target` vive en env.
 */
export interface CloudSetting {
  activo: boolean;
  target: CloudTarget;
  model: string;
}

/**
 * Parsea y valida el JSON de `ai.cloud`. Devuelve `null` (no inválido = no se usa
 * cloud) si falta, no es JSON, o no cumple la forma `{activo, target, model}` con
 * un `target` conocido y un `model` no vacío. Privacidad por defecto: ante la
 * duda, no se activa el cloud.
 */
export function parseCloudSetting(raw: string | null | undefined): CloudSetting | null {
  if (raw === null || raw === undefined || raw.trim() === '') return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const o = data as Record<string, unknown>;
  if (
    typeof o.activo !== 'boolean' ||
    !esCloudTarget(o.target) ||
    typeof o.model !== 'string' ||
    o.model.trim() === ''
  ) {
    return null;
  }
  return { activo: o.activo, target: o.target, model: o.model.trim() };
}

/** Lee `ai.cloud` del repositorio de settings y lo valida. */
export async function readCloudSetting(settings: SettingsRepository): Promise<CloudSetting | null> {
  return parseCloudSetting(await settings.get(AI_CLOUD_SETTING_KEY));
}
