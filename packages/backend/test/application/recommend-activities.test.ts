import { beforeEach, describe, expect, it } from 'vitest';
import { RecommendActivities } from '../../src/application/use-cases/RecommendActivities.js';
import { Activity } from '../../src/domain/entities/Activity.js';
import { ChildProfile } from '../../src/domain/entities/ChildProfile.js';
import { DomainError, NotFoundError } from '../../src/domain/errors.js';
import { Edad } from '../../src/domain/value-objects/Edad.js';
import { Idioma } from '../../src/domain/value-objects/Idioma.js';
import {
  FakeAIProvider,
  InMemoryActivityRepository,
  InMemoryChildProfileRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

describe('RecommendActivities', () => {
  let profiles: InMemoryChildProfileRepository;
  let activities: InMemoryActivityRepository;
  let ai: FakeAIProvider;
  let useCase: RecommendActivities;

  beforeEach(async () => {
    profiles = new InMemoryChildProfileRepository();
    activities = new InMemoryActivityRepository();
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
    useCase = new RecommendActivities({
      profiles,
      activities,
      ai,
      newId: secuencialIdGenerator('act'),
      now: relojFijo(),
    });
  });

  it('genera y persiste la cantidad pedida de actividades', async () => {
    const out = await useCase.execute({ profileId: 'p-1', cantidad: 2 });
    expect(out).toHaveLength(2);
    expect(out[0]?.profileId).toBe('p-1');
    expect(await activities.findByProfile('p-1')).toHaveLength(2);
  });

  it('US-61: persiste el prompt (solo BD, no en el DTO) y expone creadoEn en ISO', async () => {
    const out = await useCase.execute({ profileId: 'p-1', cantidad: 1 });
    // creadoEn mapeado desde la entidad (relojFijo()).
    expect(out[0]?.creadoEn).toBe('2026-06-10T12:00:00.000Z');
    // El prompt no se expone en el DTO público.
    expect((out[0] as Record<string, unknown>).prompt).toBeUndefined();
    // ...pero sí se persiste en la entidad.
    const guardadas = await activities.findByProfile('p-1');
    expect(guardadas[0]?.prompt).toContain('prompt-actividades:');
  });

  it('genera 3 actividades por defecto si no se indica cantidad', async () => {
    const out = await useCase.execute({ profileId: 'p-1' });
    expect(out).toHaveLength(3);
  });

  it('respeta la categoría indicada', async () => {
    const out = await useCase.execute({ profileId: 'p-1', categoria: 'musica', cantidad: 1 });
    expect(out[0]?.categoria).toBe('musica');
  });

  it('descarta por dedup las actividades cuyo título ya existe para el perfil', async () => {
    // El FakeAIProvider genera "Actividad 1", "Actividad 2"...; sembramos "Actividad 1".
    await activities.save(
      new Activity({
        id: 'pre-1',
        profileId: 'p-1',
        categoria: 'arte',
        titulo: 'Actividad 1',
        descripcion: 'previa',
        proveedor: 'mock',
      }),
    );
    const out = await useCase.execute({ profileId: 'p-1', cantidad: 2 });
    expect(out.map((a) => a.titulo)).not.toContain('Actividad 1');
    expect(out).toHaveLength(1); // solo "Actividad 2" sobrevive
  });

  it('rechaza una categoría fuera del vocabulario', async () => {
    await expect(useCase.execute({ profileId: 'p-1', categoria: 'deportes' })).rejects.toThrow(
      DomainError,
    );
  });

  it('rechaza si el perfil no existe', async () => {
    await expect(useCase.execute({ profileId: 'nope' })).rejects.toThrow(NotFoundError);
  });

  it('no genera imagen para las actividades (ajuste feature 65: portada solo en cuentos)', async () => {
    const out = await useCase.execute({ profileId: 'p-1', cantidad: 3 });
    // No se invoca generateImage y ninguna actividad lleva imagen.
    expect(ai.imagenCalls).toHaveLength(0);
    expect(out.every((a) => a.imagen === undefined)).toBe(true);
  });
});
