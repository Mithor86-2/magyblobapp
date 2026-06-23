import type { DomainEvent } from './DomainEvent.js';

/** Reacción a un evento de dominio (persistir telemetría, auditar, métricas futuras…). */
export type DomainEventHandler = (event: DomainEvent) => Promise<void>;

/**
 * Bus de eventos de dominio (patrón Observer). El publicador llama `publish` sin
 * conocer a sus oyentes; los suscriptores se registran en el composition root. La
 * implementación vive en infraestructura (`InMemoryEventBus`).
 */
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(handler: DomainEventHandler): void;
}
