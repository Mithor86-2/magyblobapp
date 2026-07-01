import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    // La integración contra Postgres real y el E2E corren en sus propias suites
    // (`pnpm test:integration` / `pnpm test:e2e`) porque necesitan Docker; el
    // `pnpm test` del gate diario no debe depender de él.
    exclude: ['**/node_modules/**', '**/dist/**', 'test/integration-db/**', 'test/e2e/**'],
    // Strategic Coverage 100/80/0 (US-35): la cobertura se gobierna por riesgo de
    // negocio, no por un % global. Se mide solo lo que ejercita ESTE run unitario;
    // lo cubierto por otras suites (repos Prisma → `test:integration`, ElevenLabs →
    // E2E/manual) y el tier INFRASTRUCTURE (que TypeScript ya valida) se excluyen
    // para no ensuciar la señal. El umbral lo hace cumplir el CI (`pnpm coverage`).
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        // Cubierto por otra suite (no es hueco):
        'src/infrastructure/repositories/**', // → test:integration (Postgres real)
        'src/infrastructure/db/**',
        'src/infrastructure/config/syncAppSettings.ts', // IO de BD → test:integration (US-68)
        'src/infrastructure/tts/ElevenLabsProvider.ts', // → E2E/manual
        'src/infrastructure/ai/aiLog.ts', // logger, ejercitado en E2E/manual
        // INFRASTRUCTURE tier (TypeScript valida; 0% objetivo): interfaces/puertos,
        // type-aliases, DTOs, vocabularios cerrados, config y bootstrap.
        'src/infrastructure/ai/cloudPresets.ts',
        'src/application/dto.ts',
        'src/application/ports.ts',
        'src/dependencies.ts',
        'src/domain/ai/AIProvider.ts',
        'src/domain/tts/TTSProvider.ts',
        'src/domain/events/**',
        'src/domain/repositories/**',
        'src/domain/**/*Repository.ts',
        'src/domain/vocabulary.ts',
        'src/config.ts',
        'src/server.ts',
        'src/index.ts',
        'src/generated/**',
        '**/*.d.ts',
      ],
      thresholds: {
        // Baseline IMPORTANT tier (80%): si falla → usuario frustrado.
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // CORE tier (100%): si falla → pérdida de usuario / incumplimiento.
        'src/infrastructure/ai/parseResponse.ts': perfect(),
        'src/infrastructure/ai/FallbackProvider.ts': perfect(),
        'src/infrastructure/ai/createAIProvider.ts': perfect(),
        'src/infrastructure/ai/MockProvider.ts': perfect(),
        'src/application/use-cases/**': perfect(),
        'src/domain/value-objects/**': perfect(),
        'src/domain/entities/**': perfect(),
      },
    },
  },
});

/** Umbral CORE: 100% en las cuatro métricas. */
function perfect() {
  return { lines: 100, functions: 100, branches: 100, statements: 100 };
}
