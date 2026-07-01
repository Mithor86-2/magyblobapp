import { beforeEach, describe, expect, it } from 'vitest';
import { GetAchievements } from '../../src/application/use-cases/GetAchievements.js';
import { Story } from '../../src/domain/entities/Story.js';
import { Activity } from '../../src/domain/entities/Activity.js';
import type { Tema } from '../../src/domain/vocabulary.js';
import {
  InMemoryAchievementRepository,
  InMemoryActivityRepository,
  InMemoryStoryRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

/** US-68: read-model de logros + reconciliación idempotente de la persistencia. */
describe('GetAchievements', () => {
  let stories: InMemoryStoryRepository;
  let activities: InMemoryActivityRepository;
  let achievements: InMemoryAchievementRepository;
  let useCase: GetAchievements;

  beforeEach(() => {
    stories = new InMemoryStoryRepository();
    activities = new InMemoryActivityRepository();
    achievements = new InMemoryAchievementRepository();
    useCase = new GetAchievements({
      stories,
      activities,
      achievements,
      newId: secuencialIdGenerator('logro'),
      now: relojFijo(),
    });
  });

  const cuentoLeido = (tema: Tema) =>
    new Story({
      id: `s-${tema}`,
      profileId: 'p-1',
      tema,
      estilo: 'aventura',
      titulo: 'T',
      cuerpo: 'C',
      idioma: 'es',
      proveedor: 'mock',
      estado: 'leido',
      creadoEn: new Date('2026-07-01T10:00:00.000Z'),
    });

  const find = (out: Awaited<ReturnType<GetAchievements['execute']>>, clave: string) =>
    out.find((a) => a.clave === clave)!;

  it('sin datos: devuelve todo el catálogo sin conseguir y no persiste nada', async () => {
    const out = await useCase.execute({ profileId: 'p-1' });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((a) => a.conseguido === false)).toBe(true);
    expect(find(out, 'cuentos_leidos_1').desbloqueadoEn).toBeUndefined();
    expect(achievements.items).toHaveLength(0);
  });

  it('al leer un cuento desbloquea el hito de 1 y el tema, y los persiste', async () => {
    await stories.save(cuentoLeido('animales'));
    const out = await useCase.execute({ profileId: 'p-1' });

    expect(find(out, 'cuentos_leidos_1').conseguido).toBe(true);
    expect(find(out, 'cuentos_leidos_1').desbloqueadoEn).toBe('2026-06-10T12:00:00.000Z');
    expect(find(out, 'tema_animales').conseguido).toBe(true);
    expect(find(out, 'cuentos_leidos_5').conseguido).toBe(false);

    const claves = achievements.items.map((a) => a.clave).sort();
    expect(claves).toEqual(['cuentos_leidos_1', 'tema_animales']);
  });

  it('es idempotente: dos llamadas no duplican logros', async () => {
    await stories.save(cuentoLeido('espacio'));
    await useCase.execute({ profileId: 'p-1' });
    await useCase.execute({ profileId: 'p-1' });
    expect(achievements.items).toHaveLength(2); // cuentos_leidos_1 + tema_espacio
  });

  it('conserva la fecha original de desbloqueo en llamadas posteriores', async () => {
    await stories.save(cuentoLeido('magia'));
    const primera = await useCase.execute({ profileId: 'p-1' });
    const segunda = await useCase.execute({ profileId: 'p-1' });
    expect(find(segunda, 'tema_magia').desbloqueadoEn).toBe(
      find(primera, 'tema_magia').desbloqueadoEn,
    );
  });

  it('cuenta actividades completadas para su hito', async () => {
    await activities.save(
      new Activity({
        id: 'a-1',
        profileId: 'p-1',
        categoria: 'arte',
        titulo: 'T',
        descripcion: 'D',
        proveedor: 'mock',
        completadaEn: new Date('2026-07-01T10:00:00.000Z'),
        valoracion: 3,
      }),
    );
    const out = await useCase.execute({ profileId: 'p-1' });
    expect(find(out, 'actividades_completadas_1').conseguido).toBe(true);
  });
});
