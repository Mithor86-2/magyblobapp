/**
 * Presets de proveedores de IA en la nube. Todos exponen el dialecto
 * **compatible con OpenAI** (`POST {baseUrl}/chat/completions`), así que un único
 * `CloudProvider` parametrizado los cubre todos: cambiar de proveedor es cambiar
 * el `target` en `AppSetting` (clave `ai.cloud`), no el código.
 *
 * Aquí solo vive información **no secreta**: la `baseUrl` y el **nombre** de la
 * variable de entorno que contiene la API key (`apiKeyEnv`). La clave en sí nunca
 * se guarda aquí ni en la base de datos: se lee de `process.env[apiKeyEnv]`
 * (ver `config.ts`). Coherente con la regla de `AppSetting`: secretos en env.
 */
export interface CloudPreset {
  /** Base del endpoint compatible OpenAI (sin barra final). */
  baseUrl: string;
  /** Nombre de la variable de entorno con la API key del proveedor. */
  apiKeyEnv: string;
}

export const CLOUD_PRESETS = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', apiKeyEnv: 'GROQ_API_KEY' },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeyEnv: 'GEMINI_API_KEY',
  },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', apiKeyEnv: 'OPENROUTER_API_KEY' },
  cerebras: { baseUrl: 'https://api.cerebras.ai/v1', apiKeyEnv: 'CEREBRAS_API_KEY' },
} as const satisfies Record<string, CloudPreset>;

export type CloudTarget = keyof typeof CLOUD_PRESETS;

export const CLOUD_TARGETS = Object.keys(CLOUD_PRESETS) as CloudTarget[];

/** Type guard: ¿`value` es un target cloud con preset registrado? */
export function esCloudTarget(value: unknown): value is CloudTarget {
  return typeof value === 'string' && value in CLOUD_PRESETS;
}
