import { describe, expect, it, vi } from 'vitest';

import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import { CloudProvider } from '../../src/infrastructure/ai/CloudProvider.js';
import type { AILogger } from '../../src/infrastructure/ai/FallbackProvider.js';
import { OllamaProvider } from '../../src/infrastructure/ai/OllamaProvider.js';

function perfil(): ChildProfile {
  return new ChildProfile({
    id: 'p-1',
    guardianId: 'g-1',
    nombre: 'Mateo',
    edad: Edad.create(4),
    idioma: Idioma.create('es'),
    avatar: 'a1',
    intereses: ['animales'],
    creadoEn: new Date('2026-06-10T12:00:00.000Z'),
  });
}

const story = { perfil: perfil(), tema: 'animales' as const, estilo: 'aventura' as const };

function loggerEspia(): AILogger & {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
} {
  return { info: vi.fn(), warn: vi.fn() };
}

/** `fetch` falso que devuelve la respuesta de Ollama (`{response: "<json>"}`). */
function fetchOllama(json: object): typeof fetch {
  return vi.fn(
    async () => new Response(JSON.stringify({ response: JSON.stringify(json) }), { status: 200 }),
  ) as unknown as typeof fetch;
}

/** `fetch` falso que devuelve la respuesta cloud (OpenAI `choices[0].message.content`). */
function fetchCloud(json: object): typeof fetch {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(json) } }] }), {
        status: 200,
      }),
  ) as unknown as typeof fetch;
}

describe('logging de prompts de IA (US-34)', () => {
  it('OllamaProvider loguea (info) el prompt + config y la respuesta al generar un cuento', async () => {
    const logger = loggerEspia();
    const provider = new OllamaProvider({
      baseUrl: 'http://ollama',
      model: 'gemma:2b',
      fetchFn: fetchOllama({ titulo: 'T', cuerpo: 'C' }),
      logger,
    });

    await provider.generateStory(story);

    const prompts = logger.info.mock.calls.filter((c) => c[1] === 'IA: prompt enviado al LLM');
    const respuestas = logger.info.mock.calls.filter((c) => c[1] === 'IA: respuesta del LLM');
    expect(prompts).toHaveLength(1);
    expect(respuestas).toHaveLength(1);

    const meta = prompts[0][0] as Record<string, unknown>;
    expect(meta.op).toBe('generateStory');
    expect(meta.proveedor).toBe('local');
    expect(meta.model).toBe('gemma:2b');
    expect(typeof meta.system).toBe('string');
    expect(String(meta.prompt)).toContain('Mateo'); // el prompt lleva el nombre (PII, ver C-5)
    expect(meta.config).toMatchObject({ plantilla: 'defecto' });
    expect((respuestas[0][0] as Record<string, unknown>).respuesta).toEqual({
      titulo: 'T',
      cuerpo: 'C',
    });
  });

  it('OllamaProvider loguea la cantidad al recomendar actividades', async () => {
    const logger = loggerEspia();
    const provider = new OllamaProvider({
      baseUrl: 'http://ollama',
      model: 'gemma:2b',
      fetchFn: fetchOllama({
        actividades: [
          { categoria: 'arte', titulo: 'Pintar', descripcion: 'Dibuja', duracionMin: 10, nivel: 1 },
        ],
      }),
      logger,
    });

    await provider.recommendActivities({ perfil: perfil(), cantidad: 3 });

    const prompt = logger.info.mock.calls.find((c) => c[1] === 'IA: prompt enviado al LLM');
    expect(prompt).toBeDefined();
    const meta = prompt![0] as Record<string, unknown>;
    expect(meta.op).toBe('recommendActivities');
    expect(meta.config).toMatchObject({ cantidad: 3 });
  });

  it('CloudProvider loguea (info) prompt y respuesta con proveedor cloud', async () => {
    const logger = loggerEspia();
    const provider = new CloudProvider({
      baseUrl: 'http://cloud/v1',
      apiKey: 'sk-test',
      model: 'llama-3.3-70b-versatile',
      fetchFn: fetchCloud({ titulo: 'T', cuerpo: 'C' }),
      logger,
    });

    await provider.generateStory(story);

    const prompt = logger.info.mock.calls.find((c) => c[1] === 'IA: prompt enviado al LLM');
    const respuesta = logger.info.mock.calls.find((c) => c[1] === 'IA: respuesta del LLM');
    expect(prompt).toBeDefined();
    expect(respuesta).toBeDefined();
    expect((prompt![0] as Record<string, unknown>).proveedor).toBe('cloud');
    expect((prompt![0] as Record<string, unknown>).model).toBe('llama-3.3-70b-versatile');
  });

  it('si el logger no aporta `info` (solo warn), no falla la generación', async () => {
    const provider = new OllamaProvider({
      baseUrl: 'http://ollama',
      model: 'gemma:2b',
      fetchFn: fetchOllama({ titulo: 'T', cuerpo: 'C' }),
      logger: { warn: vi.fn() }, // AILogger sin info (compatibilidad)
    });

    const result = await provider.generateStory(story);
    expect(result.titulo).toBe('T');
  });
});
