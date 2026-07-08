import { describe, expect, it } from 'vitest';
import { GenerateStoryAnonymous } from '../../src/application/use-cases/GenerateStoryAnonymous.js';
import { DomainError } from '../../src/domain/errors.js';
import { FakeAIProvider, FakeStoryCoverCatalog } from '../support/doubles.js';

/**
 * Modo anónimo efímero (US-50): genera un cuento sin sesión, sin perfil y **sin
 * persistir nada**. Recibe datos mínimos (edad, idioma, temas, estilos) — sin
 * `profileId` ni nombre de niño.
 */
describe('GenerateStoryAnonymous', () => {
  function build(coverName: string | null = null) {
    return new GenerateStoryAnonymous({
      ai: new FakeAIProvider(),
      covers: new FakeStoryCoverCatalog(coverName),
    });
  }

  it('genera un cuento en el idioma indicado sin pedir perfil ni nombre', async () => {
    const out = await build().execute({
      edad: 4,
      idioma: 'en',
      temas: ['animales'],
      estilos: ['aventura'],
    });
    expect(out.idioma).toBe('en');
    expect(out.tema).toBe('animales');
    expect(out.estilo).toBe('aventura');
    expect(out.cuerpo.length).toBeGreaterThan(0);
    expect(out.proveedor).toBe('mock');
    // No hay id ni profileId en la salida anónima (no se persiste).
    expect(out).not.toHaveProperty('id');
    expect(out).not.toHaveProperty('profileId');
  });

  it('usa el idioma por defecto (es) si no se indica', async () => {
    const out = await build().execute({ edad: 5, temas: ['magia'], estilos: ['divertido'] });
    expect(out.idioma).toBe('es');
  });

  it('US-101: incluye portadaKey del catálogo en la salida (sin persistir)', async () => {
    const out = await build('magia+divertido.png').execute({
      edad: 5,
      temas: ['magia'],
      estilos: ['divertido'],
    });
    expect(out.portadaKey).toBe('magia+divertido.png');
  });

  it('admite varios temas y estilos y usa el primero como representante', async () => {
    const out = await build().execute({
      edad: 3,
      temas: ['espacio', 'animales'],
      estilos: ['divertido', 'aventura'],
    });
    expect(out.tema).toBe('espacio');
    expect(out.estilo).toBe('divertido');
  });

  it('rechaza una lista de temas vacía', async () => {
    await expect(build().execute({ edad: 4, temas: [], estilos: ['aventura'] })).rejects.toThrow(
      DomainError,
    );
  });

  it('rechaza temas duplicados', async () => {
    await expect(
      build().execute({ edad: 4, temas: ['animales', 'animales'], estilos: ['aventura'] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza estilos duplicados', async () => {
    await expect(
      build().execute({ edad: 4, temas: ['animales'], estilos: ['aventura', 'aventura'] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza un tema fuera del vocabulario', async () => {
    await expect(
      build().execute({ edad: 4, temas: ['piratas'], estilos: ['aventura'] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza un estilo fuera del vocabulario', async () => {
    await expect(
      build().execute({ edad: 4, temas: ['animales'], estilos: ['dramatico'] }),
    ).rejects.toThrow(DomainError);
  });

  it('rechaza una edad fuera de rango (value-object Edad)', async () => {
    await expect(
      build().execute({ edad: 12, temas: ['animales'], estilos: ['aventura'] }),
    ).rejects.toThrow(DomainError);
  });
});
