import { describe, expect, it } from 'vitest';
import { buildStoryPrompt, buildActivitiesPrompt } from '../../src/infrastructure/ai/prompts.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import type { Tema } from '../../src/domain/vocabulary.js';

function perfil(edad: number, intereses: Tema[] = ['animales', 'espacio']): ChildProfile {
  return new ChildProfile({
    id: 'p-1',
    guardianId: 'g-1',
    nombre: 'Lola',
    edad: Edad.create(edad),
    idioma: Idioma.create('es'),
    avatar: 'a1',
    intereses,
    creadoEn: new Date('2026-06-10T12:00:00.000Z'),
  });
}

describe('prompts — personalización por niño (US-26)', () => {
  it('el prompt del cuento incluye nombre, edad e intereses del perfil', () => {
    const { prompt } = buildStoryPrompt({
      perfil: perfil(5),
      tema: 'animales',
      estilo: 'aventura',
    });
    expect(prompt).toContain('Lola');
    expect(prompt).toContain('5');
    expect(prompt).toContain('animales');
    expect(prompt).toContain('espacio'); // interés extra, no solo el tema
  });

  it('ajusta el tono por tramo de edad (2-3 más simple que 5-6)', () => {
    const pequeno = buildStoryPrompt({ perfil: perfil(3), tema: 'magia', estilo: 'divertido' });
    const mayor = buildStoryPrompt({ perfil: perfil(6), tema: 'magia', estilo: 'divertido' });
    expect(pequeno.prompt).toContain('frases muy cortas');
    expect(mayor.prompt).not.toContain('frases muy cortas');
  });

  it('las actividades con categoría libre tienen en cuenta los intereses', () => {
    const { prompt } = buildActivitiesPrompt({ perfil: perfil(4), cantidad: 3 });
    expect(prompt).toContain('animales');
    expect(prompt).toContain('Lola');
  });

  it('con categoría fija manda la categoría y no se listan intereses como afinidad', () => {
    const { prompt } = buildActivitiesPrompt({ perfil: perfil(4), categoria: 'arte', cantidad: 2 });
    expect(prompt).toContain('arte');
    expect(prompt).not.toContain('conecten con lo que le gusta');
  });
});

describe('prompts — parámetros configurables del cuento (formato/longitud/rima)', () => {
  it('inyecta el formato elegido, los límites de palabras y la rima', () => {
    const { prompt } = buildStoryPrompt(
      { perfil: perfil(5), tema: 'magia', estilo: 'aventura' },
      {},
      {
        palabrasMin: 80,
        palabrasMax: 140,
        rima: true,
        formato: 'fabula',
      },
    );
    expect(prompt).toContain('una fábula con una pequeña moraleja');
    expect(prompt).toContain('entre 80 y 140 palabras');
    expect(prompt).toContain('procura que rime');
  });

  it('sin rima no menciona rimar; el formato cambia la apertura', () => {
    const { prompt } = buildStoryPrompt(
      { perfil: perfil(4), tema: 'espacio', estilo: 'educativo' },
      {},
      {
        palabrasMin: 40,
        palabrasMax: 70,
        rima: false,
        formato: 'poema',
      },
    );
    expect(prompt).toContain('Escribe un poema');
    expect(prompt).not.toContain('rime');
    expect(prompt).toContain('entre 40 y 70 palabras');
  });

  it('sin params mantiene el comportamiento legacy (cuento corto, 4 a 6 frases)', () => {
    const { prompt } = buildStoryPrompt({ perfil: perfil(5), tema: 'magia', estilo: 'aventura' });
    expect(prompt).toContain('Escribe un cuento');
    expect(prompt).toContain('4 a 6 frases');
  });
});
