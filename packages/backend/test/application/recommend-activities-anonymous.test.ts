import { describe, expect, it } from 'vitest';
import { RecommendActivitiesAnonymous } from '../../src/application/use-cases/RecommendActivitiesAnonymous.js';
import { DomainError } from '../../src/domain/errors.js';
import { FakeAIProvider } from '../support/doubles.js';

/**
 * Modo anónimo efímero (US-50): recomienda actividades sin sesión, sin perfil y
 * **sin persistir nada**. Recibe datos mínimos (edad, idioma, categoría, cantidad).
 */
describe('RecommendActivitiesAnonymous', () => {
  function build() {
    return new RecommendActivitiesAnonymous({ ai: new FakeAIProvider() });
  }

  it('recomienda la cantidad por defecto (3) sin pedir perfil', async () => {
    const out = await build().execute({ edad: 4 });
    expect(out).toHaveLength(3);
    expect(out[0]?.proveedor).toBe('mock');
    // Sin id ni profileId (no se persiste).
    expect(out[0]).not.toHaveProperty('id');
    expect(out[0]).not.toHaveProperty('profileId');
  });

  it('respeta la cantidad y la categoría indicadas', async () => {
    const out = await build().execute({ edad: 5, categoria: 'arte', cantidad: 2 });
    expect(out).toHaveLength(2);
    expect(out.every((a) => a.categoria === 'arte')).toBe(true);
  });

  it('rechaza una categoría fuera del vocabulario', async () => {
    await expect(build().execute({ edad: 4, categoria: 'cocina' })).rejects.toThrow(DomainError);
  });

  it('rechaza una edad fuera de rango (value-object Edad)', async () => {
    await expect(build().execute({ edad: 0 })).rejects.toThrow(DomainError);
  });
});
