# Plan — Feature 72: Historial — fecha de generación y filtros (US-62)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Coordinación del lote en
> [coordinacion-ajustes-historial.md](coordinacion-ajustes-historial.md) (feature **B**). Aquí va el
> **cómo** se trocea y ejecuta.
>
> Rama: `feature/72-historial-fecha-filtros` (desde `develop`). Historia: **US-62** (épica D,
> Historial; amplía **US-08**). **Solo app.**

## Contexto

Dos ajustes pedidos sobre el Historial del app (numerados **#4-app** y **#5** en el lote):

- **#4 (app) Mostrar la fecha de generación.** El backend (feature A, US-61) añade `creadoEn` (ISO)
  a los DTO de cuento y actividad. La app debe mostrarlo **formateado y localizado** (ES/EN) en el
  Historial (cada cuento y actividad), la lectura del cuento y la `ActivityCard`. Si `creadoEn`
  falta, no muestra nada (sin error). `creadoEn?` es **opcional** para no romper si el backend aún
  no lo envía (dependencia de runtime, no de ficheros).
- **#5 Filtros de búsqueda en el Historial.** Filtra **en cliente** las listas ya cargadas: cuentos
  por **tema** y **estilo**; actividades por **categoría**. Chips con opción **"Todos"** por
  defecto; etiquetas vía `temaLabel`/`estiloLabel`/`categoriaLabel` y textos por i18n (es/en). El
  estado del filtro es **local** de la pantalla.

### Decisiones tomadas (con el usuario)

- **#4** `creadoEn` viaja en el DTO (backend, A) y la app lo muestra formateado con el idioma activo
  (`Intl.DateTimeFormat`/`toLocaleDateString`). Opcional: si falta, no se pinta.
- **#5** filtros **en cliente** (la historia ya devuelve tema/estilo de cuentos y categoría de
  actividades); estado local; sin persistencia.

## Fase 1 — Andamiaje ✅

- ✅ US-62 en [epic-d-historial.md](../historias-usuario/epic-d-historial.md) (Gherkin, ancla
  `#us-62`; amplía US-08).
- ✅ Trazabilidad en [historias-usuario/README.md](../historias-usuario/README.md): fila US-62
  (Should · Mejoras · "Historial" · D) y listado de la épica D.
- ✅ Este plan.
- ✅ `## [Unreleased]` en [packages/app/CHANGELOG.md](../../packages/app/CHANGELOG.md).
- Commit: `docs(planes): plan y US-62 de la feature 72`.

## Fase 2 — Implementación

### Tarea 2.1 — `creadoEn` en tipos y esquemas (#4) ✅

- ✅ `creadoEn?: string` (ISO, opcional) en `Story` y `Activity`
  ([domain/types.ts](../../packages/app/src/domain/types.ts)).
- ✅ `creadoEn: z.string().optional()` en `storySchema` y `activitySchema`
  ([infrastructure/schemas.ts](../../packages/app/src/infrastructure/schemas.ts)) — opcional para no
  romper si el backend aún no lo envía.

### Tarea 2.2 — Helper de fecha localizada (#4) ✅

- ✅ Helper `formatearFecha(creadoEn, idioma)` que formatea la fecha ISO en el idioma del app
  (`es`/`en`); devuelve `null` si falta o es inválida. Co-localizado con su test.

### Tarea 2.3 — Mostrar la fecha (#4) ✅

- ✅ Fecha en `HistoryScreen` (cada cuento y cada actividad), `StoryReaderScreen` y `ActivityCard`.
- ✅ Si `creadoEn` falta, no se muestra nada (sin error).

### Tarea 2.4 — Filtros en el Historial (#5) ✅

- ✅ Estado local en `HistoryScreen`: filtro de **tema** y **estilo** (cuentos), **categoría**
  (actividades), por defecto "Todos".
- ✅ Chips (`SelectableChip`) con la opción "Todos"; etiquetas con `temaLabel`/`estiloLabel`/
  `categoriaLabel` y textos i18n nuevos en `es.ts`/`en.ts`.
- ✅ Filtrado en cliente de las listas ya cargadas.

### Tarea 2.5 — Tests co-localizados ✅

- ✅ Render de la fecha (helper + pantalla) y lógica de filtrado (elegir tema/estilo/categoría reduce
  la lista; "Todos" muestra todo). Estilo user-centric.

## Definition of Done

- `pnpm check` verde (typecheck + lint + format:check + test).
- US-62 + trazabilidad en docs; `## [Unreleased]` del CHANGELOG del app con las entradas.
- Integración con feature A antes de las pruebas con el usuario (la fecha la provee A).
- Versionado **diferido** (no se toca `version` en la rama).
