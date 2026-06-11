import type { GenerateStoryInput, RecommendActivitiesInput } from '../../domain/ai/AIProvider.js';
import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import { CATEGORIAS } from '../../domain/vocabulary.js';

/**
 * Plantillas de prompt de la capa de IA, con los valores por defecto en código.
 * En la Fase 3 pasarán a ser configurables vía `AppSetting` (clave-valor) sin
 * tocar este módulo: la firma `buildStoryPrompt`/`buildActivitiesPrompt` se
 * mantiene y solo cambiará de dónde salen los textos base.
 *
 * Todo prompt lleva una instrucción de seguridad porque es una app para niños
 * de 2 a 6 años (ver Docs/cumplimiento-menores.md): lenguaje sencillo, tono
 * amable, sin violencia, miedo ni temas para adultos.
 */

export interface PromptParts {
  /** Rol/Instrucción de sistema (se envía en el campo `system` de Ollama). */
  system: string;
  /** Instrucción concreta de la petición. */
  prompt: string;
}

const INSTRUCCION_SEGURIDAD: Record<CodigoIdioma, string> = {
  es:
    'Eres un cuentacuentos para niños de 2 a 6 años. Escribe siempre en español, ' +
    'con lenguaje sencillo y tono cálido y amable. Nunca incluyas violencia, miedo, ' +
    'ni temas para adultos.',
  en:
    'You are a storyteller for children aged 2 to 6. Always write in English, ' +
    'with simple language and a warm, kind tone. Never include violence, fear, ' +
    'or adult themes.',
};

export function buildStoryPrompt(input: GenerateStoryInput): PromptParts {
  const idioma = input.perfil.idioma.value;
  const { nombre, edad } = input.perfil;
  const prompt =
    idioma === 'es'
      ? `Escribe un cuento corto (4 a 6 frases) para ${nombre}, de ${edad.value} años, ` +
        `sobre "${input.tema}" con un estilo ${input.estilo}. ${nombre} es el protagonista. ` +
        `Devuelve un título breve y el cuerpo del cuento.`
      : `Write a short story (4 to 6 sentences) for ${nombre}, aged ${edad.value}, ` +
        `about "${input.tema}" in a ${input.estilo} style. ${nombre} is the main character. ` +
        `Return a short title and the body of the story.`;
  return { system: INSTRUCCION_SEGURIDAD[idioma], prompt };
}

export function buildActivitiesPrompt(input: RecommendActivitiesInput): PromptParts {
  const idioma = input.perfil.idioma.value;
  const { nombre, edad } = input.perfil;
  const categorias = CATEGORIAS.join(', ');
  const acotacion =
    input.categoria !== undefined
      ? idioma === 'es'
        ? ` Todas deben ser de la categoría "${input.categoria}".`
        : ` All of them must be of the "${input.categoria}" category.`
      : idioma === 'es'
        ? ` Reparte las categorías entre: ${categorias}.`
        : ` Spread the categories across: ${categorias}.`;
  const prompt =
    idioma === 'es'
      ? `Propón ${input.cantidad} actividades sencillas para ${nombre}, de ${edad.value} años.` +
        acotacion +
        ` Cada actividad necesita una categoría (${categorias}), un título, una descripción ` +
        `breve, una duración en minutos y un nivel de dificultad de 1 a 3.`
      : `Suggest ${input.cantidad} simple activities for ${nombre}, aged ${edad.value}.` +
        acotacion +
        ` Each activity needs a category (${categorias}), a title, a short description, ` +
        `a duration in minutes and a difficulty level from 1 to 3.`;
  return { system: INSTRUCCION_SEGURIDAD[idioma], prompt };
}
