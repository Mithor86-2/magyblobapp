/**
 * Puerto de configuración ajustable en caliente (tabla AppSetting). Devuelve
 * texto; el llamador parsea/aplica el valor por defecto en código si falta la
 * clave. Los secretos NO se leen de aquí (van en variables de entorno).
 */
export interface SettingsRepository {
  get(key: string): Promise<string | null>;
}
