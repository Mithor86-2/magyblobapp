import { beforeEach, describe, expect, it } from 'vitest';
import { MarkStoryRead } from '../../src/application/use-cases/MarkStoryRead.js';
import { Story } from '../../src/domain/entities/Story.js';
import { NotFoundError } from '../../src/domain/errors.js';
import { InMemoryStoryRepository } from '../support/doubles.js';

describe('MarkStoryRead', () => {
  let stories: InMemoryStoryRepository;
  let useCase: MarkStoryRead;

  beforeEach(async () => {
    stories = new InMemoryStoryRepository();
    await stories.save(
      new Story({
        id: 's-1',
        profileId: 'p-1',
        tema: 'animales',
        estilo: 'aventura',
        titulo: 'Mateo y los animales',
        cuerpo: '...',
        idioma: 'es',
        proveedor: 'mock',
        estado: 'nuevo',
        creadoEn: new Date('2026-06-10T12:00:00.000Z'),
      }),
    );
    useCase = new MarkStoryRead({ stories });
  });

  it('marca el cuento como leído y lo persiste', async () => {
    const out = await useCase.execute({ storyId: 's-1' });
    expect(out.estado).toBe('leido');
    const guardado = await stories.findById('s-1');
    expect(guardado?.estado).toBe('leido');
  });

  it('rechaza si el cuento no existe', async () => {
    await expect(useCase.execute({ storyId: 'nope' })).rejects.toThrow(NotFoundError);
  });
});
