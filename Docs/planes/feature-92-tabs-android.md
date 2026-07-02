# Plan — Feature 92: Pestañas, activo llena el botón + visibilidad Android (US-88, ajustes #7 + #8)

> **↩️ REVERTIDA (tras pruebas del usuario).** Se implementó (fondo activo cubriendo todo el ítem con
> un `tabBarButton` propio + inset inferior con `makeTabBarStyle`), pero el usuario pidió **dejar los
> botones del tab como estaban antes del lote**. Se revirtió `App.tsx` al `TabIcon` con "blob" y al
> `tabBarStyle` original, y se eliminaron `tabBarStyle.ts`/`tabBarStyle.test.ts`. El plan queda como
> registro histórico.

Rama: `feature/87-ajustes-ideas-3` (lote). Fichero propio: `App.tsx` (config del tab navigator).

## Objetivo

- **#7:** el estado activo colorea **todo el botón** de la pestaña (icono + etiqueta), no solo un
  "blob" alrededor del icono.
- **#8:** en Android la barra inferior / pestaña activa **se ve completa** (hoy queda tapada por la
  barra de navegación del sistema con edge-to-edge de Expo SDK 54+).

## Tareas

- [x] ✅ #7: rediseñar `TabIcon` / opciones del tab para que el fondo activo (`secondaryContainer`)
      rellene la celda del ítem (usar `tabBarActiveBackgroundColor` o `tabBarItemStyle` + fondo por
      ítem que cubra icono y etiqueta), conservando iconos lucide y colores del tema.
- [x] ✅ #8: `tabBarStyle` con alto adecuado + `paddingBottom` del safe-area inset inferior
      (`useSafeAreaInsets`) para no quedar bajo la nav bar de Android; revisar `androidNavigationBar`
      en `app.json`.
- [x] ✅ Si se extrae un helper puro de estilo de tab (`makeTabBarStyle(insets, colors)`), añadir test.
      Verificación principal: **manual** + **Maestro Android** (`onboarding.android.yaml`).
