import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import { CATEGORIAS, type Categoria } from '../../domain/vocabulary.js';
import { buildActivitiesPrompt, buildStoryPrompt, type PromptOverrides } from './prompts.js';

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

/** Claves de AppSetting que consume la generación de cuentos/actividades. */
const CLAVES = {
  storySystem: 'prompt.story.system',
  storyTemplate: 'prompt.story.template',
  activitySystem: 'prompt.activity.system',
  activityTemplate: 'prompt.activity.template',
  temperature: 'story.temperature',
} as const;

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
    const overrides = await this.leerOverrides(CLAVES.storySystem, CLAVES.storyTemplate);
    const { system, prompt } = buildStoryPrompt(input, overrides);
    const data = await this.generate<{ titulo?: unknown; cuerpo?: unknown }>(
      system,
      prompt,
      ESQUEMA_CUENTO,
    );
    const titulo = typeof data.titulo === 'string' ? data.titulo.trim() : '';
    const cuerpo = typeof data.cuerpo === 'string' ? data.cuerpo.trim() : '';
    if (titulo === '' || cuerpo === '') {
      throw new Error('Ollama devolvió un cuento sin título o sin cuerpo.');
    }
    return { titulo, cuerpo };
  }

  async recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]> {
    const overrides = await this.leerOverrides(CLAVES.activitySystem, CLAVES.activityTemplate);
    const { system, prompt } = buildActivitiesPrompt(input, overrides);
    const data = await this.generate<{ actividades?: unknown }>(
      system,
      prompt,
      ESQUEMA_ACTIVIDADES,
    );
    const crudas = Array.isArray(data.actividades) ? data.actividades : [];
    const actividades = crudas
      .map((a) => this.parseActividad(a))
      .filter((a): a is GeneratedActivity => a !== null);
    if (actividades.length === 0) {
      throw new Error('Ollama no devolvió ninguna actividad válida.');
    }
    return actividades.slice(0, input.cantidad);
  }

  private parseActividad(raw: unknown): GeneratedActivity | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const o = raw as Record<string, unknown>;
    const categoria = o.categoria;
    if (
      typeof categoria !== 'string' ||
      !(CATEGORIAS as readonly string[]).includes(categoria) ||
      typeof o.titulo !== 'string' ||
      typeof o.descripcion !== 'string' ||
      o.titulo.trim() === '' ||
      o.descripcion.trim() === ''
    ) {
      return null;
    }
    return {
      categoria: categoria as Categoria,
      titulo: o.titulo.trim(),
      descripcion: o.descripcion.trim(),
      duracionMin: typeof o.duracionMin === 'number' ? o.duracionMin : undefined,
      nivel: typeof o.nivel === 'number' ? o.nivel : undefined,
    };
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
    const raw = await this.settings?.get(CLAVES.temperature);
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
