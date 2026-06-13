import { beforeEach, describe, expect, it } from 'vitest';
import { CompleteActivity } from '../../src/application/use-cases/CompleteActivity.js';
import { Activity } from '../../src/domain/entities/Activity.js';
import { DomainError, NotFoundError } from '../../src/domain/errors.js';
import { InMemoryActivityRepository, relojFijo } from '../support/doubles.js';

describe('CompleteActivity', () => {
  let activities: InMemoryActivityRepository;
  let useCase: CompleteActivity;

  beforeEach(async () => {
    activities = new InMemoryActivityRepository();
    await activities.save(
      new Activity({
        id: 'a-1',
        profileId: 'p-1',
        categoria: 'arte',
        titulo: 'Pintar un dragón',
        descripcion: '...',
        proveedor: 'mock',
      }),
    );
    useCase = new CompleteActivity({ activities, now: relojFijo() });
  });

  it('completa la actividad con valoración y fecha', async () => {
    const out = await useCase.execute({ activityId: 'a-1', valoracion: 3 });
    expect(out.valoracion).toBe(3);
    expect(out.completadaEn).toBe('2026-06-10T12:00:00.000Z');
    const guardada = await activities.findById('a-1');
    expect(guardada?.valoracion).toBe(3);
    expect(guardada?.completadaEn).toBeInstanceOf(Date);
  });

  it('rechaza una valoración fuera de 1-3', async () => {
    await expect(useCase.execute({ activityId: 'a-1', valoracion: 5 })).rejects.toThrow(
      DomainError,
    );
  });

  it('rechaza si la actividad no existe', async () => {
    await expect(useCase.execute({ activityId: 'nope', valoracion: 2 })).rejects.toThrow(
      NotFoundError,
    );
  });
});
