import type { InteractionEvent } from '../entities/InteractionEvent.js';

/** Puerto de persistencia de eventos de uso (primera parte). */
export interface InteractionEventRepository {
  save(event: InteractionEvent): Promise<void>;
}
