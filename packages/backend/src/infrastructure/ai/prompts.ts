import type { GenerateStoryInput, RecommendActivitiesInput } from '../../domain/ai/AIProvider.js';
import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import { CATEGORIAS, type Parentesco } from '../../domain/vocabulary.js';
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

/**
 * Combina `system` + `prompt` en una sola cadena legible para persistir el prompt
 * realmente usado (US-61). Es el texto que se guarda en BD para trazabilidad; no se
 * vuelve a enviar al LLM (cada proveedor manda `system`/`prompt` por separado).
 */
export function joinPromptParts(partes: PromptParts): string {
  return `SYSTEM:\n${partes.system}\n\nPROMPT:\n${partes.prompt}`;
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
    'presenta al personaje, una situación inicial, un amigo que ayuda, una ' +
    'resolución positiva y una enseñanza final. Entrega el cuento dividido en ' +
    'AL MENOS 4 páginas: cada página es un párrafo autoconclusivo de AL MENOS 3 ' +
    'frases (por ejemplo Introducción, Enigma, Cómplice, Resolución y Cierre), y ' +
    'separa cada párrafo del siguiente con una línea en blanco (un doble salto de línea).',
  en:
    'You are a storyteller for children aged 2 to 6. Always write in English, ' +
    'with simple language, short sentences and a tender tone. Use soft onomatopoeia ' +
    '(like "plink-plink", "boing-boing", "shhh"). Never include fear, violence or ' +
    'real danger, or adult themes; always end with a happy, calm ending. When you ' +
    'write a story or a fable, follow this structure: introduce the character, an ' +
    'initial situation, a friend who helps, a positive resolution and a final lesson. ' +
    'Deliver the story split into AT LEAST 4 pages: each page is a short, ' +
    'self-contained paragraph (for example Introduction, Riddle, Sidekick, ' +
    'Resolution and Closing), each page being a self-contained paragraph of AT LEAST ' +
    '3 sentences, and separate each paragraph from the next with a blank line (a ' +
    'double line break).',
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

/**
 * Nombre del protagonista para el prompt (US-76). Por defecto es el nombre real del
 * niño; si `usarNombre` es `false`, se sustituye por un protagonista genérico y
 * cariñoso ("nuestro pequeño amigo" / "our little friend") para no enviar el nombre
 * del niño al proveedor (minimización de PII).
 */
export function protagonista(
  nombre: string,
  usarNombre: boolean | undefined,
  idioma: CodigoIdioma,
): string {
  if (usarNombre === false) return idioma === 'es' ? 'nuestro pequeño amigo' : 'our little friend';
  return nombre;
}

/**
 * Instrucción para que el modelo NO invente un nombre propio cuando el adulto elige
 * no usar el nombre del niño (US-76). Cadena vacía si sí se usa el nombre.
 */
function instruccionSinNombre(usarNombre: boolean | undefined, idioma: CodigoIdioma): string {
  if (usarNombre !== false) return '';
  return idioma === 'es'
    ? ' No uses ningún nombre propio para el protagonista; refiérete a él como "nuestro pequeño amigo".'
    : ' Do not use any proper name for the main character; refer to them as "our little friend".';
}

/**
 * Instrucción para continuar un cuento anterior (US-78): se antepone el contexto del
 * cuento origen (su cuerpo o resumen) y se pide un capítulo nuevo que siga la historia
 * en vez de empezar de cero. Cadena vacía si no es una continuación.
 */
function instruccionContinuacion(contexto: string | undefined, idioma: CodigoIdioma): string {
  const previo = contexto?.trim();
  if (!previo) return '';
  return idioma === 'es'
    ? ` Esta es la CONTINUACIÓN de un cuento anterior. Cuento previo: "${previo}". ` +
        'Escribe un capítulo nuevo que siga esa historia con los mismos personajes, ' +
        'sin repetir lo ya contado y con un final feliz y tranquilo.'
    : ` This is the CONTINUATION of a previous story. Previous story: "${previo}". ` +
        'Write a new chapter that follows that story with the same characters, ' +
        'without repeating what was already told and with a happy, calm ending.';
}

/** Lista legible de intereses del perfil para enriquecer el prompt (US-26). */
function listaIntereses(intereses: readonly string[], idioma: CodigoIdioma): string {
  if (intereses.length === 0) return idioma === 'es' ? 'cosas variadas' : 'a variety of things';
  return intereses.join(', ');
}

/**
 * Traducción id→palabra legible de temas y estilos para el prompt (US-47). El
 * vocabulario del dominio son identificadores ASCII en español (`animales`,
 * `espacio`); aquí se traduce a la forma natural de cada idioma para que el prompt
 * en inglés diga "animals and space" y no "animales and espacio". Si un valor no
 * está en el mapa (no debería: el caso de uso valida el vocabulario), se usa tal cual.
 */
const TEMA_PALABRA: Record<CodigoIdioma, Record<string, string>> = {
  es: {
    animales: 'animales',
    espacio: 'espacio',
    magia: 'magia',
    aventuras: 'aventuras',
    musica: 'música',
  },
  en: {
    animales: 'animals',
    espacio: 'space',
    magia: 'magic',
    aventuras: 'adventures',
    musica: 'music',
  },
};

const ESTILO_PALABRA: Record<CodigoIdioma, Record<string, string>> = {
  es: { aventura: 'aventura', divertido: 'divertido', educativo: 'educativo' },
  en: { aventura: 'adventure', divertido: 'fun', educativo: 'educational' },
};

/**
 * Descripción legible de cada enseñanza/valor (US-69) por idioma, para tejerla en el
 * prompt del cuento. El vocabulario del dominio son identificadores ASCII; aquí se
 * expresan como una frase natural que orienta la moraleja de la historia.
 */
const ENSENANZA_FRASE: Record<CodigoIdioma, Record<string, string>> = {
  es: {
    amistad: 'la amistad y compartir con los demás',
    emociones: 'reconocer y calmar las emociones, como el enfado o la tristeza',
    valentia: 'ser valiente y superar los miedos',
    honestidad: 'decir la verdad y respetar a los demás',
  },
  en: {
    amistad: 'friendship and sharing with others',
    emociones: 'recognizing and calming emotions, like anger or sadness',
    valentia: 'being brave and overcoming fears',
    honestidad: 'telling the truth and respecting others',
  },
};

/**
 * Instrucción que pide transmitir la enseñanza elegida (US-69), mostrada de forma
 * natural en la historia y reforzada en la enseñanza final. Cadena vacía si no se
 * eligió ninguna (el cuento se genera como siempre).
 */
function instruccionEnsenanza(ensenanza: string | undefined, idioma: CodigoIdioma): string {
  if (ensenanza === undefined) return '';
  const frase = ENSENANZA_FRASE[idioma][ensenanza] ?? ensenanza;
  return idioma === 'es'
    ? ` El cuento debe transmitir una enseñanza sobre ${frase}, mostrada de forma natural en la ` +
        `historia y reforzada en la enseñanza final.`
    : ` The story must convey a lesson about ${frase}, shown naturally in the story and reinforced ` +
        `in the final lesson.`;
}

/**
 * Une una lista en una enumeración legible para el prompt (US-47): traduce cada
 * elemento al idioma con el mapa dado, deja un solo elemento tal cual y une varios
 * con comas + conjunción final "y" (ES) / "and" (EN). P. ej. ["animales","espacio"]
 * → "animales y espacio" / "animals and space".
 */
function listaLegible(
  items: readonly string[],
  idioma: CodigoIdioma,
  diccionario: Record<CodigoIdioma, Record<string, string>>,
): string {
  const palabras = items.map((it) => diccionario[idioma][it] ?? it);
  if (palabras.length <= 1) return palabras[0] ?? '';
  const conjuncion = idioma === 'es' ? 'y' : 'and';
  const previos = palabras.slice(0, -1).join(', ');
  return `${previos} ${conjuncion} ${palabras[palabras.length - 1]}`;
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
    const rima = params.rima ? ', y procura que rime' : '';
    return (
      ` Extiéndete: escribe al menos ${params.palabrasMin} palabras ` +
      `(entre ${params.palabrasMin} y ${params.palabrasMax} palabras), en varios párrafos${rima}. ` +
      `No te quedes corto.`
    );
  }
  const rima = params.rima ? ', and try to make it rhyme' : '';
  return (
    ` Make it long: at least ${params.palabrasMin} words ` +
    `(between ${params.palabrasMin} and ${params.palabrasMax} words), in several paragraphs${rima}. ` +
    `Don't fall short.`
  );
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

/** Construye el prompt (system + user) del cuento, aplicando overrides configurables y los params resueltos. */
export function buildStoryPrompt(
  input: GenerateStoryInput,
  overrides: PromptOverrides = {},
  params?: ResolvedStoryParams,
): PromptParts {
  const idioma = input.perfil.idioma.value;
  const { nombre, edad, intereses } = input.perfil;
  // US-76: protagonista real o genérico según `usarNombre` (default = usar el nombre).
  const proto = protagonista(nombre, input.usarNombre, idioma);
  const sinNombreInstr = instruccionSinNombre(input.usarNombre, idioma);
  // US-78: si hay contexto previo, se pide continuar la historia (capítulo nuevo).
  const continuacionInstr = instruccionContinuacion(input.contexto, idioma);
  const tono = tonoPorEdad(edad.value, idioma);
  const gustos = listaIntereses(intereses, idioma);
  const apertura = aperturaFormato(params, idioma);
  // US-47: temas y estilos son listas; se interpolan como enumeración legible,
  // traducida a la forma natural del idioma del perfil.
  const temas = listaLegible(input.temas, idioma, TEMA_PALABRA);
  const estilos = listaLegible(input.estilos, idioma, ESTILO_PALABRA);
  // US-69: instrucción de la enseñanza elegida (o '' si no se eligió ninguna).
  const ensenanzaInstr = instruccionEnsenanza(input.ensenanza, idioma);
  // Longitud: la marcan los params si existen; si no, el "corto (4 a 6 frases)" de siempre.
  const longitud = params
    ? instruccionFormato(params, idioma)
    : idioma === 'es'
      ? ' Que sea corto, de 4 a 6 frases.'
      : ' Keep it short, 4 to 6 sentences.';
  const valores = {
    // US-76: el protagonista puede ser genérico si el adulto no usa el nombre del niño.
    nombre: proto,
    edad: edad.value,
    // US-47: listas legibles. Se conservan `{tema}`/`{estilo}` como alias de la lista
    // para no romper plantillas configuradas con los placeholders antiguos.
    temas,
    estilos,
    tema: temas,
    estilo: estilos,
    idioma,
    // Nombre legible del idioma para las plantillas configurables: evita que
    // `{idioma}` quede como "en"/"es" en el prompt (p. ej. "Escríbelo en inglés").
    idiomaNombre: idioma === 'es' ? 'español' : 'inglés',
    intereses: gustos,
    tono,
    // US-69: frase legible de la enseñanza (o '' si ninguna) para plantillas configurables.
    ensenanza: input.ensenanza ? (ENSENANZA_FRASE[idioma][input.ensenanza] ?? input.ensenanza) : '',
    formato: params?.formato ?? 'cuento',
    palabrasMin: params?.palabrasMin ?? '',
    palabrasMax: params?.palabrasMax ?? '',
    rima: params?.rima ? (idioma === 'es' ? 'sí' : 'yes') : 'no',
  };

  const promptBase = overrides.template
    ? rellenar(overrides.template, valores)
    : idioma === 'es'
      ? `${apertura} para ${proto}, de ${edad.value} años, sobre "${temas}" con un estilo ` +
        `${estilos}. ${proto} es protagonista y le gustan ${gustos}. ${tono}${longitud} ` +
        `Devuelve un título breve y el cuerpo. Inventa un título original y distinto cada vez ` +
        `(no repitas la fórmula "${proto} y la aventura de ...").`
      : `${apertura} for ${proto}, aged ${edad.value}, about "${temas}" in a ${estilos} ` +
        `style. ${proto} is the main character and likes ${gustos}. ${tono}${longitud} ` +
        `Return a short title and the body. Invent an original, different title each time ` +
        `(do not reuse the pattern "${proto} and the ... adventure").`;

  // US-69: la enseñanza se añade al final del prompt para honrarla también con
  // plantillas configuradas (que no referencian `{ensenanza}`); '' si no hay ninguna.
  // US-76: instrucción de no inventar nombre; US-78: instrucción de continuación.
  return {
    system: overrides.system ?? INSTRUCCION_SEGURIDAD[idioma],
    prompt: promptBase + ensenanzaInstr + sinNombreInstr + continuacionInstr,
  };
}

/**
 * Construye el prompt de la **portada ilustrada** (US-59) a partir de
 * tema/estilo/título. **Nunca** incluye el nombre del niño ni datos
 * identificativos (cumplimiento C-5): solo el vocabulario del contenido y un
 * título orientativo. El texto va en inglés porque los modelos de imagen
 * (Gemini/Imagen) lo interpretan mejor; describe un estilo de ilustración
 * infantil seguro y amable, coherente con la app para niños de 2 a 6 años.
 */
export function buildImagePrompt(tema: string, estilo: string, titulo: string): string {
  const temaEn = TEMA_PALABRA.en[tema] ?? tema;
  const estiloEn = ESTILO_PALABRA.en[estilo] ?? estilo;
  const tituloLimpio = titulo.trim();
  const sobreTitulo = tituloLimpio === '' ? '' : ` inspired by the title "${tituloLimpio}"`;
  return (
    `A warm, friendly children's book cover illustration about ${temaEn}, ` +
    `in a ${estiloEn} style${sobreTitulo}. ` +
    'Soft rounded shapes, bright cheerful colors, gentle and cozy mood, ' +
    'suitable for toddlers aged 2 to 6. No text, no letters, no words in the image. ' +
    'No scary, violent or dark elements. Square composition.'
  );
}

/** Trato del adulto acompañante en las instrucciones, por idioma y parentesco (US-67). */
const TERMINO_CUIDADOR: Record<CodigoIdioma, Record<Parentesco, string>> = {
  es: {
    madre: 'mamá',
    padre: 'papá',
    abuelo_a: 'la abuela o el abuelo',
    tutor_legal: 'el tutor o la tutora',
    otro: 'la persona adulta',
  },
  en: {
    madre: 'mom',
    padre: 'dad',
    abuelo_a: 'grandma or grandpa',
    tutor_legal: 'the guardian',
    otro: 'the grown-up',
  },
};

/**
 * Trato corto y **componible con el nombre** del adulto (US-77): "mamá Ana", "abuela
 * Ana". Se usa solo cuando hay nombre; para el trato sin nombre se usa el disyuntivo
 * de `TERMINO_CUIDADOR`. Sin dato de género, el abuelo/a y el tutor/a se abrevian con
 * forma barra. `otro` no lleva trato (solo el nombre).
 */
const TERMINO_CUIDADOR_CORTO: Record<CodigoIdioma, Record<Parentesco, string>> = {
  es: { madre: 'mamá', padre: 'papá', abuelo_a: 'abuela/o', tutor_legal: 'tutor/a', otro: '' },
  en: { madre: 'mom', padre: 'dad', abuelo_a: 'grandma/pa', tutor_legal: 'guardian', otro: '' },
};

/**
 * Término con el que las instrucciones se dirigen al adulto acompañante (US-67, US-77):
 * su parentesco ("mamá", "papá", "la abuela o el abuelo"…) en vez de "el adulto", y
 * **combinado con su nombre** cuando se conoce ("mamá Ana", "abuela/o Ana"). Sin
 * parentesco (p. ej. modo anónimo) devuelve un trato genérico; con `otro` + nombre
 * usa solo el nombre.
 */
export function terminoCuidador(
  parentesco: Parentesco | undefined,
  idioma: CodigoIdioma,
  nombre?: string,
): string {
  const base =
    parentesco === undefined
      ? idioma === 'es'
        ? 'la persona adulta'
        : 'the grown-up'
      : TERMINO_CUIDADOR[idioma][parentesco];
  const n = nombre?.trim();
  if (!n) return base;
  // US-77: combinar trato + nombre. Sin parentesco o `otro` → solo el nombre.
  const corto = parentesco === undefined ? '' : TERMINO_CUIDADOR_CORTO[idioma][parentesco];
  return corto ? `${corto} ${n}` : n;
}

/**
 * Construye el prompt (system + user) para recomendar actividades, aplicando overrides configurables.
 * US-67: pide actividades más significativas para niños de 2 a 6 años, con instrucciones de al menos
 * 6 pasos numerados y detallados, un objetivo de aprendizaje y materiales sencillos de casa. Las
 * instrucciones se dirigen al adulto por su parentesco (`terminoCuidador`), no como "el adulto".
 */
export function buildActivitiesPrompt(
  input: RecommendActivitiesInput,
  overrides: PromptOverrides = {},
): PromptParts {
  const idioma = input.perfil.idioma.value;
  const { nombre, edad, intereses } = input.perfil;
  const categorias = CATEGORIAS.join(', ');
  const tono = tonoPorEdad(edad.value, idioma);
  const gustos = listaIntereses(intereses, idioma);
  // US-67/US-77: trato del adulto por su parentesco, combinado con su nombre si se conoce.
  const cuidador = terminoCuidador(input.parentesco, idioma, input.nombreCuidador);
  // Trato del adulto acompañante en las instrucciones: su parentesco, no "el adulto" (US-67).
  const trato =
    idioma === 'es'
      ? ` En las instrucciones, refiérete al adulto acompañante como "${cuidador}" (no como "el adulto").`
      : ` In the instructions, refer to the accompanying adult as "${cuidador}" (not as "the adult").`;
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
        cuidador,
      })
    : idioma === 'es'
      ? `Propón ${input.cantidad} actividades sencillas y significativas para ${nombre}, de ${edad.value} años.` +
        acotacion +
        afinidad +
        ` ${tono}` +
        ` Cada actividad necesita una categoría (${categorias}), un título, una descripción ` +
        `breve, un objetivo de aprendizaje breve (qué aprende o practica el niño), ` +
        `una lista de materiales sencillos que suele haber en casa, ` +
        `unas instrucciones en un paso a paso claro de al menos 6 pasos numerados, detallados y ` +
        `concretos (cada paso explica qué hace ${cuidador} y qué hace el niño), ` +
        `sencillos y aptos para niños de 2 a 6 años (que ${cuidador} pueda seguir con el niño), ` +
        `una duración en minutos y un nivel de dificultad de 1 a 3.` +
        trato
      : `Suggest ${input.cantidad} simple, meaningful activities for ${nombre}, aged ${edad.value}.` +
        acotacion +
        afinidad +
        ` ${tono}` +
        ` Each activity needs a category (${categorias}), a title, a short description, ` +
        `a brief learning objective (what the child learns or practices), ` +
        `a list of simple materials commonly found at home, ` +
        `step-by-step instructions with at least 6 detailed, concrete numbered steps ` +
        `(each step explains what ${cuidador} does and what the child does) that are simple and ` +
        `suitable for children aged 2 to 6 (${cuidador} can follow them with the child), ` +
        `a duration in minutes and a difficulty level from 1 to 3.` +
        trato;

  return { system: overrides.system ?? INSTRUCCION_SEGURIDAD[idioma], prompt };
}
