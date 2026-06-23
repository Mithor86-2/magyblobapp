import { describe, expect, it, vi } from 'vitest';
import { InMemoryEventBus } from '../../src/infrastructure/events/InMemoryEventBus.js';
import type { DomainEvent } from '../../src/domain/events/DomainEvent.js';

const EVENTO: DomainEvent = {
  tipo: 'guardian_login',
  guardianId: 'g-1',
};

describe('InMemoryEventBus', () => {
  it('notifica a todos los suscriptores con el evento publicado', async () => {
    const bus = new InMemoryEventBus();
    const a = vi.fn(async () => {});
    const b = vi.fn(async () => {});
    bus.subscribe(a);
    bus.subscribe(b);

    await bus.publish(EVENTO);

    expect(a).toHaveBeenCalledWith(EVENTO);
    expect(b).toHaveBeenCalledWith(EVENTO);
  });

  it('no hace nada si no hay suscriptores', async () => {
    const bus = new InMemoryEventBus();
    await expect(bus.publish(EVENTO)).resolves.toBeUndefined();
  });

  it('propaga el error de un suscriptor (no lo traga)', async () => {
    const bus = new InMemoryEventBus();
    bus.subscribe(async () => {
      throw new Error('fallo al persistir');
    });

    await expect(bus.publish(EVENTO)).rejects.toThrow('fallo al persistir');
  });
});
