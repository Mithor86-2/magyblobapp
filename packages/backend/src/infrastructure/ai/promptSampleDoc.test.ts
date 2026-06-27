import { describe, expect, it } from 'vitest';
import {
  type ActivitiesSample,
  formatPromptSampleDoc,
  type ImageSample,
  type PromptSample,
  type StorySample,
} from './promptSampleDoc.js';

/**
 * Test del **formateador** del documento de muestra de prompts (US-60). Datos
 * deterministas en memoria, **sin red**: cubre el Markdown que vuelca el script
 * `prompts:dump` (que sí llama a Groq/Gemini y queda fuera del gate). Verifica que
 * cada tipo de caso (cuento, actividades, portada) aparece con su combinación, su
 * prompt enviado y su resultado, y que las portadas **no** incrustan el base64.
 */
const GENERADO_EN = new Date('2026-06-27T10:00:00.000Z');

const cuento: StorySample = {
  tipo: 'cuento',
  combinacion: { tema: 'animales', estilo: 'aventura', idioma: 'es', edad: 5 },
  partes: { system: 'SYS cuento', prompt: 'PROMPT cuento' },
  resultado: { titulo: 'El zorro valiente', cuerpo: 'Érase una vez...', proveedor: 'cloud' },
};

const actividades: ActivitiesSample = {
  tipo: 'actividades',
  combinacion: { tema: 'arte', estilo: 'divertido', idioma: 'en', edad: 4 },
  partes: { system: 'SYS act', prompt: 'PROMPT act' },
  resultado: [
    {
      categoria: 'arte',
      titulo: 'Pintar con dedos',
      descripcion: 'Crear un mural',
      instrucciones: '1. Mojar el dedo. 2. Pintar.',
      duracionMin: 15,
      nivel: 1,
      proveedor: 'cloud',
    },
  ],
};

const portadaOk: ImageSample = {
  tipo: 'portada',
  combinacion: { tema: 'espacio', estilo: 'educativo' },
  titulo: 'Viaje a las estrellas',
  prompt: 'A warm children cover about space',
  resultado: { ok: true, tamanoKb: 120 },
};

const portadaFallo: ImageSample = {
  tipo: 'portada',
  combinacion: { tema: 'magia', estilo: 'aventura' },
  titulo: 'El hechizo amable',
  prompt: 'A warm children cover about magic',
  resultado: { ok: false, detalle: 'sin GEMINI_API_KEY' },
};

describe('formatPromptSampleDoc', () => {
  const casos: PromptSample[] = [cuento, actividades, portadaOk, portadaFallo];
  const doc = formatPromptSampleDoc(casos, GENERADO_EN);

  it('incluye la cabecera con la fecha de generación determinista', () => {
    expect(doc).toContain('# Muestra de prompts (resultados reales)');
    expect(doc).toContain('2026-06-27T10:00:00.000Z');
  });

  it('numera los casos y muestra la combinación de cada uno', () => {
    expect(doc).toContain(
      '### 1. Cuento — tema "animales", estilo "aventura", español (es), 5 años',
    );
    expect(doc).toContain('### 2. Actividades — tema "arte", inglés (en), 4 años');
    expect(doc).toContain('### 3. Portada — tema "espacio", estilo "educativo"');
    expect(doc).toContain('### 4. Portada — tema "magia", estilo "aventura"');
  });

  it('vuelca el system y el prompt realmente enviados del cuento', () => {
    expect(doc).toContain('SYS cuento');
    expect(doc).toContain('PROMPT cuento');
    expect(doc).toContain('**Título:** El zorro valiente');
    expect(doc).toContain('Érase una vez...');
  });

  it('lista las actividades con instrucciones y metadatos', () => {
    expect(doc).toContain('**[arte] Pintar con dedos** — Crear un mural');
    expect(doc).toContain('Instrucciones: 1. Mojar el dedo. 2. Pintar.');
    expect(doc).toContain('(15 min, nivel 1)');
  });

  it('para las portadas registra el estado/tamaño y NO incrusta base64', () => {
    expect(doc).toContain('**Resultado:** imagen generada (≈120 KB)');
    expect(doc).toContain('**Resultado:** sin imagen — sin GEMINI_API_KEY');
    expect(doc).toContain('A warm children cover about space');
    expect(doc).not.toContain('data:image');
    expect(doc).not.toContain('base64,');
  });

  it('separa los casos con una regla horizontal', () => {
    expect(doc).toContain('\n---\n');
  });
});
