/**
 * Stub de `expo-localization` para los tests (Vitest + jsdom/node).
 *
 * `expo-localization` arrastra `expo-modules-core`, que no carga bajo el entorno de
 * tests (módulo nativo). El sistema i18n (`src/i18n`) solo lo usa para **sugerir** el
 * idioma inicial del dispositivo; aquí devolvemos `es` (idioma por defecto del app),
 * lo que mantiene los textos en español en los tests. Se aliasa en `vitest.config.ts`
 * (mismo patrón que `react-native`→`react-native-web` y el stub de `expo-haptics`).
 */
export function getLocales(): Array<{ languageCode: string | null }> {
  return [{ languageCode: 'es' }];
}
