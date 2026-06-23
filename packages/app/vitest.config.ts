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
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  define: {
    // react-native-web referencia este flag global en tiempo de ejecución.
    __DEV__: 'true',
  },
});
