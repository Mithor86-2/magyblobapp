import { defineConfig, devices } from '@playwright/test';

/**
 * E2E de la app sobre **Expo web** con Playwright (US-32). Dos `webServer`:
 *  1. el backend real (Fastify + Postgres efímero, mock) en `:3000`, y
 *  2. un servidor estático que sirve el export web de Expo en `:4173` y proxea la
 *     API al backend (mismo origen → sin CORS).
 *
 * El export (`expo export --platform web`) lo hace el script `test:e2e` antes de
 * lanzar Playwright, fijando `EXPO_PUBLIC_API_URL=http://127.0.0.1:4173` para que
 * la app llame a su propio origen. Requiere Docker (Testcontainers) y el binario
 * de Chromium (`pnpm e2e:install`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @magyblob/backend exec tsx scripts/e2e-serve.ts',
      url: 'http://127.0.0.1:3100/health',
      timeout: 180_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'node e2e/serve-web.mjs',
      url: 'http://127.0.0.1:4173',
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
