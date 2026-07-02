# Plan — Feature 94: Animación suave del avatar del niño (US-90, ajuste #2)

Rama: `feature/87-ajustes-ideas-3` (lote 4). Ficheros: `AnimatedAvatar.tsx` (nuevo), `HomeScreen.tsx`,
`StoryGeneratorScreen.tsx`, `AvatarPicker.tsx`.

## Objetivo

El emoji de avatar del niño se mueve suavemente (giro leve + rebote, "como si moviera la cabeza") en
bucle infinito, también al crear el perfil / elegir avatar.

## Tareas

- ⬜ `AnimatedAvatar.tsx`: envuelve el `Text` del emoji en un `Animated.Text` (reanimated) con
  `rotate` (±~6°) + `translateY` (rebote ~4px) en bucle (`withRepeat(withTiming(...), -1, true)`),
  patrón de `BouncingHeaderImage`. Props: `emoji`, `style?`, `accessibilityLabel?`.
- ⬜ `HomeScreen`: usar `AnimatedAvatar` para el avatar del hero.
- ⬜ `StoryGeneratorScreen`: usar `AnimatedAvatar` para el avatar de la cabecera.
- ⬜ `AvatarPicker`: el avatar **seleccionado** se anima (los demás, estáticos).
- ⬜ Tests: `AnimatedAvatar.test.tsx` (renderiza el emoji; reanimated mockeado, decorativo).
