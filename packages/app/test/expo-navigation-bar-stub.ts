/**
 * Stub de `expo-navigation-bar` para los tests (Vitest + jsdom).
 *
 * El módulo real es nativo (Android) y no resuelve bajo el runner de Vitest. El
 * `ThemeProvider` (US-66) usa su componente `<NavigationBar>` para ajustar el
 * estilo de los botones de la barra de navegación del SO; como los tests importan
 * de forma transitiva el theme, lo aliasamos a este stub en `vitest.config.ts`
 * (mismo patrón que `expo-haptics`). El componente no renderiza nada.
 */
export function NavigationBar(_props: { style?: string; hidden?: boolean }): null {
  return null;
}
