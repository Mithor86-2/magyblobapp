import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import { CATEGORIAS } from '../../domain/vocabulary.js';
import { type AiOp, logPromptEnviado, logRespuestaLlm } from './aiLog.js';
import type { AILogger } from './FallbackProvider.js';
import { parseActivities, parseStory } from './parseResponse.js';
import {
  AI_SETTING_KEYS,
  buildActivitiesPrompt,
  buildStoryPrompt,
  joinPromptParts,
  type PromptOverrides,
} from './prompts.js';
import { readStoryParams, resolveStoryParams, type ResolvedStoryParams } from './storyParams.js';

export interface OllamaProviderOptions {
  baseUrl: string;
  model: string;
  /** Aborta la petición si Ollama tarda más de esto (ms). */
  timeoutMs?: number;
  /** Inyectable en tests; por defecto el `fetch` global de Node. */
  fetchFn?: typeof fetch;
  /** Config en caliente (AppSetting): plantillas y temperatura. Opcional. */
  settings?: SettingsRepository;
  /** Logger para observabilidad de prompts/respuestas (US-34). Opcional. */
  logger?: AILogger;
}

const TEMPERATURA_DEFECTO = 0.7;

/** Esquema de salida estructurada para el cuento (campo `format` de Ollama). */
const ESQUEMA_CUENTO = {
  type: 'object',
  properties: {
    titulo: { type: 'string' },
    cuerpo: { type: 'string' },
  },
  required: ['titulo', 'cuerpo'],
} as const;

const ESQUEMA_ACTIVIDADES = {
  type: 'object',
  properties: {
    actividades: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          categoria: { type: 'string', enum: [...CATEGORIAS] },
          titulo: { type: 'string' },
          descripcion: { type: 'string' },
          instrucciones: { type: 'string' },
          duracionMin: { type: 'integer' },
          nivel: { type: 'integer' },
        },
        required: ['categoria', 'titulo', 'descripcion'],
      },
    },
  },
  required: ['actividades'],
} as const;

/**
 * Proveedor de IA contra un servidor Ollama local (modelo por defecto `gemma:2b`).
 * Usa `POST /api/generate` sin streaming y `format` con un esquema JSON para que
 * el modelo devuelva una estructura parseable de forma fiable.
 *
 * Lanza si Ollama no responde, devuelve un error HTTP o un JSON inválido: de eso
 * se encarga `FallbackProvider`, que cae a `MockProvider` ante cualquier fallo.
 */
export class OllamaProvider implements AIProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly settings?: SettingsRepository;
  private readonly logger?: AILogger;

  constructor(options: OllamaProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.model = options.model;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    this.fetchFn = options.fetchFn ?? fetch;
    this.settings = options.settings;
    this.logger = options.logger;
  }

  async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
    const overrides = await this.leerOverrides(
      AI_SETTING_KEYS.storySystem,
      AI_SETTING_KEYS.storyTemplate,
    );
    const params = await this.leerStoryParams();
    const partes = buildStoryPrompt(input, overrides, params);
    const { system, prompt } = partes;
    const data = await this.generate<{ titulo?: unknown; cuerpo?: unknown }>(
      system,
      prompt,
      ESQUEMA_CUENTO,
      {
        op: 'generateStory',
        config: {
          plantilla: overrides.template ? 'appsetting' : 'defecto',
          systemFuente: overrides.system ? 'appsetting' : 'defecto',
          params: params ?? null,
        },
      },
    );
    return parseStory(data, 'Ollama', 'local', joinPromptParts(partes));
  }

  /** Lee `prompt.story.params` y elige un formato al azar (variación por cuento). */
  private async leerStoryParams(): Promise<ResolvedStoryParams | undefined> {
    if (!this.settings) return undefined;
    const params = await readStoryParams(this.settings);
    return params ? resolveStoryParams(params) : undefined;
  }

  async recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]> {
    const overrides = await this.leerOverrides(
      AI_SETTING_KEYS.activitySystem,
      AI_SETTING_KEYS.activityTemplate,
    );
    const partes = buildActivitiesPrompt(input, overrides);
    const { system, prompt } = partes;
    const data = await this.generate<{ actividades?: unknown }>(
      system,
      prompt,
      ESQUEMA_ACTIVIDADES,
      {
        op: 'recommendActivities',
        config: {
          plantilla: overrides.template ? 'appsetting' : 'defecto',
          systemFuente: overrides.system ? 'appsetting' : 'defecto',
          cantidad: input.cantidad,
          categoria: input.categoria ?? null,
        },
      },
    );
    return parseActivities(data, input.cantidad, 'Ollama', 'local', joinPromptParts(partes));
  }

  /**
   * Ollama no genera imágenes (US-59): la portada se delega a Gemini/Imagen vía el
   * decorador `ImageCapableProvider`. Aquí se devuelve `null` para cumplir la interfaz.
   */
  async generateImage(): Promise<string | null> {
    return null;
  }

  /** Lee de AppSetting los textos de prompt; null/ausente => default en código. */
  private async leerOverrides(
    claveSystem: string,
    claveTemplate: string,
  ): Promise<PromptOverrides> {
    if (!this.settings) return {};
    const [system, template] = await Promise.all([
      this.settings.get(claveSystem),
      this.settings.get(claveTemplate),
    ]);
    return { system, template };
  }

  /** Temperatura desde AppSetting (`story.temperature`) o el default en código. */
  private async leerTemperatura(): Promise<number> {
    const raw = await this.settings?.get(AI_SETTING_KEYS.temperature);
    const parsed = raw === null || raw === undefined ? NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : TEMPERATURA_DEFECTO;
  }

  private async generate<T>(
    system: string,
    prompt: string,
    format: object,
    logCtx: { op: AiOp; config: Record<string, unknown> },
  ): Promise<T> {
    const temperature = await this.leerTemperatura();
    logPromptEnviado(this.logger, {
      op: logCtx.op,
      proveedor: 'local',
      model: this.model,
      temperature,
      config: logCtx.config,
      system,
      prompt,
    });
    const res = await this.fetchFn(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        system,
        prompt,
        stream: false,
        format,
        options: { temperature },
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) {
      throw new Error(`Ollama respondió ${res.status} ${res.statusText}.`);
    }
    const payload = (await res.json()) as { response?: unknown };
    if (typeof payload.response !== 'string') {
      throw new Error('Respuesta de Ollama sin campo "response".');
    }
    try {
      const data = JSON.parse(payload.response) as T;
      logRespuestaLlm(this.logger, logCtx.op, 'local', data);
      return data;
    } catch {
      throw new Error('Ollama devolvió un JSON no parseable.');
    }
  }
}
