/**
 * Documento de muestra de prompts (US-60). Script **on-demand** (estilo `smoke-cloud.ts`,
 * `pnpm --filter @magyblob/backend prompts:dump`): NO es un test automatizado ni entra en
 * el gate. Recorre un conjunto **representativo** de combinaciones, construye los prompts
 * reales y obtiene los resultados llamando a los proveedores de verdad:
 *
 *   - CUENTOS y ACTIVIDADES: `buildStoryPrompt`/`buildActivitiesPrompt` + **Groq** (CloudProvider).
 *   - PORTADAS: `buildImagePrompt` + **Gemini** (GeminiImageProvider); solo se registra si
 *     devolvió imagen y su tamaño (nunca el base64 entero).
 *
 * Vuelca el resultado a `Docs/muestra-prompts.md` (sobrescribible). Requiere `GROQ_API_KEY`
 * y `GEMINI_API_KEY`; si falta alguna, aborta con un mensaje claro.
 *
 * El **formateador** del documento (`promptSampleDoc.ts`) es puro y tiene su test en el gate;
 * aquí solo vive la parte de red y el muestreo de combinaciones.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';
import { CloudProvider } from '../src/infrastructure/ai/CloudProvider.js';
import { GeminiImageProvider } from '../src/infrastructure/ai/GeminiImageProvider.js';
import { CLOUD_PRESETS } from '../src/infrastructure/ai/cloudPresets.js';
import {
  buildActivitiesPrompt,
  buildImagePrompt,
  buildStoryPrompt,
} from '../src/infrastructure/ai/prompts.js';
import {
  formatPromptSampleDoc,
  type PromptSample,
} from '../src/infrastructure/ai/promptSampleDoc.js';
import { ChildProfile } from '../src/domain/entities/ChildProfile.js';
import { Edad } from '../src/domain/value-objects/Edad.js';
import { Idioma } from '../src/domain/value-objects/Idioma.js';
import type { CodigoIdioma } from '../src/domain/value-objects/Idioma.js';
import type { Categoria, Estilo, Tema } from '../src/domain/vocabulary.js';

const MODELO_GROQ = process.env.SMOKE_CLOUD_MODEL ?? 'llama-3.3-70b-versatile';

/**
 * Muestreo **representativo** (no el producto cartesiano): cada tema aparece una vez y
 * cada estilo una vez emparejados, alternando idioma ES/EN y dos edades (4 y 6). Cinco
 * temas × (un estilo cada uno) cubre los cinco temas y los tres estilos.
 */
const CASOS_CUENTO: { tema: Tema; estilo: Estilo; idioma: CodigoIdioma; edad: number }[] = [
  { tema: 'animales', estilo: 'aventura', idioma: 'es', edad: 4 },
  { tema: 'espacio', estilo: 'divertido', idioma: 'en', edad: 6 },
  { tema: 'magia', estilo: 'educativo', idioma: 'es', edad: 6 },
  { tema: 'aventuras', estilo: 'aventura', idioma: 'en', edad: 4 },
  { tema: 'musica', estilo: 'divertido', idioma: 'es', edad: 5 },
];

/** Una actividad por categoría, alternando idioma y edad. */
const CASOS_ACTIVIDAD: { categoria: Categoria; idioma: CodigoIdioma; edad: number }[] = [
  { categoria: 'arte', idioma: 'es', edad: 4 },
  { categoria: 'musica', idioma: 'en', edad: 6 },
  { categoria: 'logica', idioma: 'es', edad: 5 },
];

/** Portadas: cada tema una vez con un estilo, cubriendo los tres estilos. */
const CASOS_PORTADA: { tema: Tema; estilo: Estilo; titulo: string }[] = [
  { tema: 'animales', estilo: 'aventura', titulo: 'La gran aventura del erizo' },
  { tema: 'espacio', estilo: 'educativo', titulo: 'Un paseo entre estrellas' },
  { tema: 'magia', estilo: 'divertido', titulo: 'La varita despistada' },
];

