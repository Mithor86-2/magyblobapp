# Plan — Feature 90: Cabeceras con animación de rebote (US-86, ajuste #4)

Rama: `feature/87-ajustes-ideas-3` (lote). Fichero propio: `Screen.tsx` (+ componente nuevo).

## Objetivo

Las imágenes de cabecera "rebotan" suavemente arriba↔abajo en **loop infinito** (movimiento tierno,
no distractor).

## Tareas

- ⬜ Extraer un componente `BouncingHeaderImage` (en `components/`) que envuelve la `Image` de
  cabecera en un `Animated.View` (reanimated) con `translateY` en bucle:
  `withRepeat(withTiming(amplitud, { duration ~1600ms, easing suave }), -1, true)`; amplitud ~6–10px.
- ⬜ `Screen.tsx`: usar `BouncingHeaderImage` en lugar de la `Image` directa, conservando `Appear`,
  `resizeMode="contain"`, alto proporcional y accesibilidad (`accessibilityRole="image"`).
- ⬜ Test `Screen.test.tsx`: sigue renderizando la imagen de cabecera cuando se pasa
  `headerImageName` (animación decorativa, reanimated mockeado).
