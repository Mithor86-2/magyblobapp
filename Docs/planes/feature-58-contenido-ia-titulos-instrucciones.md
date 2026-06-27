# Plan — feature/58 · Contenido IA: títulos variados + instrucciones de actividad + temas del generador

> Historia: **US-54** ([épica B](../historias-usuario/epic-b-cuentos.md#us-54); afecta también a la
> épica C, actividades). Coordinación del lote: [coordinacion-mejoras-paralelo-2.md](coordinacion-mejoras-paralelo-2.md) (F2).
> Estado por fase en [../phases.md](../phases.md); alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md).

## Objetivo

Tres mejoras de **contenido** que comparten el pipeline de IA (`prompts.ts`, `MockProvider`) y el
esquema Prisma, por lo que van juntas en una feature (ver mapa de conflictos del lote):

1. **(4) Títulos de cuento variados** — el prompt pide variar el título en cada generación y el
   `MockProvider` deja de usar el título fijo `"{nombre} y la aventura de {tema}"`.
2. **(5) Instrucciones de actividad** — campo nuevo `Activity.instrucciones` (dominio + schema +
   migración + DTO + mapper + caso de uso + prompt + mock); en la app, `ActivityCard` las muestra y
   el botón "Realizado" pasa a un color de acento propio.
3. **(fix) Temas del generador** — `StoryGeneratorScreen` hoy limita `temasDisponibles` a
   `profile.intereses` (faltan magia y música); debe ofrecer **todos** los temas con los intereses
   del perfil pre-seleccionados.

## Fases → tareas

### Fase 1 — Andamiaje (docs) ✅

- [x] US-54 en `epic-b-cuentos.md` (Gherkin, ancla `#us-54`; nota afectación épica C).
- [x] Fila de trazabilidad en `historias-usuario/README.md` (Should · Mejoras · Generador/Actividades · B)
      y alta en el listado de la épica B.
- [x] Este plan en `Docs/planes/`.
- [x] `## [Unreleased]` en `packages/backend/CHANGELOG.md` y `packages/app/CHANGELOG.md`.
- [x] Commit: `docs(planes): plan y US-54 de la feature 58 (contenido IA)`.

### Fase 2 — Implementación

**(4) Títulos variados** ✅

- [x] `infrastructure/ai/prompts.ts`: el prompt del cuento (ES/EN) pide variar el título en cada
      generación.
- [x] `infrastructure/ai/MockProvider.ts`: repertorio de plantillas de título elegido por índice
      derivado del contenido (determinista por entrada, variado entre temas/perfiles).
- [x] Test: varios temas del mismo perfil → títulos distintos (`mock-provider.test.ts`) +
      el prompt pide variar el título (`prompts.test.ts`).

**(5) Instrucciones de actividad** ✅

- [x] `domain/entities/Activity.ts`: campo `instrucciones`.
- [x] `prisma/schema.prisma`: `instrucciones String?` en `Activity` + migración SQL manual
      (`ADD COLUMN ... NULL`, sin shadow DB) + `prisma generate`.
- [x] `Docs/modelo-datos.md`: campo reflejado en el `erDiagram`.
- [x] `domain/ai/AIProvider.ts`: `GeneratedActivity.instrucciones`.
- [x] `infrastructure/ai/parseResponse.ts`: schema Zod (`textoOpcional`) + specs JSON de
      Ollama/Cloud.
- [x] `application/dto.ts`: `ActivityOutput.instrucciones` + `AnonymousActivityOutput`.
- [x] `mappers.ts` + `RecommendActivities` + `RecommendActivitiesAnonymous` + `PrismaActivityRepository`:
      propagan `instrucciones`.
- [x] `prompts.ts`: el prompt de actividades pide un paso a paso (ES/EN).
- [x] `MockProvider`: rellena `instrucciones` mock.
- [x] App `ActivityCard.tsx`: muestra las instrucciones; botón "Realizado" con variante `accent`
      (token `tertiary`). App `types.ts` + `schemas.ts` + `BubblyButton` (variante `accent`).
- [x] Tests: caso de uso/parseo (`parse-response.test.ts`), prompt, ruta de integración
      (`activities.integration.test.ts`), componente de la app (`ActivityCard.test.tsx`).

**(fix) Temas del generador** ✅

- [x] `StoryGeneratorScreen.tsx`: `temasDisponibles` = todos los temas del vocabulario (`TEMAS`),
      con los `intereses` del perfil pre-seleccionados.
- [x] Test del componente: aparecen magia y música (`StoryGeneratorScreen.test.tsx`).

## Definition of Done

- `pnpm check` verde (typecheck + lint + format:check + test).
- Tests co-localizados; frontera de capas respetada (Zod fuera de `/domain`).
- US-54 + trazabilidad actualizadas; `modelo-datos.md` al día con el schema.
- Entradas en ambos CHANGELOG bajo `## [Unreleased]` (sin asignar `version`).
- Pruebas con el usuario antes del cierre; `finish`/merge solo tras confirmación explícita.
