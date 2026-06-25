import { defineConfig, devices } from '@playwright/test';

/**
 * E2E de la app sobre **Expo web** con Playwright (US-32). Dos `webServer`:
 *  1. el backend real (Fastify + Postgres efímero, mock) en `:3000`, y
 *  2. un servidor estático que sirve el export web de Expo en `:4173` y proxea la
 *     API al backend (mismo origen → sin CORS).
 *
 * El export (`expo export --platform web`) lo hace el script `test:e2e` antes de
 * lanzar Playwright, fijando `EXPO_PUBLIC_API_URL=http://127.0.0.1:4173` para que
 * la app llame a su propio origen. Requiere Docker (Testcontainers) y los binarios
 * de Chromium y WebKit (`pnpm e2e:install`).
 *
 * Multinavegador (US-36): se recorre el mismo flujo en `chromium` (baseline),
 * `mobile-chrome` (Pixel 5, viewport móvil _portrait_, mismo motor Chromium) y
 * `mobile-safari` (iPhone 13, motor **WebKit** = el de iOS). Reporting rico:
 * HTML + JSON + line, y ante fallo se conservan captura/vídeo/traza. `retries: 1`
 * solo en CI (con `workers: 1` y `retries: 0`, `on-first-retry` no captura nada).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line'],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
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
