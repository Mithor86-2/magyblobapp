import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAIProvider } from '../../src/infrastructure/ai/createAIProvider.js';
import { MockProvider } from '../../src/infrastructure/ai/MockProvider.js';
import { FallbackProvider } from '../../src/infrastructure/ai/FallbackProvider.js';
import type { SettingsRepository } from '../../src/domain/repositories/SettingsRepository.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import { loadConfig, type Config } from '../../src/config.js';

function config(overrides: Partial<Config> = {}): Config {
  return { ...loadConfig({}), ...overrides };
}

/** SettingsRepository que solo responde a la clave `ai.cloud`. */
function settingsConCloud(aiCloud: string | null): SettingsRepository {
  return { get: async (key) => (key === 'ai.cloud' ? aiCloud : null) };
}

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

const story = {
  perfil: perfil(),
  temas: ['animales' as const],
  estilos: ['aventura' as const],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAIProvider', () => {
  it('en modo mock (sin settings) devuelve un MockProvider', () => {
    expect(createAIProvider(config({ aiProvider: 'mock' }))).toBeInstanceOf(MockProvider);
  });

  it('en modo local (sin settings) devuelve un FallbackProvider', () => {
    expect(createAIProvider(config({ aiProvider: 'local' }))).toBeInstanceOf(FallbackProvider);
  });

  it('ante un AI_PROVIDER desconocido, loadConfig cae a mock', () => {
    expect(loadConfig({ AI_PROVIDER: 'desconocido' }).aiProvider).toBe('mock');
    expect(createAIProvider(loadConfig({ AI_PROVIDER: 'desconocido' }))).toBeInstanceOf(
      MockProvider,
    );
  });

  it('con settings y ai.cloud ausente, usa el modo base (no llama a la nube)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const ai = createAIProvider(config({ aiProvider: 'mock' }), {
      settings: settingsConCloud(null),
    });
    const result = await ai.generateStory(story);
    expect(result.titulo).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('con ai.cloud activo y key en env, genera vía proveedor cloud', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: JSON.stringify({ titulo: 'Nube', cuerpo: 'Cuerpo.' }) } },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal('fetch', fetchSpy);
    const ai = createAIProvider(config({ aiProvider: 'mock', cloudApiKeys: { groq: 'sk-test' } }), {
      settings: settingsConCloud(
        JSON.stringify({ activo: true, target: 'groq', model: 'llama-3.3-70b-versatile' }),
      ),
    });
    const result = await ai.generateStory(story);
    expect(result).toMatchObject({ titulo: 'Nube', cuerpo: 'Cuerpo.', proveedor: 'cloud' });
    expect(result.prompt).toContain('SYSTEM:'); // US-61: prompt usado presente
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
  });

  it('con ai.cloud activo pero sin key en env, cae al modo base (sin red)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const ai = createAIProvider(config({ aiProvider: 'mock', cloudApiKeys: {} }), {
      settings: settingsConCloud(
        JSON.stringify({ activo: true, target: 'groq', model: 'llama-3.3-70b-versatile' }),
      ),
    });
    const result = await ai.generateStory(story);
    expect(result.titulo).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('recomienda actividades vía proveedor cloud cuando está activo (hot-swap)', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    actividades: [
                      { categoria: 'arte', titulo: 'Collage', descripcion: 'Recorta y pega.' },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal('fetch', fetchSpy);
    const ai = createAIProvider(config({ aiProvider: 'mock', cloudApiKeys: { groq: 'sk-test' } }), {
      settings: settingsConCloud(
        JSON.stringify({ activo: true, target: 'groq', model: 'llama-3.3-70b-versatile' }),
      ),
    });
    const acts = await ai.recommendActivities({ ...story, cantidad: 1 });
    expect(acts[0]).toMatchObject({ categoria: 'arte', titulo: 'Collage', proveedor: 'cloud' });
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('con settings, generateImage delega en el modo base y devuelve null (US-59)', async () => {
    // El hot-swap de texto no genera portada: delega en el base (mock → null). Sin
    // GEMINI_API_KEY no se envuelve en ImageCapableProvider, así que devuelve null.
    const ai = createAIProvider(config({ aiProvider: 'mock', cloudApiKeys: {} }), {
      settings: settingsConCloud(null),
    });
    const imagen = await ai.generateImage({
      titulo: 'Un cuento',
      tema: 'animales',
      estilo: 'aventura',
    });
    expect(imagen).toBeNull();
  });

  it('con GEMINI_API_KEY envuelve en ImageCapableProvider y genera la portada (US-59)', async () => {
    // buildImageProvider devuelve GeminiImageProvider (rama image !== null) y
    // createAIProvider envuelve el proveedor de texto en ImageCapableProvider.
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify({ predictions: [{ bytesBase64Encoded: 'QUJD' }] }), {
          status: 200,
        }),
    );
    vi.stubGlobal('fetch', fetchSpy);
    const ai = createAIProvider(
      config({ aiProvider: 'mock', cloudApiKeys: { gemini: 'gm-test' } }),
    );
    const imagen = await ai.generateImage({
      titulo: 'Un cuento',
      tema: 'animales',
      estilo: 'aventura',
    });
    expect(imagen).toContain('data:image/');
    expect(fetchSpy).toHaveBeenCalled();
    // El texto sigue viniendo del modo base a través del decorador.
    const result = await ai.generateStory(story);
    expect(result.titulo).toBeTruthy();
  });

  it('si el proveedor cloud falla, cae a mock (no propaga el error)', async () => {
    const fetchSpy = vi.fn(async () => new Response('boom', { status: 500 }));
    vi.stubGlobal('fetch', fetchSpy);
    const ai = createAIProvider(config({ aiProvider: 'mock', cloudApiKeys: { groq: 'sk-test' } }), {
      settings: settingsConCloud(
        JSON.stringify({ activo: true, target: 'groq', model: 'llama-3.3-70b-versatile' }),
      ),
    });
    const result = await ai.generateStory(story);
    expect(result.titulo).toBeTruthy(); // contenido del MockProvider
    expect(fetchSpy).toHaveBeenCalled();
  });
});
