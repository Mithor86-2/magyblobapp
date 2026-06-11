import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateStory } from '../../src/application/use-cases/GenerateStory.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { DomainError } from '../../src/domain/errors.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import {
  FakeAIProvider,
  InMemoryChildProfileRepository,
  InMemoryStoryRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

describe('GenerateStory', () => {
  let profiles: InMemoryChildProfileRepository;
  let stories: InMemoryStoryRepository;
  let useCase: GenerateStory;

  beforeEach(async () => {
    profiles = new InMemoryChildProfileRepository();
    stories = new InMemoryStoryRepository();
    await profiles.save(
      new ChildProfile({
        id: 'p-1',
        guardianId: 'g-1',
        nombre: 'Mateo',
        edad: Edad.create(4),
        idioma: Idioma.create('en'),
        avatar: 'a1',
        intereses: ['animales'],
        creadoEn: new Date('2026-06-10T12:00:00.000Z'),
      }),
    );
    useCase = new GenerateStory({
      profiles,
      stories,
      ai: new FakeAIProvider(),
      newId: secuencialIdGenerator('s'),
      now: relojFijo(),
    });
  });

  it('genera un cuento en el idioma del perfil y en estado nuevo', async () => {
    const out = await useCase.execute({ profileId: 'p-1', tema: 'animales', estilo: 'aventura' });
    expect(out.id).toBe('s-1');
    expect(out.idioma).toBe('en');
    expect(out.estado).toBe('nuevo');
    expect(out.titulo).toContain('Mateo');
    expect(out.cuerpo.length).toBeGreaterThan(0);
  });

  it('persiste el cuento generado en el repositorio', async () => {
    const out = await useCase.execute({ profileId: 'p-1', tema: 'animales', estilo: 'aventura' });
    const guardado = await stories.findById(out.id);
    expect(guardado?.titulo).toBe(out.titulo);
    expect(guardado?.profileId).toBe('p-1');
  });

  it('rechaza un tema fuera del vocabulario', async () => {
    await expect(
      useCase.execute({ profileId: 'p-1', tema: 'piratas', estilo: 'aventura' }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza si el perfil no existe', async () => {
    await expect(
      useCase.execute({ profileId: 'nope', tema: 'animales', estilo: 'aventura' }),
    ).rejects.toThrow(DomainError);
  });
});
