import { describe, expect, it, vi } from 'vitest';
import { OllamaProvider } from '../../src/infrastructure/ai/OllamaProvider.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';

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

/** Doble de `fetch` que devuelve `response` como JSON del campo `response` de Ollama. */
function fakeFetch(responseBody: unknown, init?: { ok?: boolean; status?: number }) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ response: JSON.stringify(responseBody) }), {
        status: init?.status ?? 200,
      }),
  ) as unknown as typeof fetch;
}

function provider(fetchFn: typeof fetch): OllamaProvider {
  return new OllamaProvider({ baseUrl: 'http://ollama:11434', model: 'gemma:2b', fetchFn });
}

describe('OllamaProvider', () => {
  it('parsea el cuento del JSON estructurado de Ollama', async () => {
    const fetchFn = fakeFetch({ titulo: 'El bosque', cuerpo: 'Un cuento bonito.' });
    const story = await provider(fetchFn).generateStory({
      perfil: perfil(),
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(story).toMatchObject({
      titulo: 'El bosque',
      cuerpo: 'Un cuento bonito.',
      proveedor: 'local',
    });
    // US-61: el prompt usado (system + user) se devuelve para persistirlo.
    expect(story.prompt).toContain('SYSTEM:');
    expect(story.prompt).toContain('PROMPT:');
  });

  it('llama a /api/generate con el modelo configurado y sin streaming', async () => {
    const fetchFn = fakeFetch({ titulo: 'T', cuerpo: 'C' });
    await provider(fetchFn).generateStory({
      perfil: perfil(),
      temas: ['magia'],
      estilos: ['divertido'],
    });
    const [url, opciones] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('http://ollama:11434/api/generate');
    const body = JSON.parse((opciones as RequestInit).body as string);
    expect(body.model).toBe('gemma:2b');
    expect(body.stream).toBe(false);
    expect(body.format).toBeDefined();
  });

  it('lanza si el cuento llega sin título o cuerpo', async () => {
    const fetchFn = fakeFetch({ titulo: '', cuerpo: '' });
    await expect(
      provider(fetchFn).generateStory({
        perfil: perfil(),
        temas: ['animales'],
        estilos: ['aventura'],
      }),
    ).rejects.toThrow();
  });

  it('lanza ante un error HTTP de Ollama', async () => {
    const fetchFn = vi.fn(
      async () => new Response('boom', { status: 500 }),
    ) as unknown as typeof fetch;
    await expect(
      provider(fetchFn).generateStory({
        perfil: perfil(),
        temas: ['animales'],
        estilos: ['aventura'],
      }),
    ).rejects.toThrow(/500/);
  });

  it('filtra actividades con categoría inválida y respeta la cantidad', async () => {
    const fetchFn = fakeFetch({
      actividades: [
        {
          categoria: 'arte',
          titulo: 'Pintar',
          descripcion: 'Con ceras',
          duracionMin: 10,
          nivel: 1,
        },
        { categoria: 'inventada', titulo: 'X', descripcion: 'Y' },
        { categoria: 'musica', titulo: 'Cantar', descripcion: 'Una canción' },
      ],
    });
    const actividades = await provider(fetchFn).recommendActivities({
      perfil: perfil(),
      cantidad: 5,
    });
    expect(actividades).toHaveLength(2);
    expect(actividades.map((a) => a.categoria)).toEqual(['arte', 'musica']);
  });

  it('descarta nivel y duración fuera de rango (basura del LLM)', async () => {
    const fetchFn = fakeFetch({
      actividades: [
        { categoria: 'logica', titulo: 'Contar', descripcion: 'Hasta diez', nivel: 1000 },
        {
          categoria: 'arte',
          titulo: 'Pintar',
          descripcion: 'Con ceras',
          duracionMin: 999,
          nivel: 2,
        },
      ],
    });
    const actividades = await provider(fetchFn).recommendActivities({
      perfil: perfil(),
      cantidad: 5,
    });
    expect(actividades[0]?.nivel).toBeUndefined(); // 1000 fuera de 1-3
    expect(actividades[1]?.duracionMin).toBeUndefined(); // 999 fuera de 1-60
    expect(actividades[1]?.nivel).toBe(2); // válido se conserva
  });
});
