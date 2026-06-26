import type { FastifyInstance } from 'fastify';

/**
 * Endpoint de salud. Útil para los healthchecks de docker-compose y como
 * primer smoke test de que el servidor levanta.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'magyblob-backend',
  }));
}
