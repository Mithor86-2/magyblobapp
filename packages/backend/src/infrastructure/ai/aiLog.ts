import type { AILogger } from './FallbackProvider.js';

/** Operación de IA registrada. */
export type AiOp = 'generateStory' | 'recommendActivities';

export interface PromptLog {
  op: AiOp;
  proveedor: 'local' | 'cloud';
  model: string;
  temperature: number;
  /** Config resuelta del prompt (plantilla por defecto/AppSetting, params, cantidad…). */
  config: Record<string, unknown>;
  system: string;
  prompt: string;
}

/**
 * Loguea (nivel `info`) el prompt que se envía al LLM y su configuración resuelta
 * (US-34). El prompt incluye el nombre del niño (PII): desviación asumida para
 * depuración, ver `cumplimiento-menores.md` (C-5). No emite nada si el logger no
 * aporta `info` (p. ej. tests con `{ warn }`).
 */
export function logPromptEnviado(logger: AILogger | undefined, ctx: PromptLog): void {
  logger?.info?.(
    {
      op: ctx.op,
      proveedor: ctx.proveedor,
      model: ctx.model,
      temperature: ctx.temperature,
      config: ctx.config,
      system: ctx.system,
      prompt: ctx.prompt,
    },
    'IA: prompt enviado al LLM',
  );
}

/** Loguea (nivel `info`) la respuesta cruda del LLM (US-34). */
export function logRespuestaLlm(
  logger: AILogger | undefined,
  op: AiOp,
  proveedor: 'local' | 'cloud',
  respuesta: unknown,
): void {
  logger?.info?.({ op, proveedor, respuesta }, 'IA: respuesta del LLM');
}
