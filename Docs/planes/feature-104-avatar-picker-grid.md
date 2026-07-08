# Plan — Selector de avatar en rejilla a ancho completo, sin fondo (US-104)

Ajuste visual del selector de avatar en **Crear perfil**, amplía [US-103](../historias-usuario/epic-a-perfil.md#us-103).
Rama `feature/104-avatar-picker-grid` desde `develop`. **Solo app**; sin cambios de backend ni de
datos (el `avatar` guardado sigue siendo el mismo `id`).

## Tareas

- ✅ **Rejilla 3×4 a ancho completo.** `AvatarPicker` pasa de celdas de tamaño fijo (`tapTarget`) a
  una rejilla de **4 columnas** cuyas celdas ocupan **1/4 del ancho del contenedor** (descontando
  los huecos): los 12 avatares quedan en **3 filas de 4** y las imágenes se agrandan hasta llenar
  el ancho. El ancho real del grid se mide con `onLayout` (estimación inicial con
  `useWindowDimensions` para evitar un salto en el primer frame).
- ✅ **Redondo y sin fondo.** La celda es **circular** (`borderRadius` = lado/2 + `overflow: hidden`,
  que recorta la imagen en círculo) y ya no pinta el recuadro de color
  (`surfaceContainer`/`primaryContainer`); las imágenes (con canal alfa) se muestran solas. La
  **selección** se marca con un **anillo redondo** del color primario (borde), que reserva su hueco
  en ambos estados para no desplazar el layout.
- ✅ **Gate.** `pnpm --filter @magyblob/app` typecheck + lint + prettier + test (332) en verde. El
  test de `AvatarPicker` sigue válido (12 botones localizables por `id`, `avatarSource` con fallback).
- ✅ **Docs.** US-104 en épica A + trazabilidad; CHANGELOG (Unreleased) del app.
- ❌ **Cierre.** Pruebas del usuario y merge a `develop` (versionado diferido) tras confirmación.
