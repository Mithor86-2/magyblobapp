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
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(story.titulo).toContain('Lola');
    expect(story.titulo).toContain('animales');
    expect(story.cuerpo.length).toBeGreaterThan(0);
    expect(story.cuerpo).toContain('Había una vez');
  });

  it('genera el cuento en inglés cuando el perfil es en', async () => {
    const story = await provider.generateStory({
      perfil: perfil('en'),
      temas: ['espacio'],
      estilos: ['divertido'],
    });
    expect(story.cuerpo).toContain('Once upon a time');
  });

  it('es determinista: misma entrada, misma salida', async () => {
    const input = {
      perfil: perfil('es'),
      temas: ['magia' as const],
      estilos: ['educativo' as const],
    };
    const a = await provider.generateStory(input);
    const b = await provider.generateStory(input);
    expect(a).toEqual(b);
  });

  it('US-54: varía el título según el tema (no usa siempre la misma fórmula)', async () => {
    const temasDistintos: Tema[] = ['animales', 'espacio', 'magia', 'aventuras', 'musica'];
    const titulos = await Promise.all(
      temasDistintos.map((t) =>
        provider
          .generateStory({ perfil: perfil('es'), temas: [t], estilos: ['aventura'] })
          .then((s) => s.titulo),
      ),
    );
    // Al menos dos plantillas distintas aparecen entre los temas (no es siempre la misma fórmula).
    const sinTema = titulos.map((t, i) => t.replace(temasDistintos[i]!, '·'));
    expect(new Set(sinTema).size).toBeGreaterThan(1);
  });

  it('devuelve la cantidad de actividades pedida con categorías válidas', async () => {
    const actividades = await provider.recommendActivities({ perfil: perfil('es'), cantidad: 4 });
    expect(actividades).toHaveLength(4);
    for (const a of actividades) {
      expect(CATEGORIAS).toContain(a.categoria);
      expect(a.titulo.length).toBeGreaterThan(0);
      expect(a.descripcion.length).toBeGreaterThan(0);
      // US-54: la mock rellena un paso a paso no vacío.
      expect(a.instrucciones?.length ?? 0).toBeGreaterThan(0);
      expect(a.instrucciones).toContain('1.');
    }
  });

  it('US-67: las instrucciones mock tienen al menos 6 pasos numerados', async () => {
    // Pedimos 6 para cubrir los distintos tamaños (6, 7, 8) del repertorio.
    const actividades = await provider.recommendActivities({ perfil: perfil('es'), cantidad: 6 });
    for (const a of actividades) {
      // Cuenta los marcadores "N." (cuantificador acotado: 1-2 dígitos, sin backtracking).
      const pasos = (a.instrucciones ?? '').match(/\d{1,2}\./g)?.length ?? 0;
      expect(pasos).toBeGreaterThanOrEqual(6);
      expect(pasos).toBeLessThanOrEqual(8);
    }
  });

  it('US-67: las instrucciones se dirigen al adulto por su parentesco (madre → "mamá")', async () => {
    const actividades = await provider.recommendActivities({
      perfil: perfil('es'),
      cantidad: 1,
      parentesco: 'madre',
    });
    expect(actividades[0]!.instrucciones).toContain('Mamá');
    expect(actividades[0]!.instrucciones).not.toContain('El adulto');
  });

  it('US-67: sin parentesco usa un trato genérico ("la persona adulta")', async () => {
    const actividades = await provider.recommendActivities({ perfil: perfil('es'), cantidad: 1 });
    expect(actividades[0]!.instrucciones).toContain('La persona adulta');
  });

  it('respeta la categoría cuando se acota', async () => {
    const actividades = await provider.recommendActivities({
      perfil: perfil('es'),
      categoria: 'musica',
      cantidad: 3,
    });
    expect(actividades.every((a) => a.categoria === 'musica')).toBe(true);
  });

  it('genera las actividades en inglés cuando el perfil es en', async () => {
    const actividades = await provider.recommendActivities({ perfil: perfil('en'), cantidad: 2 });
    expect(actividades).toHaveLength(2);
    expect(actividades[0]!.titulo).toContain('activity #');
    expect(actividades[0]!.descripcion).toContain('play and learn at home');
  });
});
