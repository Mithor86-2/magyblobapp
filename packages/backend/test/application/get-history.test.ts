import { beforeEach, describe, expect, it } from 'vitest';
import { GetHistory } from '../../src/application/use-cases/GetHistory.js';
import { Story } from '../../src/domain/entities/Story.js';
import { Activity } from '../../src/domain/entities/Activity.js';
import { InMemoryActivityRepository, InMemoryStoryRepository } from '../support/doubles.js';

describe('GetHistory', () => {
  let stories: InMemoryStoryRepository;
  let activities: InMemoryActivityRepository;
  let useCase: GetHistory;

  beforeEach(async () => {
    stories = new InMemoryStoryRepository();
    activities = new InMemoryActivityRepository();
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
    await activities.save(
      new Activity({
        id: 'a-1',
        profileId: 'p-1',
        categoria: 'arte',
        titulo: 'Pintar un dragón',
        descripcion: '...',
        proveedor: 'mock',
      }),
    );
  });

  it('devuelve los cuentos y actividades del perfil', async () => {
    useCase = new GetHistory({ stories, activities });
    const out = await useCase.execute({ profileId: 'p-1' });
    expect(out.stories).toHaveLength(1);
    expect(out.activities).toHaveLength(1);
    expect(out.stories[0]?.titulo).toBe('Mateo y los animales');
    expect(out.activities[0]?.titulo).toBe('Pintar un dragón');
  });

  it('devuelve listas vacías para un perfil sin contenido', async () => {
    useCase = new GetHistory({ stories, activities });
    const out = await useCase.execute({ profileId: 'otro' });
    expect(out.stories).toEqual([]);
    expect(out.activities).toEqual([]);
  });
});
