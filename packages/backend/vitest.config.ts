import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    // La integración contra Postgres real (Testcontainers) corre en su propia
    // suite (`vitest.integration.config.ts`, `pnpm test:integration`) porque
    // necesita Docker; el `pnpm test` del gate diario no debe depender de él.
    exclude: ['**/node_modules/**', '**/dist/**', 'test/integration-db/**'],
  },
});
