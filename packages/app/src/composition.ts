/**
 * Composition root del app: cablea la implementación concreta (infraestructura
 * HTTP) detrás de las interfaces de `domain`. Es el **único** módulo que conoce
 * la implementación; la presentación importa `api` tipado como `Api` (puertos),
 * sin saber que por debajo hay `fetch`.
 */
import type { Api } from './domain/gateways';
import { createApiGateways } from './infrastructure/http';

export const api: Api = createApiGateways();
