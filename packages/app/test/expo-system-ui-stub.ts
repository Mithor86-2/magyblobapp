/**
 * Stub de `expo-system-ui` para los tests (Vitest + jsdom).
 *
 * El módulo real es nativo y no resuelve bajo el runner de Vitest. El
 * `ThemeProvider` (US-66) lo usa para fijar el color de fondo raíz de la ventana;
 * como el theme se importa de forma transitiva en muchos tests, lo aliasamos a
 * este stub en `vitest.config.ts` (mismo patrón que `expo-haptics`).
 */
export function setBackgroundColorAsync(_color: string): Promise<void> {
  return Promise.resolve();
}
