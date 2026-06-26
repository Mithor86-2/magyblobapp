import type { FastifyInstance } from 'fastify';
import { GetHistory } from '../application/use-cases/GetHistory.js';
import type { AppDeps } from '../dependencies.js';

/** Historial de un perfil: sus cuentos y actividades (US-08). */
export function historyRoutes(app: FastifyInstance, deps: AppDeps): void {
  const getHistory = new GetHistory(deps);

  app.get<{ Params: { profileId: string } }>(
    '/profiles/:profileId/history',
    { onRequest: app.authenticate },
    async (request) => getHistory.execute({ profileId: request.params.profileId }),
  );
}
