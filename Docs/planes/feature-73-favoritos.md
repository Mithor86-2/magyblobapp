# Plan — Feature 73: Favoritos (backend) (US-63)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Coordinación del lote en
> [coordinacion-favoritos-busqueda.md](coordinacion-favoritos-busqueda.md). Aquí va el **cómo** se
> trocea y ejecuta.
>
> Rama: `feature/73-favoritos` (desde `develop`). Historia: **US-63** (épica D, historial). Capa:
> **solo backend** (la UI va en US-64, rama `feature/74-favoritos-busqueda-app`).

## Contexto

Favorito = **flag booleano** por cuento/actividad (que ya cuelgan de un perfil) → "favoritas por
perfil" sin tabla nueva. Endpoints **idempotentes** `POST /stories/:id/favorite` y
`POST /activities/:id/favorite` con body `{ favorito: boolean }` (patrón de `:id/read` y
`:id/complete`). Se sigue el molde de `MarkStoryRead` / `CompleteActivity`.

## Fase 1 — Andamiaje (docs) ✅

- ✅ US-63 en `epic-d-historial.md` (Gherkin, ancla `#us-63`) — historial es la épica natural por ser
  transversal (cuentos + actividades), con constancia de la decisión.
- ✅ Fila de trazabilidad en `historias-usuario/README.md` (Should · Mejoras · backend/BD) + listado
  de la épica D.
- ✅ Este plan (fases→tareas).
- ✅ `## [Unreleased]` del `packages/backend/CHANGELOG.md` con la entrada de favoritos.

## Fase 2 — Implementación ✅

### Dominio

- ✅ Campo `favorito: boolean` (default `false`) en la entidad `Story` (`StoryProps` + propiedad
  mutable + setter `marcarFavorito(valor)`).
- ✅ Ídem en la entidad `Activity`.

### Persistencia

- ✅ `favorito Boolean @default(false)` en `Story` y `Activity` en `prisma/schema.prisma`.
- ✅ Migración SQL a mano (sin shadow DB, patrón de migraciones previas): `ADD COLUMN "favorito"
BOOLEAN NOT NULL DEFAULT false` en `stories` y `activities` + `prisma generate`.
- ✅ Repos Prisma: `favorito` en `create`, `update` (upsert) y la lectura (`toStory`/`toActivity`).
- ✅ `Docs/modelo-datos.md` actualizado (bloque ER + nota conceptual).

### Aplicación

- ✅ Casos de uso `SetStoryFavorite` y `SetActivityFavorite` (idempotentes: cargan, fijan flag,
  guardan; `NotFoundError` si no existe) + tests con dobles in-memory.
- ✅ `favorito` en `StoryOutput` / `ActivityOutput` (`dto.ts`) + DTO de request.
- ✅ Mapeado en `mappers.ts` (`toStoryOutput` / `toActivityOutput`).
- ✅ `GenerateStory` / `RecommendActivities` crean con `favorito: false` (cubierto por el default de
  la entidad y del schema); `GetHistory` lo devuelve vía los mappers.

### Rutas

- ✅ `POST /stories/:id/favorite` y `POST /activities/:id/favorite`, protegidas, body Zod
  `{ favorito: boolean }`, devuelven el cuento/actividad actualizado.
- ✅ Tests de integración (200 + 404 + 400) co-localizados.

## Definition of Done

- `pnpm check` verde (typecheck + lint + format:check + test).
- Tests co-localizados: caso de uso (×2) + ruta (×2 endpoints) + mapper (favorito en el output).
- Versionado **diferido**: solo `## [Unreleased]` en esta rama (la versión se asigna al integrar).
- No se cierra ni mergea sin confirmación del usuario.
