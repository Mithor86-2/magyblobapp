import type { FastifyInstance } from 'fastify';
import pkg from '../../package.json' with { type: 'json' };

/**
 * Endpoint de salud. Útil para los healthchecks de docker-compose, como primer smoke
 * test de que el servidor levanta, y para el **smoke post-deploy** (US CI/CD): expone
 * `version` (del `package.json`) para que la sonda verifique que Render sirve la versión
 * esperada, no una instancia vieja que quedó viva tras un deploy fallido.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'magyblob-backend',
    version: pkg.version,
  }));
}
