import { describe, expect, it, vi } from 'vitest';
import { CloudProvider } from '../../src/infrastructure/ai/CloudProvider.js';
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

/** Doble de `fetch` con la forma compatible OpenAI: choices[].message.content. */
function fakeFetch(content: unknown, init?: { status?: number }) {
  return vi.fn(
    async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }),
        { status: init?.status ?? 200 },
      ),
  ) as unknown as typeof fetch;
}

function provider(fetchFn: typeof fetch): CloudProvider {
  return new CloudProvider({
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: 'sk-test',
    model: 'llama-3.3-70b-versatile',
    fetchFn,
  });
}

describe('CloudProvider', () => {
  it('parsea el cuento del contenido del mensaje', async () => {
    const fetchFn = fakeFetch({ titulo: 'El bosque', cuerpo: 'Un cuento bonito.' });
    const story = await provider(fetchFn).generateStory({
      perfil: perfil(),
      tema: 'animales',
      estilo: 'aventura',
    });
    expect(story).toEqual({ titulo: 'El bosque', cuerpo: 'Un cuento bonito.' });
  });

  it('llama a /chat/completions con Bearer, modelo y response_format json_object', async () => {
    const fetchFn = fakeFetch({ titulo: 'T', cuerpo: 'C' });
    await provider(fetchFn).generateStory({ perfil: perfil(), tema: 'magia', estilo: 'divertido' });
    const [url, opciones] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    const init = opciones as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer sk-test');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
  });

  it('lanza ante un error HTTP del proveedor', async () => {
    const fetchFn = vi.fn(
      async () => new Response('boom', { status: 401 }),
    ) as unknown as typeof fetch;
    await expect(
      provider(fetchFn).generateStory({ perfil: perfil(), tema: 'animales', estilo: 'aventura' }),
    ).rejects.toThrow(/401/);
  });

  it('lanza si el cuento llega sin título o cuerpo', async () => {
    const fetchFn = fakeFetch({ titulo: '', cuerpo: '' });
    await expect(
      provider(fetchFn).generateStory({ perfil: perfil(), tema: 'animales', estilo: 'aventura' }),
    ).rejects.toThrow();
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
});
