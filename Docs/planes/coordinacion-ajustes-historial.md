# Plan de coordinación — Ajustes: contenido, trazabilidad e historial

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado en
> [../phases.md](../phases.md); protocolo de paralelismo en [../trabajo-en-paralelo.md](../trabajo-en-paralelo.md).
>
> Coordinación del lote (2 features en paralelo). El detalle fases→tareas de cada una vive en su
> `Docs/planes/<branch>.md` (lo escribe `abrir-feature`).

## Objetivo

Cuatro ajustes pedidos (numerados 2–5 en `ideas.txt`), repartidos por capa para máximo paralelismo:
**A = backend** (#2 pasos del prompt, #3 persistir prompts, #4-backend fecha en DTO) y **B = app**
(#4-app mostrar fecha, #5 filtros del historial). Como A toca solo backend y B solo app, **no comparten
ficheros** → paralelo limpio.

## Features

| Ref | Feature                                                             | US    | Rama                                    | Capa    | Migración                           |
| --- | ------------------------------------------------------------------- | ----- | --------------------------------------- | ------- | ----------------------------------- |
| A   | Prompts de actividad (3–6 pasos) + persistir prompts + fecha en DTO | US-61 | `feature/71-prompts-pasos-persistencia` | backend | **sí** (`prompt` en Story/Activity) |
| B   | Historial: fecha de generación + filtros de búsqueda                | US-62 | `feature/72-historial-fecha-filtros`    | app     | no                                  |

## Orden

```
OLA ÚNICA — A y B en paralelo (sin solaparse en ficheros).
```

Dependencia de **runtime** (no de ficheros): la fecha que pinta B (#4) la provee A en la respuesta
(`creadoEn` en `StoryOutput`/`ActivityOutput`). B usa `creadoEn?` **opcional** para no romper si aún no
está; **ambas se integran antes de las pruebas**.

## Mapa de conflictos

| Zona                                                                                                          | A   | B   | Nota         |
| ------------------------------------------------------------------------------------------------------------- | --- | --- | ------------ |
| `prompts.ts`, `AIProvider`+providers, entidades, `schema.prisma`, repos, casos de uso, `dto.ts`, `mappers.ts` | ✓   | —   | solo backend |
| `app/.../types.ts`, `schemas.ts`, `HistoryScreen`, `StoryReaderScreen`, `ActivityCard`, i18n                  | —   | ✓   | solo app     |

Sin ficheros compartidos. Solo **A** migra Prisma.

## Decisiones tomadas (con el usuario)

- **#3** se persiste como **columna `prompt` (TEXT, nullable)** en `Story` y `Activity` (system+user del
  prompt usado), **solo en BD** (no se expone en el DTO público; consultable por SQL o `prompts:dump`).
  Los proveedores (`Mock`/`Ollama`/`Cloud`) devuelven el `prompt` usado en `GeneratedStory`/`GeneratedActivity`.
- **#2** el prompt de actividades pide explícitamente **entre 3 y 6 pasos** en `instrucciones` (ES/EN).
- **#4** `creadoEn` se añade a `StoryOutput`/`ActivityOutput` (backend) y la app lo muestra formateado.
- **#5** filtros **en cliente** (la historia ya devuelve tema/estilo de cuentos y categoría de actividades).

## Notas técnicas

- **A:** `GeneratedStory`/`GeneratedActivity` ganan `prompt`; Ollama/Cloud devuelven el prompt construido
  (`buildStoryPrompt`/`buildActivitiesPrompt`), Mock un prompt representativo. `Story.prompt`/`Activity.prompt`
  (nullable) + migración SQL `ADD COLUMN ... NULL` + `prisma generate` + `modelo-datos.md`. `creadoEn` (ISO)
  en `StoryOutput`/`ActivityOutput` vía `mappers`. `buildActivitiesPrompt` pide 3–6 pasos.
- **B:** `creadoEn?: string` en los tipos/esquemas del app; fecha formateada (localizada ES/EN) en Historial,
  lectura y `ActivityCard`. Filtros en `HistoryScreen`: chips de tema+estilo (cuentos) y categoría
  (actividades) con opción "Todos"; filtra las listas en memoria. Textos por i18n.

## Definition of Done

- `pnpm check` verde tras cada fase; tests co-localizados (caso de uso/prompt/mapper en A; filtros/fecha en B).
- US-61 / US-62 creadas + trazabilidad en `historias-usuario/README.md`; `modelo-datos.md` actualizado (A).
- Integración de ambas en `develop` con versionado diferido; pruebas con el usuario antes del cierre a `main`.
