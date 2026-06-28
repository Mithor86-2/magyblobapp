# Plan de coordinación — Favoritos y búsqueda en el historial

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado en
> [../phases.md](../phases.md); protocolo de paralelismo en [../trabajo-en-paralelo.md](../trabajo-en-paralelo.md).
>
> Coordinación del lote (2 features en paralelo). El detalle fases→tareas vive en cada
> `Docs/planes/<branch>.md` (lo escribe `abrir-feature`).

## Objetivo

Dos ajustes, repartidos por capa para máximo paralelismo:

- **#1 Favoritos por perfil:** marcar cuentos/actividades como favoritos (botón estrella) → **A = backend**
  (persistencia + endpoints + DTO) y la parte UI en **B = app**.
- **#2 Búsqueda de texto en el historial:** campo que busca por título, cuerpo/descripción, instrucciones,
  tema, estilo y categoría → **B = app** (en cliente).

A toca solo backend y B solo app → **no comparten ficheros** (paralelo limpio).

## Features

| Ref | Feature                                                        | US    | Rama                                | Capa    | Migración                             |
| --- | -------------------------------------------------------------- | ----- | ----------------------------------- | ------- | ------------------------------------- |
| A   | Favoritos: persistencia + endpoints + DTO                      | US-63 | `feature/73-favoritos`              | backend | **sí** (`favorito` en Story/Activity) |
| B   | App: botón favorito + filtro favoritos + búsqueda en historial | US-64 | `feature/74-favoritos-busqueda-app` | app     | no                                    |

## Orden

```
OLA ÚNICA — A y B en paralelo (sin solaparse en ficheros).
```

Dependencia de **runtime** (no de ficheros): el botón de favorito (B) usa el endpoint de A; la búsqueda
(B) es independiente. B usa `favorito?` **opcional** en su esquema; **ambas se integran antes de probar**.

## Mapa de conflictos

| Zona                                                                                                                                | A   | B   |
| ----------------------------------------------------------------------------------------------------------------------------------- | --- | --- |
| entidades, `schema.prisma`, repos, casos de uso, rutas, `dto.ts`, `mappers.ts`                                                      | ✓   | —   |
| `types.ts`, `schemas.ts`, `gateways.ts`, `http.ts`, `HistoryScreen`, `historyFilters.ts`, `StoryReaderScreen`, `ActivityCard`, i18n | —   | ✓   |

Sin ficheros compartidos. Combino favoritos-UI + búsqueda en **una** feature app (ambas tocan
`HistoryScreen`/`historyFilters.ts`, así no chocan entre sí). Solo **A** migra.

## Decisiones tomadas (con el usuario)

- **Favorito = flag booleano** por cuento/actividad (que ya cuelgan de un perfil) → "favoritas por perfil"
  sin tabla nueva.
- Endpoint **idempotente** `POST /stories/:id/favorite` y `POST /activities/:id/favorite` con body
  `{ favorito: boolean }` (patrón de `:id/read` y `:id/complete`).
- Icono: **estrella** (lucide `star`, relleno cuando es favorito).
- Búsqueda en cliente, **normalizada** (minúsculas, sin acentos), por subcadena en los campos relevantes;
  se combina con los filtros de US-62 y el de favoritos.

## Notas técnicas

- **A:** `favorito: boolean` (default `false`) en `Story`/`Activity` + `schema.prisma` (migración SQL
  `ADD COLUMN "favorito" BOOLEAN NOT NULL DEFAULT false`) + `prisma generate` + `modelo-datos.md`. El
  `upsert` de los repos añade `favorito` al `update`. Casos de uso `SetStoryFavorite`/`SetActivityFavorite`
  (idempotentes) + rutas protegidas. `favorito` en `StoryOutput`/`ActivityOutput` + `mappers`.
- **B:** gateways `stories.setFavorite(id, fav)` / `activities.setFavorite(id, fav)` + `http.ts`;
  `favorito?` en tipos/esquemas; botón estrella (toggle, optimista) en lectura, ítems del historial y
  `ActivityCard`; filtro "solo favoritos" + **campo de búsqueda** en `HistoryScreen`/`historyFilters.ts`
  (busca en titulo, cuerpo/descripcion, instrucciones, tema, estilo, categoria). Textos por i18n (es/en).

## Definition of Done

- `pnpm check` verde tras cada fase; tests co-localizados (caso de uso/ruta/mapper en A; toggle/búsqueda/filtro en B).
- US-63 / US-64 creadas + trazabilidad en `historias-usuario/README.md`; `modelo-datos.md` actualizado (A).
- Integración de ambas en `develop` con versionado diferido; pruebas con el usuario antes del cierre a `main`.
