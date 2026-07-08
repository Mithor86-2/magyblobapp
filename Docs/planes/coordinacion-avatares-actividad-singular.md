# Plan — Avatares con imagen + actividad singular en historial (2 features en paralelo)

Dos ajustes de la **Fase de mejoras**, ejecutados en paralelo (una rama/worktree por feature
desde `develop`). Ambos son **solo app** (`@magyblob/app`); el backend no cambia. Estado por
tarea: `❌` pendiente · `🔄` en curso · `✅` hecha.

- Ramas: `feature/95-avatares-imagen` · `feature/96-actividad-singular-historial`.
- Historias de usuario: **US-103** (avatares con imagen) · **US-09/US-10 ampliadas** (generar una
  actividad y verla/completarla desde el historial).
- Punto de solape conocido: `ActivitiesScreen.tsx` (F95 toca la línea del avatar del loader; F96
  toca categoría/botón/cantidad). Se resuelve al integrar en `develop`.

## Feature 95 — Avatares con imagen (rama `feature/95-avatares-imagen`)

Reemplaza los avatares emoji por el set de imágenes propias en
`packages/app/assets/images/avatars/` (sin descargas en runtime → cumplimiento C-2/C-5).

- ✅ **Optimizar imágenes.** 12 PNG 1024×1024 (~14 MB) → 256×256 recomprimidos (~1,1 MB total)
  con `sips -Z 256`. Tamaño de display ≤96 px, 256 px cubre @3x sin recorte.
- ✅ **Módulo de avatares.** En `AvatarPicker.tsx`: mapa `id→require` estático (Metro no resuelve
  `require` dinámicos), lista `AVATARS` (12 ids), resolutor `avatarSource(id)` con **fallback al
  avatar por defecto** (`zorro`) para ids antiguos sin imagen (`gato`, `unicornio`, …). Se elimina
  `avatarEmoji`.
- ✅ **Componente de render.** `AnimatedAvatar` pasa de `<Text>{emoji}</Text>` a `<Image source>`
  con prop `size` (firma `interactive` conservada; sigue estático por el crash de reanimated 4).
- ✅ **Pantallas que muestran avatar.** Home, SelectProfile, StoryGenerator, CreateProfile y el
  `FullScreenLoader` (prop `avatar` emoji → `avatarId`) usan `avatarSource`/`<Image>`; estilos
  `fontSize` → tamaño de imagen. `ActivitiesScreen` solo cambia la prop del loader.
- ✅ **Tests.** Reescritos `AvatarPicker.test` (cuenta de botones + `avatarSource` con fallback),
  `AnimatedAvatar.test` (imagen + etiqueta accesible) y `FullScreenLoader.test` (`avatarId`).
- ✅ **Sin cambios de backend** (el `avatar` es `string` libre; ids nuevos válidos, antiguos caen
  al defecto).

## Feature 96 — Generar una actividad + historial (rama `feature/96-actividad-singular-historial`)

El backend ya persistía **toda** actividad generada; el filtro "solo completadas" era de app.

- ✅ **Quitar "Todas".** `ActivitiesScreen`: estado `Categoria` no-null con defecto `arte`; sin
  chip "Todas".
- ✅ **Una a una.** `onGenerate` envía `{ profileId, categoria, cantidad: 1 }` (una actividad por
  pulsación).
- ✅ **Botón en singular.** i18n ES/EN: `activities.generate` → "Generar actividad"; `generateMore`
  → "Generar otra". Se retira `activities.all` (sin uso).
- ✅ **Pendientes en el historial.** `HistoryScreen` muestra todas las actividades (pendientes y
  hechas); `ultimaActividad` (Home "Lo último") considera también las pendientes.
- ✅ **Marcar realizado desde el historial.** `ActivityCard` expone el botón "Realizado" +
  estrellas también en modo `compact`; `HistoryScreen` pasa `onComplete` (llama a
  `api.activities.complete` y recarga).
- ✅ **Tests.** `historyFilters.test` (`ultimaActividad`), `HistoryScreen.test` (pendiente aparece
  / se marca hecho), E2E `actividades-historial.spec` (texto singular + marcar desde historial).

## Integración y cierre

- ✅ Gate por rama verde (typecheck + lint + prettier + tests) — F95 325 tests, F96 333 tests.
- 🔄 Integrar ambas en `develop` (versionado diferido: versión y `[x.y.z]` del CHANGELOG al
  integrar), resolviendo el solape de `ActivitiesScreen`.
- 🔄 `pnpm check` verde tras la integración.
- ❌ Actualizar docs (`phases.md`, `historias-usuario/`) y pruebas manuales del usuario en develop
  local antes de dar por cerrado.
