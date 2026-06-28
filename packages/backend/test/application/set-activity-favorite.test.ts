import { beforeEach, describe, expect, it } from 'vitest';
import { SetActivityFavorite } from '../../src/application/use-cases/SetActivityFavorite.js';
import { Activity } from '../../src/domain/entities/Activity.js';
import { NotFoundError } from '../../src/domain/errors.js';
import { InMemoryActivityRepository } from '../support/doubles.js';

describe('SetActivityFavorite', () => {
  let activities: InMemoryActivityRepository;
  let useCase: SetActivityFavorite;

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
    useCase = new SetActivityFavorite({ activities });
  });

  it('marca la actividad como favorita y la persiste', async () => {
    const out = await useCase.execute({ activityId: 'a-1', favorito: true });
    expect(out.favorito).toBe(true);
    const guardada = await activities.findById('a-1');
    expect(guardada?.favorito).toBe(true);
  });

  it('desmarca la favorita (idempotente)', async () => {
    await useCase.execute({ activityId: 'a-1', favorito: true });
    const out = await useCase.execute({ activityId: 'a-1', favorito: false });
    expect(out.favorito).toBe(false);
    const guardada = await activities.findById('a-1');
    expect(guardada?.favorito).toBe(false);
  });

  it('rechaza si la actividad no existe', async () => {
    await expect(useCase.execute({ activityId: 'nope', favorito: true })).rejects.toThrow(
      NotFoundError,
    );
  });
});
