import { beforeEach, describe, expect, it } from 'vitest';
import { ContinueStory, siguienteTitulo } from '../../src/application/use-cases/ContinueStory.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { Story } from '../../src/domain/entities/Story.js';
import { NotFoundError } from '../../src/domain/errors.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import {
  FakeAIProvider,
  InMemoryChildProfileRepository,
  InMemoryStoryRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

describe('ContinueStory (US-78)', () => {
  let profiles: InMemoryChildProfileRepository;
  let stories: InMemoryStoryRepository;
  let ai: FakeAIProvider;
  let useCase: ContinueStory;

  beforeEach(async () => {
    profiles = new InMemoryChildProfileRepository();
    stories = new InMemoryStoryRepository();
    ai = new FakeAIProvider();
    await profiles.save(
      new ChildProfile({
        id: 'p-1',
        guardianId: 'g-1',
        nombre: 'Mateo',
        edad: Edad.create(4),
        idioma: Idioma.create('es'),
        avatar: 'a1',
        intereses: ['animales'],
        creadoEn: new Date('2026-06-10T12:00:00.000Z'),
      }),
    );
    await stories.save(
      new Story({
        id: 's-origen',
        profileId: 'p-1',
        tema: 'animales',
        estilo: 'aventura',
        ensenanza: 'amistad',
        titulo: 'Mateo y los animales',
        cuerpo: 'Había una vez Mateo. Vivía una gran aventura. Fin del primer capítulo.',
        idioma: 'es',
        proveedor: 'mock',
        portada: 'data:image/png;base64,ORIG',
        creadoEn: new Date('2026-06-10T12:00:00.000Z'),
      }),
    );
    useCase = new ContinueStory({
      profiles,
      stories,
      ai,
      newId: secuencialIdGenerator('cont'),
      now: relojFijo(),
    });
  });

  it('genera un cuento nuevo enlazado al origen (continuacionDe) heredando tema/estilo/enseñanza', async () => {
    const out = await useCase.execute({ storyId: 's-origen' });
    expect(out.id).toBe('cont-1');
    expect(out.tema).toBe('animales');
    expect(out.estilo).toBe('aventura');
    expect(out.ensenanza).toBe('amistad');
    expect(out.estado).toBe('nuevo');
    // El enlace se persiste (solo BD; no se expone en el DTO público).
    expect((out as Record<string, unknown>).continuacionDe).toBeUndefined();
    const guardado = await stories.findById('cont-1');
    expect(guardado?.continuacionDe).toBe('s-origen');
  });

  it('pasa el cuerpo del cuento origen como contexto al proveedor de IA', async () => {
    await useCase.execute({ storyId: 's-origen' });
    expect(ai.storyCalls).toHaveLength(1);
    expect(ai.storyCalls[0]?.contexto).toContain('Había una vez Mateo');
  });

  it('reutiliza la portada del cuento origen', async () => {
    const out = await useCase.execute({ storyId: 's-origen' });
    expect(out.portada).toBe('data:image/png;base64,ORIG');
  });

  it('el título es el del origen con el número de capítulo (→ 2)', async () => {
    const out = await useCase.execute({ storyId: 's-origen' });
    // Origen: "Mateo y los animales" → continuación "Mateo y los animales 2".
    expect(out.titulo).toBe('Mateo y los animales 2');
  });

  it('encadena el número al continuar una continuación (2 → 3)', async () => {
    await stories.save(
      new Story({
        id: 's-cap2',
        profileId: 'p-1',
        tema: 'animales',
        estilo: 'aventura',
        titulo: 'Mateo y los animales 2',
        cuerpo: 'Segundo capítulo. Sigue la aventura. Fin.',
        idioma: 'es',
        proveedor: 'mock',
        creadoEn: new Date('2026-06-10T12:00:00.000Z'),
      }),
    );
    const out = await useCase.execute({ storyId: 's-cap2' });
    expect(out.titulo).toBe('Mateo y los animales 3');
  });

  it('persiste la continuación en el repositorio (queda en el historial del perfil)', async () => {
    await useCase.execute({ storyId: 's-origen' });
    const delPerfil = await stories.findByProfile('p-1');
    expect(delPerfil).toHaveLength(2);
  });

  it('recorta el contexto de un cuento origen muy largo (conserva el final)', async () => {
    const cuerpoLargo = `Inicio irrelevante. ${'palabra '.repeat(400)}Final memorable del cuento.`;
    await stories.save(
      new Story({
        id: 's-largo',
        profileId: 'p-1',
        tema: 'animales',
        estilo: 'aventura',
        titulo: 'Cuento largo',
        cuerpo: cuerpoLargo,
        idioma: 'es',
        proveedor: 'mock',
        creadoEn: new Date('2026-06-10T12:00:00.000Z'),
      }),
    );
    await useCase.execute({ storyId: 's-largo' });
    const contexto = ai.storyCalls[0]?.contexto ?? '';
    expect(contexto.length).toBeLessThanOrEqual(1200);
    expect(contexto).toContain('Final memorable del cuento.');
    // No empieza cortando una palabra a la mitad.
    expect(contexto.startsWith('palabra')).toBe(true);
  });

  it('rechaza si el cuento origen no existe', async () => {
    await expect(useCase.execute({ storyId: 'nope' })).rejects.toThrow(NotFoundError);
  });

  it('rechaza si el perfil del cuento origen no existe', async () => {
    await stories.save(
      new Story({
        id: 's-huerfano',
        profileId: 'p-fantasma',
        tema: 'magia',
        estilo: 'divertido',
        titulo: 'Sin perfil',
        cuerpo: 'Cuerpo.',
        idioma: 'es',
        proveedor: 'mock',
        creadoEn: new Date('2026-06-10T12:00:00.000Z'),
      }),
    );
    await expect(useCase.execute({ storyId: 's-huerfano' })).rejects.toThrow(NotFoundError);
  });
});

describe('siguienteTitulo (US-78)', () => {
  it('añade " 2" a un título sin número', () => {
    expect(siguienteTitulo('Joaquín en el bosque')).toBe('Joaquín en el bosque 2');
  });

  it('incrementa el número final existente', () => {
    expect(siguienteTitulo('Joaquín en el bosque 2')).toBe('Joaquín en el bosque 3');
    expect(siguienteTitulo('Joaquín en el bosque 9')).toBe('Joaquín en el bosque 10');
  });

  it('recorta espacios y trata un título que es solo un número como base', () => {
    expect(siguienteTitulo('  Cuento  ')).toBe('Cuento 2');
    // "7" no tiene base textual → se trata como título y se le añade " 2".
    expect(siguienteTitulo('7')).toBe('7 2');
  });
});
