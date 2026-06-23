import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    // La integración contra Postgres real y el E2E corren en sus propias suites
    // (`pnpm test:integration` / `pnpm test:e2e`) porque necesitan Docker; el
    // `pnpm test` del gate diario no debe depender de él.
    exclude: ['**/node_modules/**', '**/dist/**', 'test/integration-db/**', 'test/e2e/**'],
  },
});
