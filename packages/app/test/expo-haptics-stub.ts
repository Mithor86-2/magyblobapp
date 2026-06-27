/**
 * Stub de `expo-haptics` para los tests (Vitest + jsdom).
 *
 * `expo-haptics` arrastra `expo-modules-core`, que no carga bajo el adaptador web
 * (`EventEmitter` nativo undefined). Como `BubblyButton` lo importa y muchos tests
 * renderizan ese botón de forma transitiva, lo aliasamos a este stub en
 * `vitest.config.ts` (mismo patrón que `react-native`→`react-native-web`). El háptico
 * es un efecto táctil sin contraparte observable en jsdom; el test de `BubblyButton`
 * que verifica que se dispara usa su propio `vi.mock('expo-haptics', ...)`, que tiene
 * precedencia sobre este alias.
 */
export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' } as const;

export function impactAsync(_style?: string): Promise<void> {
  return Promise.resolve();
}
