import type { GenerateStoryInput, RecommendActivitiesInput } from '../../domain/ai/AIProvider.js';
import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import { CATEGORIAS } from '../../domain/vocabulary.js';
import type { FormatoCuento, ResolvedStoryParams } from './storyParams.js';

/**
 * Plantillas de prompt de la capa de IA, con los valores por defecto en código.
 * Desde la Fase 3 son configurables en caliente vía `AppSetting`: si se pasan
 * `overrides` (texto de `system`/`template` leído de la tabla), se usan esos;
 * si no, se cae a los defaults de este módulo. El llamador (OllamaProvider)
 * resuelve los overrides; aquí solo se sustituyen los placeholders.
 *
 * Todo prompt lleva una instrucción de seguridad porque es una app para niños
 * de 2 a 6 años (ver Docs/cumplimiento-menores.md): lenguaje sencillo, tono
 * amable, sin violencia, miedo ni temas para adultos.
 */

/**
 * Claves de `AppSetting` que consume la generación (prompts + temperatura).
 * Compartidas por `OllamaProvider` y `CloudProvider` para que ambos lean la misma
 * config en caliente y no dupliquen literales que deben casar con el seed.
 */
export const AI_SETTING_KEYS = {
  storySystem: 'prompt.story.system',
  storyTemplate: 'prompt.story.template',
  storyParams: 'prompt.story.params',
  activitySystem: 'prompt.activity.system',
  activityTemplate: 'prompt.activity.template',
  temperature: 'story.temperature',
} as const;

export interface PromptParts {
  /** Rol/Instrucción de sistema (se envía como mensaje `system`). */
  system: string;
  /** Instrucción concreta de la petición. */
  prompt: string;
}

/** Textos base leídos de AppSetting; cualquiera puede faltar (se usa el default). */
export interface PromptOverrides {
  system?: string | null;
  template?: string | null;
}

const INSTRUCCION_SEGURIDAD: Record<CodigoIdioma, string> = {
  es:
    'Eres un cuentacuentos para niños de 2 a 6 años. Escribe siempre en español, ' +
    'con lenguaje simple, frases cortas y tono tierno. Usa onomatopeyas suaves ' +
    '(como "plin-plin", "boing-boing", "shhh"). Nunca incluyas miedo, violencia ni ' +
    'peligro real, ni temas para adultos; termina siempre con un final feliz y ' +
    'tranquilo. Cuando escribas un cuento o una fábula, sigue esta estructura: ' +
    'presenta al personaje, una situación inicial, un pequeño conflicto seguro, un ' +
    'amigo que ayuda, una resolución positiva y una enseñanza final.',
  en:
    'You are a storyteller for children aged 2 to 6. Always write in English, ' +
    'with simple language, short sentences and a tender tone. Use soft onomatopoeia ' +
    '(like "plink-plink", "boing-boing", "shhh"). Never include fear, violence or ' +
    'real danger, or adult themes; always end with a happy, calm ending. When you ' +
    'write a story or a fable, follow this structure: introduce the character, an ' +
    'initial situation, a small safe conflict, a friend who helps, a positive ' +
    'resolution and a final lesson.',
};

/**
 * Ajuste de tono/dificultad por tramo de edad (US-26): los más pequeños necesitan
 * frases muy cortas; los mayores admiten algo más de riqueza. Se inyecta en el
 * prompt para que la IA adapte el contenido al niño concreto.
 */
function tonoPorEdad(edad: number, idioma: CodigoIdioma): string {
  if (idioma === 'es') {
    if (edad <= 3) return 'Usa frases muy cortas y simples, palabras fáciles y mucha repetición.';
    if (edad === 4) return 'Usa frases cortas y vocabulario sencillo.';
    return 'Puedes usar algo más de detalle y vocabulario, manteniéndolo sencillo.';
  }
  if (edad <= 3) return 'Use very short, simple sentences, easy words and lots of repetition.';
  if (edad === 4) return 'Use short sentences and simple vocabulary.';
  return 'You may use a bit more detail and vocabulary, keeping it simple.';
}

/** Lista legible de intereses del perfil para enriquecer el prompt (US-26). */
function listaIntereses(intereses: readonly string[], idioma: CodigoIdioma): string {
  if (intereses.length === 0) return idioma === 'es' ? 'cosas variadas' : 'a variety of things';
  return intereses.join(', ');
}

/** Etiqueta del formato narrativo en cada idioma. */
const FORMATO_LABEL: Record<CodigoIdioma, Record<FormatoCuento, string>> = {
  es: {
    cuento: 'un cuento',
    fabula: 'una fábula con una pequeña moraleja',
    poema: 'un poema',
    adivinanza: 'una adivinanza',
  },
  en: {
    cuento: 'a story',
    fabula: 'a fable with a small moral',
    poema: 'a poem',
    adivinanza: 'a riddle',
  },
};

/**
 * Bloque de formato/longitud/rima a partir de los parámetros configurables
 * (`prompt.story.params`, US-26+). El `formato` ya viene resuelto (elegido al azar
 * por el provider) para dar dinámica al cuento.
 */
