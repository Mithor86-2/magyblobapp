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
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(prompt).toContain('Lola');
    expect(prompt).toContain('5');
    expect(prompt).toContain('animales');
    expect(prompt).toContain('espacio'); // interés extra, no solo el tema
  });

  it('ajusta el tono por tramo de edad (2-3 más simple que 5-6)', () => {
    const pequeno = buildStoryPrompt({
      perfil: perfil(3),
      temas: ['magia'],
      estilos: ['divertido'],
    });
    const mayor = buildStoryPrompt({ perfil: perfil(6), temas: ['magia'], estilos: ['divertido'] });
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

describe('prompts — reglas narrativas / prompt maestro (US-28)', () => {
  it('el system del cuento trae las reglas: estructura, onomatopeyas, enseñanza y final feliz (ES)', () => {
    const { system } = buildStoryPrompt({
      perfil: perfil(5),
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(system).toContain('onomatopeyas');
    expect(system).toContain('amigo que ayuda');
    expect(system).toContain('enseñanza final');
    expect(system).toContain('final feliz y tranquilo');
    expect(system).not.toContain('conflicto'); // se retiró el "pequeño conflicto seguro"
  });

  it('las reglas también están en inglés', () => {
    const perfilEn = new ChildProfile({
      id: 'p-2',
      guardianId: 'g-1',
      nombre: 'Leo',
      edad: Edad.create(5),
      idioma: Idioma.create('en'),
      avatar: 'a1',
      intereses: ['animales'],
      creadoEn: new Date('2026-06-10T12:00:00.000Z'),
    });
    const { system } = buildStoryPrompt({
      perfil: perfilEn,
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(system).toContain('onomatopoeia');
    expect(system).toContain('a friend who helps');
    expect(system).toContain('final lesson');
    expect(system).toContain('happy, calm ending');
    expect(system).not.toContain('conflict'); // se retiró el conflicto también en EN
  });

  it('expone el idioma legible para las plantillas ({idiomaNombre}: español/inglés)', () => {
    const es = buildStoryPrompt(
      { perfil: perfil(5), temas: ['magia'], estilos: ['divertido'] },
      { template: 'Escríbelo en {idiomaNombre}.' },
    );
    expect(es.prompt).toBe('Escríbelo en español.');

    const perfilEn = new ChildProfile({
      id: 'p-3',
      guardianId: 'g-1',
      nombre: 'Leo',
      edad: Edad.create(5),
      idioma: Idioma.create('en'),
      avatar: 'a1',
      intereses: ['animales'],
      creadoEn: new Date('2026-06-10T12:00:00.000Z'),
    });
    const en = buildStoryPrompt(
      { perfil: perfilEn, temas: ['magia'], estilos: ['divertido'] },
      { template: 'Write it in {idiomaNombre}.' },
    );
    expect(en.prompt).toBe('Write it in inglés.');
  });

  it('un override de system desde AppSetting reemplaza las reglas por defecto', () => {
    const { system } = buildStoryPrompt(
      { perfil: perfil(5), temas: ['animales'], estilos: ['aventura'] },
      { system: 'system propio' },
    );
    expect(system).toBe('system propio');
  });
});

describe('prompts — multi-tema / multi-estilo (US-47)', () => {
  it('interpola la lista legible de temas y estilos en español ("y")', () => {
    const { prompt } = buildStoryPrompt({
      perfil: perfil(5),
      temas: ['animales', 'espacio'],
      estilos: ['aventura', 'divertido'],
    });
    expect(prompt).toContain('animales y espacio');
    expect(prompt).toContain('aventura y divertido');
  });

  it('interpola la lista legible en inglés ("and") y respeta el límite de palabras', () => {
    const perfilEn = new ChildProfile({
      id: 'p-en',
      guardianId: 'g-1',
      nombre: 'Leo',
      edad: Edad.create(5),
      idioma: Idioma.create('en'),
      avatar: 'a1',
      intereses: ['animales'],
      creadoEn: new Date('2026-06-10T12:00:00.000Z'),
    });
    const { prompt } = buildStoryPrompt(
      { perfil: perfilEn, temas: ['animales', 'espacio'], estilos: ['educativo'] },
      {},
      { palabrasMin: 200, palabrasMax: 350, rima: false, formato: 'cuento' },
    );
    expect(prompt).toContain('animals and space');
    expect(prompt).toContain('between 200 and 350 words');
  });

  it('con un solo tema/estilo no añade conjunción', () => {
    const { prompt } = buildStoryPrompt({
      perfil: perfil(5),
      temas: ['magia'],
      estilos: ['aventura'],
    });
    expect(prompt).toContain('"magia"');
    expect(prompt).not.toContain('magia y');
  });
});

describe('prompts — parámetros configurables del cuento (formato/longitud/rima)', () => {
  it('inyecta el formato elegido, los límites de palabras y la rima', () => {
    const { prompt } = buildStoryPrompt(
      { perfil: perfil(5), temas: ['magia'], estilos: ['aventura'] },
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
      { perfil: perfil(4), temas: ['espacio'], estilos: ['educativo'] },
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
    const { prompt } = buildStoryPrompt({
      perfil: perfil(5),
      temas: ['magia'],
      estilos: ['aventura'],
    });
    expect(prompt).toContain('Escribe un cuento');
    expect(prompt).toContain('4 a 6 frases');
  });
});
