import type {
  AIProvider,
  GeneratedActivity,
  GeneratedStory,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../domain/ai/AIProvider.js';

/** Logger mínimo (estructural) para no acoplar la infraestructura a pino. */
export interface AILogger {
  warn(meta: Record<string, unknown>, msg: string): void;
  /** Opcional: observabilidad de los prompts/IA (US-34). No todos los consumidores lo aportan. */
  info?(meta: Record<string, unknown>, msg: string): void;
}

/**
 * Decora un proveedor de IA `primary` con una red de seguridad: si falla (Ollama
 * caído, timeout, JSON inválido…), delega en `fallback` —en la
 * práctica el `MockProvider`— para que el flujo nunca se rompa por la IA.
 *
 * El fallo se registra (warn) pero no se propaga: el usuario recibe contenido
 * del mock en vez de un error. Es el comportamiento exigido por el plan (Fase 2).
 */
export class FallbackProvider implements AIProvider {
  constructor(
    private readonly primary: AIProvider,
    private readonly fallback: AIProvider,
    private readonly logger: AILogger = NO_OP_LOGGER,
  ) {}

  async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
    try {
      return await this.primary.generateStory(input);
    } catch (error) {
      this.logger.warn({ error: descripcion(error), op: 'generateStory' }, MENSAJE_FALLBACK);
      return this.fallback.generateStory(input);
    }
  }

  async recommendActivities(input: RecommendActivitiesInput): Promise<GeneratedActivity[]> {
    try {
      return await this.primary.recommendActivities(input);
    } catch (error) {
      this.logger.warn({ error: descripcion(error), op: 'recommendActivities' }, MENSAJE_FALLBACK);
      return this.fallback.recommendActivities(input);
    }
  }
}

const MENSAJE_FALLBACK = 'El proveedor de IA falló; usando MockProvider como fallback.';
const NO_OP_LOGGER: AILogger = { warn: () => {} };

function descripcion(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