function instruccionFormato(params: ResolvedStoryParams, idioma: CodigoIdioma): string {
  if (idioma === 'es') {
    const rima = params.rima ? ' y procura que rime' : '';
    return ` Que tenga entre ${params.palabrasMin} y ${params.palabrasMax} palabras${rima}.`;
  }
  const rima = params.rima ? ' and try to make it rhyme' : '';
  return ` Make it between ${params.palabrasMin} and ${params.palabrasMax} words${rima}.`;
}

/** Verbo + formato inicial del prompt: "Escribe un cuento" / "Write a story". */
function aperturaFormato(params: ResolvedStoryParams | undefined, idioma: CodigoIdioma): string {
  const label = params
    ? FORMATO_LABEL[idioma][params.formato]
    : idioma === 'es'
      ? 'un cuento'
      : 'a story';
  return idioma === 'es' ? `Escribe ${label}` : `Write ${label}`;
}

/** Sustituye `{clave}` por su valor en una plantilla configurable. */
function rellenar(template: string, valores: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (original, clave: string) =>
    clave in valores ? String(valores[clave]) : original,
  );
}

export function buildStoryPrompt(
  input: GenerateStoryInput,
  overrides: PromptOverrides = {},
  params?: ResolvedStoryParams,
): PromptParts {
  const idioma = input.perfil.idioma.value;
  const { nombre, edad, intereses } = input.perfil;
  const tono = tonoPorEdad(edad.value, idioma);
  const gustos = listaIntereses(intereses, idioma);
  const apertura = aperturaFormato(params, idioma);
  // Longitud: la marcan los params si existen; si no, el "corto (4 a 6 frases)" de siempre.
  const longitud = params
    ? instruccionFormato(params, idioma)
    : idioma === 'es'
      ? ' Que sea corto, de 4 a 6 frases.'
      : ' Keep it short, 4 to 6 sentences.';
  const valores = {
    nombre,
    edad: edad.value,
    tema: input.tema,
    estilo: input.estilo,
    idioma,
    intereses: gustos,
    tono,
    formato: params?.formato ?? 'cuento',
    palabrasMin: params?.palabrasMin ?? '',
    palabrasMax: params?.palabrasMax ?? '',
    rima: params?.rima ? (idioma === 'es' ? 'sí' : 'yes') : 'no',
  };

  const prompt = overrides.template
    ? rellenar(overrides.template, valores)
    : idioma === 'es'
      ? `${apertura} para ${nombre}, de ${edad.value} años, sobre "${input.tema}" con un estilo ` +
        `${input.estilo}. ${nombre} es protagonista y le gustan ${gustos}. ${tono}${longitud} ` +
        `Devuelve un título breve y el cuerpo.`
      : `${apertura} for ${nombre}, aged ${edad.value}, about "${input.tema}" in a ${input.estilo} ` +
        `style. ${nombre} is the main character and likes ${gustos}. ${tono}${longitud} ` +
        `Return a short title and the body.`;

  return { system: overrides.system ?? INSTRUCCION_SEGURIDAD[idioma], prompt };
}

export function buildActivitiesPrompt(
  input: RecommendActivitiesInput,
  overrides: PromptOverrides = {},
): PromptParts {
  const idioma = input.perfil.idioma.value;
  const { nombre, edad, intereses } = input.perfil;
  const categorias = CATEGORIAS.join(', ');
  const tono = tonoPorEdad(edad.value, idioma);
  const gustos = listaIntereses(intereses, idioma);
  // Solo se sugieren intereses cuando la categoría es libre (si está fija, manda la categoría).
  const afinidad =
    input.categoria !== undefined
      ? ''
      : idioma === 'es'
        ? ` Procura que conecten con lo que le gusta: ${gustos}.`
        : ` Try to connect them with what they like: ${gustos}.`;
  const acotacion =
    input.categoria !== undefined
      ? idioma === 'es'
        ? ` Todas deben ser de la categoría "${input.categoria}".`
        : ` All of them must be of the "${input.categoria}" category.`
      : idioma === 'es'
        ? ` Reparte las categorías entre: ${categorias}.`
        : ` Spread the categories across: ${categorias}.`;

  const prompt = overrides.template
    ? rellenar(overrides.template, {
        nombre,
        edad: edad.value,
        n: input.cantidad,
        categoria: input.categoria ?? categorias,
        categorias,
        intereses: gustos,
        tono,
      })
    : idioma === 'es'
      ? `Propón ${input.cantidad} actividades sencillas para ${nombre}, de ${edad.value} años.` +
        acotacion +
        afinidad +
        ` ${tono}` +
        ` Cada actividad necesita una categoría (${categorias}), un título, una descripción ` +
        `breve, una duración en minutos y un nivel de dificultad de 1 a 3.`
      : `Suggest ${input.cantidad} simple activities for ${nombre}, aged ${edad.value}.` +
        acotacion +
        afinidad +
        ` ${tono}` +
        ` Each activity needs a category (${categorias}), a title, a short description, ` +
        `a duration in minutes and a difficulty level from 1 to 3.`;

  return { system: overrides.system ?? INSTRUCCION_SEGURIDAD[idioma], prompt };
}
