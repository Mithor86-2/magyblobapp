import { z } from 'zod';
import { CLOUD_PRESETS, type CloudTarget } from './infrastructure/ai/cloudPresets.js';
import type { CodigoIdioma } from './domain/value-objects/Idioma.js';

/**
 * Configuración derivada de variables de entorno, con valores por defecto
 * seguros para desarrollo. Centralizada aquí para no leer process.env disperso.
 *
 * La validación/normalización de las variables se hace con un **esquema Zod**
 * (frontera de infraestructura/arranque, nunca en `/domain`): coacciona tipos
 * (puertos y timeouts a número), restringe enums (`AI_PROVIDER`) y, en
 * `NODE_ENV=production`, exige las variables genuinamente **requeridas** (p. ej.
 * `DATABASE_URL`) fallando con un mensaje claro de qué falta o está mal.
 */
export interface Config {
  nodeEnv: string;
  port: number;
  logLevel: string;
  aiProvider: 'mock' | 'local';
  ollamaBaseUrl: string;
  ollamaModel: string;
  /** Tiempo máximo de espera al proveedor de IA antes de caer a mock (ms). */
  aiTimeoutMs: number;
  /**
   * API keys de los proveedores cloud, por `target`, leídas de env (nunca de BD).
   * El modo cloud no se activa por env: se activa desde `AppSetting` (`ai.cloud`),
   * pero la key del target elegido debe estar presente aquí para poder usarlo.
   */
  cloudApiKeys: Partial<Record<CloudTarget, string>>;
  /** Síntesis de voz (ElevenLabs). La API key es secreta y se lee de env. */
  tts: TtsConfig;
  /** Autenticación de la sesión del guardián con JWT (US-45). */
  auth: AuthConfig;
}

export interface AuthConfig {
  /**
   * Secreto de firma de los JWT (env `JWT_SECRET`). Único secreto para access y
   * refresh; los tokens se distinguen por el claim `type` (YAGNI: no se separan
   * secretos/namespaces). En producción **debe** fijarse por env; el valor por
   * defecto es solo para desarrollo/arranque reproducible.
   */
  secret: string;
  /** Vida del access token, p. ej. `15m` (env `JWT_ACCESS_TTL`). */
  accessTtl: string;
  /** Vida del refresh token, p. ej. `7d` (env `JWT_REFRESH_TTL`). */
  refreshTtl: string;
}

/** Secreto JWT por defecto, **solo desarrollo** (igual que el resto de defaults). */
const DEV_JWT_SECRET = 'dev-insecure-jwt-secret-change-me-in-production';

export interface TtsConfig {
  /** `xi-api-key` de ElevenLabs (env `ELEVENT_LABS_API`); `undefined` ⇒ voz nativa. */
  apiKey: string | undefined;
  /** Modelo de síntesis (env `ELEVENLABS_MODEL`). */
  model: string;
  /** Voz por idioma (env `ELEVENLABS_VOICE_ID_ES` / `_EN`). */
  voiceIdByLang: Record<CodigoIdioma, string>;
  /** Timeout de la petición a ElevenLabs en ms (env `ELEVENLABS_TIMEOUT_MS`). */
  timeoutMs: number;
}

/**
 * Voces premade de ElevenLabs por defecto, una por idioma (US-55). Ambas hablan
 * con `eleven_multilingual_v2`; se eligen por idioma para que el timbre encaje en
 * cada lengua. Sobreescribibles por env (`ELEVENLABS_VOICE_ID_ES`/`_EN`) con
 * cualquier `voice_id` de la cuenta — ver `.env.example`.
 */
const VOZ_DEFECTO_ES = 'JBFqnCBsd6RMkjVDRZzb'; // "George" (premade multilingüe)
const VOZ_DEFECTO_EN = '21m00Tcm4TlvDq8ikWAM'; // "Rachel" (premade multilingüe)