/** Perfil mínimo para construir los prompts (nombre genérico, no PII real). */
function perfilDe(idioma: CodigoIdioma, edad: number, intereses: Tema[]): ChildProfile {
  return new ChildProfile({
    id: 'dump-1',
    guardianId: 'dump-g',
    nombre: idioma === 'es' ? 'Lola' : 'Mia',
    edad: Edad.create(edad),
    idioma: Idioma.create(idioma),
    avatar: 'a1',
    intereses,
    creadoEn: new Date(),
  });
}

/** Tamaño aproximado en KB de una data URL base64 (sin contar la cabecera `data:`). */
function tamanoKbDataUrl(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.round((base64.length * 3) / 4 / 1024);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const groqKey = config.cloudApiKeys.groq;
  const geminiKey = config.cloudApiKeys.gemini;
  const faltan = [
    groqKey === undefined ? 'GROQ_API_KEY' : null,
    geminiKey === undefined ? 'GEMINI_API_KEY' : null,
  ].filter((x): x is string => x !== null);
  if (faltan.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${faltan.join(', ')}. ` +
        'Este script llama a Groq (cuentos/actividades) y Gemini (portadas) de verdad.',
    );
  }

  const groq = new CloudProvider({
    baseUrl: CLOUD_PRESETS.groq.baseUrl,
    apiKey: groqKey!,
    model: MODELO_GROQ,
    timeoutMs: config.aiTimeoutMs,
  });
  const gemini = new GeminiImageProvider({ apiKey: geminiKey!, timeoutMs: config.aiTimeoutMs });

  const casos: PromptSample[] = [];

  console.log(`▶ Groq (${MODELO_GROQ}) y Gemini/Imagen · volcando muestra de prompts\n`);

  for (const c of CASOS_CUENTO) {
    console.log(`— cuento: ${c.tema}/${c.estilo}/${c.idioma}/${c.edad}`);
    const perfil = perfilDe(c.idioma, c.edad, [c.tema]);
    const partes = buildStoryPrompt({ perfil, temas: [c.tema], estilos: [c.estilo] });
    const resultado = await groq.generateStory({ perfil, temas: [c.tema], estilos: [c.estilo] });
    casos.push({ tipo: 'cuento', combinacion: c, partes, resultado });
  }

  for (const c of CASOS_ACTIVIDAD) {
    console.log(`— actividades: ${c.categoria}/${c.idioma}/${c.edad}`);
    const perfil = perfilDe(c.idioma, c.edad, ['animales']);
    const partes = buildActivitiesPrompt({ perfil, categoria: c.categoria, cantidad: 3 });
    const resultado = await groq.recommendActivities({
      perfil,
      categoria: c.categoria,
      cantidad: 3,
    });
    casos.push({
      tipo: 'actividades',
      combinacion: { tema: c.categoria, estilo: '—', idioma: c.idioma, edad: c.edad },
      partes,
      resultado,
    });
  }

  for (const c of CASOS_PORTADA) {
    console.log(`— portada: ${c.tema}/${c.estilo}`);
    const prompt = buildImagePrompt(c.tema, c.estilo, c.titulo);
    const dataUrl = await gemini.generateImage(prompt);
    casos.push({
      tipo: 'portada',
      combinacion: { tema: c.tema, estilo: c.estilo },
      titulo: c.titulo,
      prompt,
      resultado:
        dataUrl === null
          ? { ok: false, detalle: 'Gemini no devolvió imagen (ver log de aviso)' }
          : { ok: true, tamanoKb: tamanoKbDataUrl(dataUrl) },
    });
  }

  const aquí = dirname(fileURLToPath(import.meta.url));
  const destino = resolve(aquí, '../../../Docs/muestra-prompts.md');
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, formatPromptSampleDoc(casos, new Date()), 'utf8');
  console.log(`\n✔ Documento escrito en ${destino} (${casos.length} casos).`);
}

main().catch((error: unknown) => {
  console.error('✖ prompts:dump falló:', error instanceof Error ? error.message : error);
  process.exit(1);
});
