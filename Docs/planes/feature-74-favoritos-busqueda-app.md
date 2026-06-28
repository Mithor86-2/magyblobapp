# Plan — Feature 74: App, favoritos (UI) + búsqueda en el historial (US-64)

> Rama `feature/74-favoritos-busqueda-app` (desde `develop`). Coordinación del lote en
> [coordinacion-favoritos-busqueda.md](coordinacion-favoritos-busqueda.md) — esta es la **feature B**
> (solo app). La persistencia y los endpoints de favoritos los aporta la **feature A** (US-63,
> backend). Historia: [US-64](../historias-usuario/epic-d-historial.md#us-64).

## Objetivo

Dos ajustes en el app, ambos sobre el Historial y el contenido:

- **Favoritos (UI):** botón estrella (lucide `star`, relleno cuando es favorito) para alternar el
  favorito de un cuento/actividad en la lectura del cuento, los ítems del Historial y `ActivityCard`,
  con actualización **optimista**. Usa los endpoints de la feature A
  (`POST /stories/:id/favorite` y `POST /activities/:id/favorite`, body `{ favorito }`).
- **Búsqueda y filtro favoritos en el Historial:** chip "Solo favoritos" + campo de búsqueda de texto
  en cliente (coincidencia **normalizada**), combinados con los filtros de US-62.

Dependencia de **runtime** (no de ficheros) con la feature A: el campo `favorito?` es **opcional** en
los tipos/esquemas del app hasta que A se integre.

## Fases → tareas

### Fase 1 — Andamiaje (docs) ✅

- ✅ US-64 en `epic-d-historial.md` (Gherkin, ancla `#us-64`; amplía US-08/US-62).
- ✅ Fila de trazabilidad en `historias-usuario/README.md` (Should · Mejoras · Historial · D) y
  listado de la épica D.
- ✅ Este plan en `Docs/planes/`.
- ✅ `## [Unreleased]` en `packages/app/CHANGELOG.md`.
- ✅ Commit `docs(planes): plan y US-64 de la feature 74`.

### Fase 2 — Implementación

- ❌ `favorito?: boolean` (opcional) en `Story`/`Activity` (`domain/types.ts`) y en `storySchema`/
  `activitySchema` (`infrastructure/schemas.ts`).
- ❌ Gateways `stories.setFavorite(id, favorito)` y `activities.setFavorite(id, favorito)` en
  `domain/gateways.ts` + implementación en `infrastructure/http.ts` (POST autenticado, devuelven el
  item validado por Zod).
- ❌ Componente `FavoriteButton` (estrella lucide; relleno = favorito; vía wrapper `Icon`).
- ❌ Botón estrella optimista en `StoryReaderScreen`, ítems del Historial y `ActivityCard`.
- ❌ `historyFilters.ts`: función pura de **búsqueda normalizada** + filtro **solo favoritos**,
  combinada con los filtros de tema/estilo/categoría de US-62; tests.
- ❌ `HistoryScreen`: campo de búsqueda (`TextField`) + chip "Solo favoritos" cableados a la lógica
  pura; el favorito se alterna también desde los ítems.
- ❌ i18n: claves nuevas en `es.ts`/`en.ts` (placeholder de búsqueda, "Solo favoritos",
  "Sin resultados", a11y de la estrella).
- ❌ Tests: toggle de favorito (gateway llamado + estado), búsqueda (normalizada reduce; vacío =
  todo), filtro favoritos, combinación de filtros.

## Cierre (sin finalizar)

- Plan al día; entradas en `## [Unreleased]` de `packages/app/CHANGELOG.md` (sin tocar `version`).
- `pnpm install` + `pnpm check` en verde (exit 0).
- Commits en Conventional Commits (español), staging selectivo. **No** `git flow feature finish`.
