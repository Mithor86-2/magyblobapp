import { describe, expect, it, vi } from 'vitest';
import { FallbackProvider, type AILogger } from '../../src/infrastructure/ai/FallbackProvider.js';
import { MockProvider } from '../../src/infrastructure/ai/MockProvider.js';
import type {
  AIProvider,
  GenerateStoryInput,
  RecommendActivitiesInput,
} from '../../src/domain/ai/AIProvider.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';

function perfil(): ChildProfile {
  return new ChildProfile({
    id: 'p-1',
    guardianId: 'g-1',
    nombre: 'Lola',
    edad: Edad.create(5),
    idioma: Idioma.create('es'),
    avatar: 'a1',
    intereses: ['animales'],
    creadoEn: new Date('2026-06-10T12:00:00.000Z'),
  });
}

/** Proveedor que siempre falla, para forzar el fallback. */
class BrokenProvider implements AIProvider {
  async generateStory(_input: GenerateStoryInput): Promise<never> {
    throw new Error('Ollama caído');
  }
  async recommendActivities(_input: RecommendActivitiesInput): Promise<never> {
    throw new Error('Ollama caído');
  }
}

/** Proveedor que responde con contenido marcado, para detectar que se usó el primary. */
class OkProvider implements AIProvider {
  async generateStory() {
    return { titulo: 'PRIMARY', cuerpo: 'del primary' };
  }
  async recommendActivities() {
    return [{ categoria: 'arte' as const, titulo: 'PRIMARY', descripcion: 'del primary' }];
  }
}

describe('FallbackProvider', () => {
  it('usa el proveedor primario cuando responde', async () => {
    const provider = new FallbackProvider(new OkProvider(), new MockProvider());
    const story = await provider.generateStory({
      perfil: perfil(),
      tema: 'animales',
      estilo: 'aventura',
    });
    expect(story.titulo).toBe('PRIMARY');
  });

  it('cae al mock cuando el primario falla y registra un warn', async () => {
    const logger: AILogger = { warn: vi.fn() };
    const provider = new FallbackProvider(new BrokenProvider(), new MockProvider(), logger);
    const story = await provider.generateStory({
      perfil: perfil(),
      tema: 'animales',
      estilo: 'aventura',
    });
    expect(story.titulo).toContain('Lola');
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('también cae al mock en recommendActivities', async () => {
    const provider = new FallbackProvider(new BrokenProvider(), new MockProvider());
    const actividades = await provider.recommendActivities({ perfil: perfil(), cantidad: 2 });
    expect(actividades).toHaveLength(2);
  });
});
