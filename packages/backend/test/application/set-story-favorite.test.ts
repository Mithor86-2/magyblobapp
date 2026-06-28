import { beforeEach, describe, expect, it } from 'vitest';
import { SetStoryFavorite } from '../../src/application/use-cases/SetStoryFavorite.js';
import { Story } from '../../src/domain/entities/Story.js';
import { NotFoundError } from '../../src/domain/errors.js';
import { InMemoryStoryRepository } from '../support/doubles.js';

describe('SetStoryFavorite', () => {
  let stories: InMemoryStoryRepository;
  let useCase: SetStoryFavorite;

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
    useCase = new SetStoryFavorite({ stories });
  });

  it('marca el cuento como favorito y lo persiste', async () => {
    const out = await useCase.execute({ storyId: 's-1', favorito: true });
    expect(out.favorito).toBe(true);
    const guardado = await stories.findById('s-1');
    expect(guardado?.favorito).toBe(true);
  });

  it('desmarca el favorito (idempotente)', async () => {
    await useCase.execute({ storyId: 's-1', favorito: true });
    const out = await useCase.execute({ storyId: 's-1', favorito: false });
    expect(out.favorito).toBe(false);
    const guardado = await stories.findById('s-1');
    expect(guardado?.favorito).toBe(false);
  });

  it('rechaza si el cuento no existe', async () => {
    await expect(useCase.execute({ storyId: 'nope', favorito: true })).rejects.toThrow(
      NotFoundError,
    );
  });
});
