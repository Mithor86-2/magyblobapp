/**
 * Formateador del **documento de muestra de prompts** (US-60). Construye el Markdown
 * de `Docs/muestra-prompts.md` a partir de una lista de casos ya resueltos (la red la
 * hace el script `scripts/dump-prompts.ts`, fuera de aquí): este módulo es **puro**
 * (sin IO ni red), de modo que tiene un test determinista en el gate.
 *
 * Cada caso lleva la combinación (tema/estilo/idioma/edad), el `system`+`prompt`
 * realmente enviados (los que devuelven `buildStoryPrompt`/`buildActivitiesPrompt`/
 * `buildImagePrompt`) y el resultado real del proveedor. Para las portadas **no** se
 * incrusta el base64: solo si Gemini devolvió imagen y su tamaño aproximado.
 */
import type { GeneratedActivity, GeneratedStory } from '../../domain/ai/AIProvider.js';
import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import type { PromptParts } from './prompts.js';

/** Combinación que identifica un caso de la muestra. */
export interface SampleCombinacion {
  tema: string;
  estilo: string;
  idioma: CodigoIdioma;
  edad: number;
}

/** Caso de CUENTO: prompt enviado + título/cuerpo devueltos por Groq. */
export interface StorySample {
  tipo: 'cuento';
  combinacion: SampleCombinacion;
  partes: PromptParts;
  resultado: GeneratedStory;
}

/** Caso de ACTIVIDADES: prompt enviado + lista de actividades devuelta por Groq. */
export interface ActivitiesSample {
  tipo: 'actividades';
  combinacion: SampleCombinacion;
  partes: PromptParts;
  resultado: GeneratedActivity[];
}

/** Resultado de una portada: si Gemini devolvió imagen y su tamaño aproximado. */
export interface ImageSampleResult {
  /** ¿Devolvió Gemini una imagen? */
  ok: boolean;
  /** Tamaño aproximado de la data URL en KB (solo si `ok`); nunca el base64 entero. */
  tamanoKb?: number;
  /** Mensaje de error/aviso si no se obtuvo imagen. */
  detalle?: string;
}

/** Caso de PORTADA: prompt de imagen enviado a Gemini + estado del resultado. */
export interface ImageSample {
  tipo: 'portada';
  combinacion: Pick<SampleCombinacion, 'tema' | 'estilo'>;
  titulo: string;
  prompt: string;
  resultado: ImageSampleResult;
}

export type PromptSample = StorySample | ActivitiesSample | ImageSample;

/** Nombre legible del idioma para el documento. */
function idiomaLabel(idioma: CodigoIdioma): string {
  return idioma === 'es' ? 'español (es)' : 'inglés (en)';
}

/** Bloque `system` + `prompt` enviados, en cercas de código para legibilidad. */
function bloquePrompt(partes: PromptParts): string {
  return (
    `**System enviado:**\n\n` +
    '```text\n' +
    `${partes.system}\n` +
    '```\n\n' +
    `**Prompt enviado:**\n\n` +
    '```text\n' +
    `${partes.prompt}\n` +
    '```\n'
  );
}

function seccionCuento(caso: StorySample, indice: number): string {
  const { combinacion: c, resultado: r } = caso;
  return (
    `### ${indice}. Cuento — tema "${c.tema}", estilo "${c.estilo}", ${idiomaLabel(c.idioma)}, ${c.edad} años\n\n` +
    `${bloquePrompt(caso.partes)}\n` +
    `**Resultado (proveedor: ${r.proveedor}):**\n\n` +
    `- **Título:** ${r.titulo}\n\n` +
    `${r.cuerpo}\n`
  );
}

function seccionActividades(caso: ActivitiesSample, indice: number): string {
  const { combinacion: c, resultado } = caso;
  const proveedor = resultado[0]?.proveedor ?? 'desconocido';
  const items = resultado
    .map((a) => {
      const instrucciones = a.instrucciones ? `\n  - Instrucciones: ${a.instrucciones}` : '';
      const meta = [
        a.duracionMin !== undefined ? `${a.duracionMin} min` : null,
        a.nivel !== undefined ? `nivel ${a.nivel}` : null,
      ]
        .filter((x): x is string => x !== null)
        .join(', ');
      const metaLinea = meta === '' ? '' : `\n  - (${meta})`;
      return `- **[${a.categoria}] ${a.titulo}** — ${a.descripcion}${instrucciones}${metaLinea}`;
    })
    .join('\n');
  return (
    `### ${indice}. Actividades — tema "${c.tema}", ${idiomaLabel(c.idioma)}, ${c.edad} años\n\n` +
    `${bloquePrompt(caso.partes)}\n` +
    `**Resultado (proveedor: ${proveedor}):**\n\n` +
    `${items}\n`
  );
}

function seccionPortada(caso: ImageSample, indice: number): string {
  const { combinacion: c, resultado: r } = caso;
  const detalle = r.detalle ? ` — ${r.detalle}` : '';
  const estado = r.ok ? `imagen generada (≈${r.tamanoKb ?? '?'} KB)` : `sin imagen${detalle}`;
  return (
    `### ${indice}. Portada — tema "${c.tema}", estilo "${c.estilo}"\n\n` +
    `Título orientativo: "${caso.titulo}"\n\n` +
    `**Prompt de imagen enviado (Gemini):**\n\n` +
    '```text\n' +
    `${caso.prompt}\n` +
    '```\n\n' +
    `**Resultado:** ${estado}\n`
  );
}

function seccion(caso: PromptSample, indice: number): string {
  switch (caso.tipo) {
    case 'cuento':
      return seccionCuento(caso, indice);
    case 'actividades':
      return seccionActividades(caso, indice);
    case 'portada':
      return seccionPortada(caso, indice);
  }
}

/**
 * Construye el documento Markdown completo de la muestra de prompts (US-60) a partir
 * de los casos resueltos. `generadoEn` se inyecta para que el test sea determinista.
 */
export function formatPromptSampleDoc(casos: readonly PromptSample[], generadoEn: Date): string {
  const cabecera =
    `# Muestra de prompts (resultados reales)\n\n` +
    `> Generado el ${generadoEn.toISOString()} por \`pnpm --filter @magyblob/backend prompts:dump\` ` +
    `(US-60). Documento **sobrescribible**; no se edita a mano.\n>\n` +
    `> Cuentos y actividades: prompt real (\`buildStoryPrompt\`/\`buildActivitiesPrompt\`) + resultado ` +
    `de **Groq**. Portadas: prompt de imagen (\`buildImagePrompt\`) + estado de **Gemini** (sin ` +
    `incrustar el base64). Es un conjunto **representativo**, no el producto cartesiano completo.\n`;
  const cuerpo = casos.map((caso, i) => seccion(caso, i + 1)).join('\n---\n\n');
  return `${cabecera}\n${cuerpo}\n`;
}