/**
 * Sumidero de avisos no fatales emitidos al cargar la config (p. ej. caer al
 * secreto JWT de desarrollo en producción). `loadConfig` los emite por aquí en
 * vez de por `console`/pino directamente, para que el arranque (`index.ts`) y los
 * tests decidan cómo registrarlos sin acoplar la config a un logger.
 */
export type ConfigWarn = (mensaje: string) => void;

/**
 * Aviso de seguridad por defecto: deja constancia en `stderr` con el prefijo
 * `WARNING` cuando no se inyecta un logger.
 */
const avisoPorDefecto: ConfigWarn = (mensaje) => {
  console.warn(`WARNING: ${mensaje}`);
};

/**
 * Coerción tolerante a entero positivo: si el valor está ausente o no es un
 * entero > 0, cae al `default`. Replica el comportamiento histórico de
 * `parsePort` (un `PORT`/timeout inválido no aborta: usa el default).
 */
function enteroPositivoConDefecto(valorDefecto: number): z.ZodType<number> {
  return z.coerce.number().int().positive().catch(valorDefecto).default(valorDefecto);
}

/** Cadena recortada, vacía ⇒ `undefined` (para secretos/IDs opcionales). */
const cadenaOpcional = z
  .string()
  .trim()
  .transform((s) => (s === '' ? undefined : s))
  .optional();

/** Cadena recortada no vacía con default (defaults de desarrollo silenciosos). */
function cadenaConDefecto(valorDefecto: string): z.ZodType<string> {
  return z
    .string()
    .trim()
    .transform((s) => (s === '' ? valorDefecto : s))
    .pipe(z.string().min(1))
    .catch(valorDefecto)
    .default(valorDefecto);
}

/**
 * Esquema de las variables de entorno del backend. Modela cada variable con la
 * misma tolerancia que el código histórico (defaults de desarrollo, coerción de
 * números, enum de `AI_PROVIDER`) y delega en `superRefine` las reglas que solo
 * aplican en producción.
 *
 * `AI_PROVIDER` cae a `mock` si está ausente o fuera de `mock|local` (no es un
 * fallo: el modo por defecto es siempre seguro). `PORT`/timeouts no numéricos
 * caen a su default. Lo que sí es estricto: las variables genuinamente requeridas
 * en producción (ver `superRefine`).
 */
const envSchema = z
  .object({
    NODE_ENV: cadenaConDefecto('development'),
    PORT: enteroPositivoConDefecto(3000),
    LOG_LEVEL: cadenaConDefecto('info'),

    // Capa de IA
    AI_PROVIDER: z.enum(['mock', 'local']).catch('mock').default('mock'),
    OLLAMA_BASE_URL: cadenaConDefecto('http://localhost:11434'),
    OLLAMA_MODEL: cadenaConDefecto('gemma:2b'),
    AI_TIMEOUT_MS: enteroPositivoConDefecto(60_000),

    // Persistencia (requerida en producción; ver superRefine)
    DATABASE_URL: cadenaOpcional,

    // Sesión / JWT (US-45)
    JWT_SECRET: cadenaOpcional,
    JWT_ACCESS_TTL: cadenaConDefecto('15m'),
    JWT_REFRESH_TTL: cadenaConDefecto('7d'),

    // Narración de cuentos (ElevenLabs, US-22)
    ELEVENT_LABS_API: cadenaOpcional,
    ELEVENLABS_MODEL: cadenaConDefecto('eleven_multilingual_v2'),
    ELEVENLABS_VOICE_ID_ES: cadenaConDefecto(VOZ_DEFECTO_ES),
    ELEVENLABS_VOICE_ID_EN: cadenaConDefecto(VOZ_DEFECTO_EN),
    ELEVENLABS_TIMEOUT_MS: enteroPositivoConDefecto(30_000),

    // Claves cloud (todas opcionales; sin la del target activo, se cae a mock/local)
    GROQ_API_KEY: cadenaOpcional,
    GEMINI_API_KEY: cadenaOpcional,
    OPENROUTER_API_KEY: cadenaOpcional,
    CEREBRAS_API_KEY: cadenaOpcional,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    // En producción `DATABASE_URL` es genuinamente requerida: no hay un default
    // seguro (sin BD el backend no funciona) y un fallo opaco más tarde (Prisma)
    // es peor que abortar el arranque con un mensaje claro.
    if (env.DATABASE_URL === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'requerida en producción (URL de conexión a PostgreSQL); está ausente o vacía',
      });
    }
  });

