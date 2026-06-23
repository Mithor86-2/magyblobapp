import { defineConfig } from 'vitest/config';

/**
 * Suite de **integración de persistencia**: los `Prisma*Repository` contra un
 * PostgreSQL real y efímero (Testcontainers). Separada del `vitest.config.ts`
 * porque requiere un daemon de Docker en marcha. Se ejecuta con
 * `pnpm test:integration`.
 *
 * Timeouts altos: arrancar el contenedor y aplicar migraciones la primera vez
 * (descarga de imagen incluida) puede tardar bastante más que un test unitario.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration-db/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 180_000,
    // Sin paralelismo entre ficheros: comparten el contenedor por suite y
    // aíslan estado con TRUNCATE; ejecutarlos en serie evita interferencias.
    fileParallelism: false,
  },
});
