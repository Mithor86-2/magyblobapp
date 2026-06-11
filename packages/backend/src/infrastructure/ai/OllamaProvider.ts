import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';
import { CATEGORIAS, type Categoria } from '../../domain/vocabulary.js';
import { buildActivitiesPrompt, buildStoryPrompt } from './prompts.js';

export interface OllamaProviderOptions {
  baseUrl: string;
  model: string;
  /** Aborta la petición si Ollama tarda más de esto (ms). */
  timeoutMs?: number;
  /** Inyectable en tests; por defecto el `fetch` global de Node. */
  fetchFn?: typeof fetch;
}

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

  constructor(options: OllamaProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.model = options.model;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
    const { system, prompt } = buildStoryPrompt(input);
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
    const { system, prompt } = buildActivitiesPrompt(input);
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

  private async generate<T>(system: string, prompt: string, format: object): Promise<T> {
    const res = await this.fetchFn(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        system,
        prompt,
        stream: false,
        format,
        options: { temperature: 0.8 },
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
