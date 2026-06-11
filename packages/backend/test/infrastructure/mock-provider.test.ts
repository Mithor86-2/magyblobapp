import { describe, expect, it } from 'vitest';
import { MockProvider } from '../../src/infrastructure/ai/MockProvider.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import { CATEGORIAS, type Tema } from '../../src/domain/vocabulary.js';

function perfil(idioma: 'es' | 'en', intereses: Tema[] = ['animales']): ChildProfile {
  return new ChildProfile({
    id: 'p-1',
    guardianId: 'g-1',
    nombre: 'Lola',
    edad: Edad.create(5),
    idioma: Idioma.create(idioma),
    avatar: 'a1',
    intereses,
    creadoEn: new Date('2026-06-10T12:00:00.000Z'),
  });
}

describe('MockProvider', () => {
  const provider = new MockProvider();

  it('genera un cuento en español con título y cuerpo no vacíos', async () => {
    const story = await provider.generateStory({
      perfil: perfil('es'),
      tema: 'animales',
      estilo: 'aventura',
    });
    expect(story.titulo).toContain('Lola');
    expect(story.titulo).toContain('animales');
    expect(story.cuerpo.length).toBeGreaterThan(0);
    expect(story.cuerpo).toContain('Había una vez');
  });

  it('genera el cuento en inglés cuando el perfil es en', async () => {
    const story = await provider.generateStory({
      perfil: perfil('en'),
      tema: 'espacio',
      estilo: 'divertido',
    });
    expect(story.cuerpo).toContain('Once upon a time');
  });

  it('es determinista: misma entrada, misma salida', async () => {
    const input = { perfil: perfil('es'), tema: 'magia' as const, estilo: 'educativo' as const };
    const a = await provider.generateStory(input);
    const b = await provider.generateStory(input);
    expect(a).toEqual(b);
  });

  it('devuelve la cantidad de actividades pedida con categorías válidas', async () => {
    const actividades = await provider.recommendActivities({ perfil: perfil('es'), cantidad: 4 });
    expect(actividades).toHaveLength(4);
    for (const a of actividades) {
      expect(CATEGORIAS).toContain(a.categoria);
      expect(a.titulo.length).toBeGreaterThan(0);
      expect(a.descripcion.length).toBeGreaterThan(0);
    }
  });

  it('respeta la categoría cuando se acota', async () => {
    const actividades = await provider.recommendActivities({
      perfil: perfil('es'),
      categoria: 'musica',
      cantidad: 3,
    });
    expect(actividades.every((a) => a.categoria === 'musica')).toBe(true);
  });
});
