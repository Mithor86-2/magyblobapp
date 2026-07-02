import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Configuración de tests del app (Expo + React Native).
 *
 * Para los tests user-centric de componentes (US-30) renderizamos la UI con
 * **React Native Testing Library sobre el adaptador web de React Native**:
 * `react-native` se aliasa a `react-native-web` (JS plano, sin Flow ni módulos
 * nativos) y se ejecuta bajo `jsdom`. RN-web traduce las props de accesibilidad
 * a su equivalente ARIA (`accessibilityRole`→`role`, `accessibilityLabel`→
 * `aria-label`, `accessibilityState`→`aria-*`), que es justo lo que consultan
 * las queries de Testing Library (`getByRole`, `getByLabelText`, ...).
 *
 * El entorno por defecto es `node` (para los tests de lógica pura, p. ej. el
 * adaptador HTTP); cada test de componente declara `// @vitest-environment jsdom`
 * en su cabecera, así no se penaliza al resto.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // El E2E de Playwright (`e2e/*.spec.ts`) usa su propio runner, no Vitest; y
    // `dist/` es el export web. Ninguno entra en el `vitest run` de componentes.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    // Strategic Coverage 100/80/0 (US-35). Se mide solo lo que ESTE run unitario
    // ejercita; lo atado a nativo (Expo) y la composición visual (pantallas) se
    // excluyen igual que en el backend se excluyen Ollama/ElevenLabs/Prisma:
    // se verifican por E2E (Playwright, `e2e/onboarding.spec.ts`) o a mano, según
    // la guía de TDD del proyecto (ver Docs/estrategia-pruebas.md). No es truncado
    // silencioso: la exclusión es deliberada y está documentada.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        // INFRASTRUCTURE tier (TypeScript valida): tipos, gateways, errores, rótulos,
        // tokens de tema, navegación, cableado de dependencias y adaptador de storage.
        'src/domain/**',
        'src/presentation/labels.ts',
        'src/presentation/theme/**',
        // i18n (US-57): diccionarios ES/EN e init de i18next. Son datos/cableado de
        // presentación (como labels/theme); el comportamiento se verifica con tests
        // dedicados de cambio de idioma y renderizado traducido.
        'src/i18n/**',
        'src/presentation/navigation.ts',
        'src/composition.ts',
        'src/infrastructure/storage.ts',
        'src/infrastructure/sentry.bootstrap.ts', // bootstrap: importa @sentry/react-native (no carga bajo Vitest)
        // Cubierto por E2E / manual (no es hueco unitario):
        'src/presentation/screens/**', // composición visual → e2e/onboarding.spec.ts
        'src/presentation/hooks/useNarration.ts', // atado a expo-audio/file-system/speech
        'src/presentation/components/Icon.tsx', // lucide-react-native no carga bajo Vitest (US-30)
        'src/presentation/components/AppErrorBoundary.tsx', // importa @sentry/react-native (no carga bajo Vitest); su ErrorFallback sí se prueba (US-41)
        '**/*.d.ts',
      ],
      thresholds: {
        // Baseline IMPORTANT tier (80%): componentes y store.
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // CORE tier (100%): si falla → la app no habla con el backend, o se narra
        // contenido inadecuado a un niño.
        'src/infrastructure/http.ts': perfect(),
        'src/presentation/hooks/sanitizeForSpeech.ts': perfect(),
        // CORE: el gating por DSN y el beforeSend protegen que NO salga PII de un
        // menor a un tercero (Sentry, US-40/C-12).
        'src/infrastructure/sentry.ts': perfect(),
      },
    },
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      // `expo-haptics` arrastra `expo-modules-core` (no carga bajo jsdom). Lo aliasamos a un
      // stub para los tests; el test de BubblyButton que verifica el háptico lo re-mockea.
      'expo-haptics': fileURLToPath(new URL('./test/expo-haptics-stub.ts', import.meta.url)),
      // Módulos nativos del tema del SO (US-66): no resuelven bajo Vitest. El
      // `ThemeProvider` los importa; los aliasamos a stubs inocuos (mismo patrón).
      'expo-navigation-bar': fileURLToPath(
        new URL('./test/expo-navigation-bar-stub.ts', import.meta.url),
      ),
      'expo-system-ui': fileURLToPath(new URL('./test/expo-system-ui-stub.ts', import.meta.url)),
      // US-79: reanimated y gesture-handler son nativos y no cargan bajo Vitest; se
      // aliasan a stubs inertes para poder renderizar `BookPages` (los ‹/› siguen
      // navegando por estado de React; el arrastre se verifica a mano/E2E).
      'react-native-reanimated': fileURLToPath(
        new URL('./test/react-native-reanimated-stub.ts', import.meta.url),
      ),
      'react-native-gesture-handler': fileURLToPath(
        new URL('./test/react-native-gesture-handler-stub.ts', import.meta.url),
      ),
    },
  },
  define: {
    // react-native-web referencia este flag global en tiempo de ejecución.
    __DEV__: 'true',
  },
});

/** Umbral CORE: 100% en las cuatro métricas. */
function perfect() {
  return { lines: 100, functions: 100, branches: 100, statements: 100 };
}
