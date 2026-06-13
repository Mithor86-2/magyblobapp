import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import { CATEGORIAS } from '../../domain/vocabulary.js';
import { parseActivities, parseStory } from './parseResponse.js';
import {
  AI_SETTING_KEYS,
  buildActivitiesPrompt,
  buildStoryPrompt,
  type PromptOverrides,
} from './prompts.js';

export interface OllamaProviderOptions {
  baseUrl: string;
  model: string;
  /** Aborta la petición si Ollama tarda más de esto (ms). */
  timeoutMs?: number;
  /** Inyectable en tests; por defecto el `fetch` global de Node. */
  fetchFn?: typeof fetch;
  /** Config en caliente (AppSetting): plantillas y temperatura. Opcional. */
  settings?: SettingsRepository;
}

const TEMPERATURA_DEFECTO = 0.8;

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

  constructor(options: OllamaProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.model = options.model;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    this.fetchFn = options.fetchFn ?? fetch;
    this.settings = options.settings;
  }

  async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
    const overrides = await this.leerOverrides(
      AI_SETTING_KEYS.storySystem,
      AI_SETTING_KEYS.storyTemplate,
    );
    const { system, prompt } = buildStoryPrompt(input, overrides);
    const data = await this.generate<{ titulo?: unknown; cuerpo?: unknown }>(
      system,
      prompt,
      ESQUEMA_CUENTO,
    );
    return parseStory(data, 'Ollama', 'local');
  }

  async recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]> {
    const overrides = await this.leerOverrides(
      AI_SETTING_KEYS.activitySystem,
      AI_SETTING_KEYS.activityTemplate,
    );
    const { system, prompt } = buildActivitiesPrompt(input, overrides);
    const data = await this.generate<{ actividades?: unknown }>(
      system,
      prompt,
      ESQUEMA_ACTIVIDADES,
    );
    return parseActivities(data, input.cantidad, 'Ollama', 'local');
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

  private async generate<T>(system: string, prompt: string, format: object): Promise<T> {
    const temperature = await this.leerTemperatura();
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
      return JSON.parse(payload.response) as T;
    } catch {
      throw new Error('Ollama devolvió un JSON no parseable.');
    }
  }
}
