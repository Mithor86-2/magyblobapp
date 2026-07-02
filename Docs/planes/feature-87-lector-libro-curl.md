# Plan — Feature 87: Lector como libro (US-83, ajustes #1 + #5)

Rama: `feature/87-ajustes-ideas-3` (lote). Ficheros propios: `BookPages.tsx`, `StoryReaderScreen.tsx`.

> **Nota de resultado:** el curl "real" con `react-native-page-flipper` se **intentó y descartó** (su
> v1.0.1 crashea con Reanimated 4 / New Architecture: "undefined is not a function" en
> `BookPagePortrait`). El lector se queda con el **pliegue de Reanimated** (US-79) y se le añade la
> **estructura de libro** (#5): portada (imagen + título) → historia → "FIN".

## Objetivo

El lector se ve como un **libro**: 1ª página = título + portada; páginas intermedias = el cuento
paginado; última página = **"FIN"**. El pase de página es un **pliegue** (arrastre y controles ‹/›).

## Tareas

- [x] ✅ ~~Adoptar `react-native-page-flipper` + gradients~~ → descartado en runtime (Reanimated 4);
      dependencias eliminadas.
- [x] ✅ `BookPages.tsx`: pliegue con reanimated + gesture-handler (giro `rotateY`/escala + sombra de
      canto, arrastre y ‹/›), generalizado para páginas `portada | texto | fin`; API
      `<BookPages paginas={string[]} portada? finLabel? />`; indicador "Página n/total".
- [x] ✅ `StoryReaderScreen.tsx`: portada = `StoryCover` + título; `paginas = paginarCuento(cuerpo)`;
      `finLabel = t('reader.end')`. `paginarCuento.ts` sin cambios.
- [x] ✅ Tests: `BookPages.test.tsx` (navegación ‹/›, hoja blanca, portada→FIN) y
      `StoryReaderScreen.test.tsx` (1ª pág. título+portada, última "FIN"); stubs de reanimated/gesture
      ya existentes. `paginarCuento.test.ts` intacto.
- [x] ✅ Docs: decisión en `memory.md` (page-flipper descartado; pliegue reanimated + estructura libro).

## Validación de librerías (#1, entregable)

| Opción                             | Curl real   | Expo/Web | Reanimated 4 / new arch          | Veredicto                     |
| ---------------------------------- | ----------- | -------- | -------------------------------- | ----------------------------- |
| react-native-page-flipper (1.0.1)  | Sí          | Sí       | **No** (crashea en runtime)      | **Descartada** (incompatible) |
| @shopify/react-native-skia (Riveo) | Sí (shader) | Complejo | Pesado; export web/tests         | Descartada (US-79)            |
| **Reanimated + gesture-handler**   | Aproximado  | Sí       | Sí (ya integrado, stubs en test) | **Elegida** (sostenible)      |
