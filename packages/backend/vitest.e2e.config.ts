import { defineConfig } from 'vitest/config';

/**
 * Suite **E2E de backend**: el servidor Fastify real (composición de producción)
 * contra un PostgreSQL real (Testcontainers), ejercitado por **HTTP real**
 * (`fetch` a un puerto efímero) en modo `AI_PROVIDER=mock` (sin red ni IA
 * externa). Separada porque requiere Docker; se ejecuta con `pnpm test:e2e`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/e2e/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 180_000,
    fileParallelism: false,
  },
});