/**
 * Error de configuración: una o más variables requeridas faltan o son inválidas.
 * Lleva el detalle agregado (qué variable y por qué) ya formateado por Zod.
 */
export class ConfigError extends Error {
  constructor(detalle: string) {
    super(`Configuración inválida:\n${detalle}`);
    this.name = 'ConfigError';
  }
}

function leerClavesCloud(env: ParsedEnv): Partial<Record<CloudTarget, string>> {
  const keys: Partial<Record<CloudTarget, string>> = {};
  for (const [target, preset] of Object.entries(CLOUD_PRESETS)) {
    const value = env[preset.apiKeyEnv as keyof ParsedEnv];
    if (typeof value === 'string' && value !== '') {
      keys[target as CloudTarget] = value;
    }
  }
  return keys;
}

type ParsedEnv = z.infer<typeof envSchema>;

/**
 * Resuelve el secreto JWT: en cualquier entorno usa `JWT_SECRET` si está
 * presente. Si falta (incluido `NODE_ENV=production`, como el `docker compose`
 * por defecto), **degrada al secreto de desarrollo con un WARNING** en vez de
 * abortar: así la pila levanta en limpio (requisito duro del DoD). En producción
 * un `JWT_SECRET` ausente o igual al de desarrollo se avisa como inseguro.
 */
function resolverSecretoJwt(env: ParsedEnv, warn: ConfigWarn): string {
  const esProduccion = env.NODE_ENV === 'production';
  if (env.JWT_SECRET === undefined) {
    if (esProduccion) {
      warn(
        'JWT_SECRET ausente en producción: se usa un secreto de desarrollo INSEGURO. ' +
          'Fija JWT_SECRET a un valor largo y aleatorio.',
      );
    }
    return DEV_JWT_SECRET;
  }
  if (esProduccion && env.JWT_SECRET === DEV_JWT_SECRET) {
    warn('JWT_SECRET usa el secreto de desarrollo INSEGURO en producción. Cámbialo.');
  }
  return env.JWT_SECRET;
}

/**
 * Carga y valida la configuración desde variables de entorno con el esquema Zod.
 * Lanza `ConfigError` (mensaje agregado y legible) si una variable requerida
 * falta o es inválida; el arranque (`index.ts`) lo captura y aborta el proceso.
 *
 * @param env  Mapa de variables (por defecto `process.env`); inyectable en tests.
 * @param warn Sumidero de avisos no fatales (por defecto, `console.warn`).
 */
export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  warn: ConfigWarn = avisoPorDefecto,
): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(z.prettifyError(result.error));
  }
  const parsed = result.data;

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    logLevel: parsed.LOG_LEVEL,
    aiProvider: parsed.AI_PROVIDER,
    ollamaBaseUrl: parsed.OLLAMA_BASE_URL,
    ollamaModel: parsed.OLLAMA_MODEL,
    aiTimeoutMs: parsed.AI_TIMEOUT_MS,
    cloudApiKeys: leerClavesCloud(parsed),
    tts: {
      apiKey: parsed.ELEVENT_LABS_API,
      model: parsed.ELEVENLABS_MODEL,
      voiceIdByLang: {
        es: parsed.ELEVENLABS_VOICE_ID_ES,
        en: parsed.ELEVENLABS_VOICE_ID_EN,
      },
      timeoutMs: parsed.ELEVENLABS_TIMEOUT_MS,
    },
    auth: {
      secret: resolverSecretoJwt(parsed, warn),
      accessTtl: parsed.JWT_ACCESS_TTL,
      refreshTtl: parsed.JWT_REFRESH_TTL,
    },
  };
}
