# Plan — Feature 87: Lector como libro con page-curl real (US-83, ajustes #1 + #5)

Rama: `feature/87-ajustes-ideas-3` (lote). Ficheros propios: `BookPages.tsx`, `StoryReaderScreen.tsx`,
setup/deps de la app. Depende de la decisión #1 (adoptar `react-native-page-flipper`, supera US-79).

## Objetivo

El lector se ve como un **libro**: 1ª página = título + portada; páginas intermedias = el cuento
paginado; última página = **"FIN"**. El pase de página es un **curl real** (arrastre y controles ‹/›).

## Tareas

- [x] ✅ Añadir deps a `packages/app`: `react-native-page-flipper`, `react-native-linear-gradient`,
      `expo-linear-gradient`. Registrar en `allowBuilds` raíz si el postinstall lo pide.
- [x] ✅ `BookPages.tsx`: reescribir el interior para usar `PageFlipper` (`data` = páginas, `renderPage`
      = hoja de papel con el texto) conservando el API `<BookPages paginas={string[]} />`, el indicador
      "Página n/total" y los controles ‹/› (flip programático). Accesibilidad intacta.
- [x] ✅ `StoryReaderScreen.tsx`: construir las páginas del libro con un helper puro
      `construirPaginasLibro(story)` → `[{tipo:'portada'}]` + `paginarCuento(cuerpo)` + `[{tipo:'fin'}]`,
      reutilizando `StoryCover` para la portada. `paginarCuento.ts` sin cambios.
- [x] ✅ Harness Vitest: stubs de `react-native-page-flipper`, `react-native-linear-gradient`,
      `expo-linear-gradient` junto a los de reanimated/gesture-handler.
- [x] ✅ Tests: `BookPages.test.tsx` (navegación con la lib mockeada), `StoryReaderScreen.test.tsx`
      (1ª pág. título+portada, última "FIN"), `construirPaginasLibro` (unidad pura). `paginarCuento.test.ts`
      intacto.
- [x] ✅ Docs: decisión en `memory.md` (adopción page-flipper, supera US-79) + validación de librerías.

## Validación de librerías (#1, entregable)

| Opción                             | Curl real   | Expo/Web                      | Deps                             | Encaje tests             | Veredicto                 |
| ---------------------------------- | ----------- | ----------------------------- | -------------------------------- | ------------------------ | ------------------------- |
| **react-native-page-flipper**      | Sí          | Sí (expo-linear-gradient web) | +3 (gesture/reanimated ya están) | mock como reanimated     | **Elegida**               |
| @shopify/react-native-skia (Riveo) | Sí (shader) | Complejo                      | pesado nativo                    | rompe export web/harness | Descartada (US-79)        |
| Reanimated puro (actual)           | Aproximado  | Sí                            | 0                                | ya integrado             | Base previa, se sustituye |
