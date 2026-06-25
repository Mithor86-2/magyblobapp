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
  type PromptOverrides,
  type PromptParts,
} from './prompts.js';
import { readStoryParams, resolveStoryParams, type ResolvedStoryParams } from './storyParams.js';

export interface CloudProviderOptions {
  /** Base del endpoint compatible OpenAI (sin barra final), del preset del target. */
  baseUrl: string;
  /** API key del proveedor (leída de env, nunca de BD). */
  apiKey: string;
  /** Id del modelo en el proveedor (p. ej. `llama-3.3-70b-versatile`). */
  model: string;
  /** Aborta la petición si el proveedor tarda más de esto (ms). */
  timeoutMs?: number;
  /** Inyectable en tests; por defecto el `fetch` global de Node. */
  fetchFn?: typeof fetch;
  /** Config en caliente (AppSetting): plantillas y temperatura. Opcional. */
  settings?: SettingsRepository;
  /** Logger para observabilidad de prompts/respuestas (US-34). Opcional. */
  logger?: AILogger;
}

const TEMPERATURA_DEFECTO = 0.7;

/**
 * Proveedor de IA contra cualquier API **compatible con OpenAI** (Groq, Gemini,
 * OpenRouter, Cerebras…) vía `POST {baseUrl}/chat/completions` con
 * `response_format: {type: 'json_object'}` para forzar salida JSON parseable.
 *
 * Reutiliza los prompts (`prompts.ts`) y el parseo/saneo (`parseResponse.ts`)
 * comunes con `OllamaProvider`; aquí solo se añade la instrucción explícita de
 * forma JSON que exige el modo `json_object`.
 *
 * Lanza si el proveedor no responde, devuelve un error HTTP o un JSON inválido:
 * de eso se encarga `FallbackProvider`, que cae a `MockProvider` ante cualquier fallo.
 */
export class CloudProvider implements AIProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly settings?: SettingsRepository;
  private readonly logger?: AILogger;

  constructor(options: CloudProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
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
    const data = await this.chat<{ titulo?: unknown; cuerpo?: unknown }>(
      conInstruccionJson(partes, INSTRUCCION_JSON_CUENTO),
      {
        op: 'generateStory',
        config: {
          plantilla: overrides.template ? 'appsetting' : 'defecto',
          systemFuente: overrides.system ? 'appsetting' : 'defecto',
          params: params ?? null,
        },
      },
    );
    return parseStory(data, 'CloudProvider', 'cloud');
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
    const data = await this.chat<{ actividades?: unknown }>(
      conInstruccionJson(partes, instruccionJsonActividades()),
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
    return parseActivities(data, input.cantidad, 'CloudProvider', 'cloud');
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

  private async chat<T>(
    partes: PromptParts,
    logCtx: { op: AiOp; config: Record<string, unknown> },
  ): Promise<T> {
    const temperature = await this.leerTemperatura();
    logPromptEnviado(this.logger, {
      op: logCtx.op,
      proveedor: 'cloud',
      model: this.model,
      temperature,
      config: logCtx.config,
      system: partes.system,
      prompt: partes.prompt,
    });
    const res = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: partes.system },
          { role: 'user', content: partes.prompt },
        ],
        temperature,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) {
      throw new Error(`El proveedor cloud respondió ${res.status} ${res.statusText}.`);
    }
    const payload = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Respuesta del proveedor cloud sin contenido de mensaje.');
    }
    try {
      const data = JSON.parse(content) as T;
      logRespuestaLlm(this.logger, logCtx.op, 'cloud', data);
      return data;
    } catch {
      throw new Error('El proveedor cloud devolvió un JSON no parseable.');
    }
  }
}

/**
 * El modo `json_object` exige que las instrucciones describan la forma JSON
 * esperada (y que aparezca la palabra "JSON"). Estos textos se añaden al prompt
 * de usuario; el `system` de seguridad infantil se mantiene intacto.
 */
const INSTRUCCION_JSON_CUENTO =
  ' Responde ÚNICAMENTE con un objeto JSON con esta forma exacta: ' +
  '{"titulo": "string", "cuerpo": "string"}. No añadas texto fuera del JSON.';

function instruccionJsonActividades(): string {
  const categorias = CATEGORIAS.join(', ');
  return (
    ' Responde ÚNICAMENTE con un objeto JSON con esta forma exacta: ' +
    `{"actividades": [{"categoria": "una de [${categorias}]", "titulo": "string", ` +
    '"descripcion": "string", "duracionMin": entero, "nivel": entero entre 1 y 3}]}. ' +
    'No añadas texto fuera del JSON.'
  );
}

function conInstruccionJson(partes: PromptParts, instruccion: string): PromptParts {
  return { system: partes.system, prompt: partes.prompt + instruccion };
}
