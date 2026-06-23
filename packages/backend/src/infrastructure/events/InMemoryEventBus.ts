import type { DomainEvent } from '../../domain/events/DomainEvent.js';
import type { DomainEventHandler, EventBus } from '../../domain/events/EventBus.js';

/**
 * Bus de eventos en proceso (sincrónico). Notifica a los suscriptores **en serie**
 * y **no traga sus errores**: si un suscriptor falla, `publish` propaga, de modo que
 * el handler HTTP responda 500 igual que cuando el `save` era directo en la ruta.
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers: DomainEventHandler[] = [];

  subscribe(handler: DomainEventHandler): void {
    this.handlers.push(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }
}
