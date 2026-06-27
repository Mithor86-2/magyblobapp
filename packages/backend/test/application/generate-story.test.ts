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
    const out = await useCase.execute({
      profileId: 'p-1',
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(out.id).toBe('s-1');
    expect(out.idioma).toBe('en');
    expect(out.estado).toBe('nuevo');
    expect(out.titulo).toContain('Mateo');
    expect(out.cuerpo.length).toBeGreaterThan(0);
  });

  it('genera con varios temas y estilos (multi-selección, US-47)', async () => {
    const out = await useCase.execute({
      profileId: 'p-1',
      temas: ['animales', 'espacio'],
      estilos: ['aventura', 'divertido'],
    });
    // El FakeAIProvider refleja la lista en el título/cuerpo.
    expect(out.titulo).toContain('animales, espacio');
    expect(out.cuerpo).toContain('aventura, divertido');
  });

  it('persiste el cuento generado en el repositorio', async () => {
    const out = await useCase.execute({
      profileId: 'p-1',
      temas: ['animales'],
      estilos: ['aventura'],
    });
    const guardado = await stories.findById(out.id);
    expect(guardado?.titulo).toBe(out.titulo);
    expect(guardado?.profileId).toBe('p-1');
  });

  it('persiste el primero de cada lista como valor representativo (sin migración)', async () => {
    const out = await useCase.execute({
      profileId: 'p-1',
      temas: ['espacio', 'animales'],
      estilos: ['divertido', 'aventura'],
    });
    expect(out.tema).toBe('espacio');
    expect(out.estilo).toBe('divertido');
    const guardado = await stories.findById(out.id);
    expect(guardado?.tema).toBe('espacio');
    expect(guardado?.estilo).toBe('divertido');
  });

  it('persiste y devuelve el proveedor efectivo del cuento (US-25)', async () => {
    const out = await useCase.execute({
      profileId: 'p-1',
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(out.proveedor).toBe('mock'); // FakeAIProvider estampa mock
    const guardado = await stories.findById(out.id);
    expect(guardado?.proveedor).toBe('mock');
  });

  it('rechaza una lista de temas vacía', async () => {
    await expect(
      useCase.execute({ profileId: 'p-1', temas: [], estilos: ['aventura'] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza una lista de estilos vacía', async () => {
    await expect(
      useCase.execute({ profileId: 'p-1', temas: ['animales'], estilos: [] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza temas duplicados', async () => {
    await expect(
      useCase.execute({ profileId: 'p-1', temas: ['animales', 'animales'], estilos: ['aventura'] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza un tema fuera del vocabulario', async () => {
    await expect(
      useCase.execute({ profileId: 'p-1', temas: ['piratas'], estilos: ['aventura'] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza un estilo fuera del vocabulario', async () => {
    await expect(
      useCase.execute({ profileId: 'p-1', temas: ['animales'], estilos: ['terror'] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza si el perfil no existe', async () => {
    await expect(
      useCase.execute({ profileId: 'nope', temas: ['animales'], estilos: ['aventura'] }),
    ).rejects.toThrow(DomainError);
  });

  // --- Portada de imagen (US-59) ---

  it('persiste la portada generada cuando el proveedor la devuelve', async () => {
    const ai = new FakeAIProvider('data:image/png;base64,ABC');
    useCase = new GenerateStory({
      profiles,
      stories,
      ai,
      newId: secuencialIdGenerator('s'),
      now: relojFijo(),
    });
    const out = await useCase.execute({
      profileId: 'p-1',
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(out.portada).toBe('data:image/png;base64,ABC');
    const guardado = await stories.findById(out.id);
    expect(guardado?.portada).toBe('data:image/png;base64,ABC');
  });

  it('construye el prompt de imagen con tema/estilo/título y SIN el nombre del niño (C-5)', async () => {
    const ai = new FakeAIProvider('data:image/png;base64,ABC');
    useCase = new GenerateStory({
      profiles,
      stories,
      ai,
      newId: secuencialIdGenerator('s'),
      now: relojFijo(),
    });
    await useCase.execute({ profileId: 'p-1', temas: ['espacio'], estilos: ['divertido'] });
    expect(ai.imagenCalls).toHaveLength(1);
    const input = ai.imagenCalls[0]!;
    expect(input.tema).toBe('espacio');
    expect(input.estilo).toBe('divertido');
    // El nombre del perfil ('Mateo') nunca debe aparecer en la entrada de imagen.
    expect(JSON.stringify(input)).not.toContain('Mateo');
  });

  it('crea el cuento igual si la imagen no se genera (proveedor devuelve null)', async () => {
    // FakeAIProvider por defecto devuelve null en generateImage.
    const out = await useCase.execute({
      profileId: 'p-1',
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(out.id).toBe('s-1');
    expect(out.portada).toBeUndefined();
    expect(await stories.findById(out.id)).not.toBeNull();
  });

  it('crea el cuento igual aunque la generación de imagen lance (best-effort)', async () => {
    const ai = new FakeAIProvider(() => {
      throw new Error('imagen caída');
    });
    useCase = new GenerateStory({
      profiles,
      stories,
      ai,
      newId: secuencialIdGenerator('s'),
      now: relojFijo(),
    });
    const out = await useCase.execute({
      profileId: 'p-1',
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(out.id).toBe('s-1');
    expect(out.portada).toBeUndefined();
    expect(await stories.findById(out.id)).not.toBeNull();
  });
});
