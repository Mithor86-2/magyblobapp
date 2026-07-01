# Plan — feature 78: actividades más significativas con instrucciones de ≥6 pasos

> Historia: [US-67](../historias-usuario/epic-c-actividades.md#us-67) (épica C).
> Rama: `feature/78-actividades-6-pasos`. **Solo backend.**

Ajusta el prompt de recomendación de actividades para generar actividades **más significativas** para
niños de 2-6 años, con instrucciones de **al menos 6 pasos detallados**. Contexto: hoy el prompt pide
"entre 3 y 6 pasos" (US-61) y el seed `prompt.activity.template` está desactualizado (no pedía pasos).
Se corrige a mínimo 6 pasos detallados + objetivo de aprendizaje + materiales sencillos de casa.
**Sin cambio de esquema Prisma** (el campo `instrucciones` ya existe), sin migración.

## Fase 1 — Andamiaje (docs)

- ✅ US-67 en `Docs/historias-usuario/epic-c-actividades.md` (Gherkin, ancla `#us-67`).
- ✅ Trazabilidad en `Docs/historias-usuario/README.md` (fila US-67 + listado épica C).
- ✅ Este plan (fases → tareas).
- ✅ `## [Unreleased]` en `packages/backend/CHANGELOG.md` (grupo `Changed`, ref US-67).
- ✅ Commit `docs(planes): plan feature 78 y US-67`.

## Fase 2 — Implementación

- ✅ `buildActivitiesPrompt` (ES y EN) en `infrastructure/ai/prompts.ts`: pide **al menos 6 pasos**
  numerados, detallados y concretos (cada paso explica qué hace el adulto y qué el niño), más un
  **objetivo de aprendizaje** breve y **materiales sencillos de casa**. Mantiene el resto del
  contrato (categoría, título, descripción, duración, nivel). Doc `/** */` actualizada (US-67).
- ✅ `prisma/seed.ts`: `prompt.activity.template` alineada con el nuevo default (≥6 pasos detallados +
  objetivo + materiales). Solo placeholders soportados por `rellenar`.
- ✅ `MockProvider`: `PASOS_ACTIVIDAD` ampliado a 8 pasos por idioma; `instruccionesMock` emite
  siempre ≥6 (`6 + ((n - 1) % 3)` → 6, 7, 8). Doc actualizada.

## Fase 3 — Tests

- ✅ `test/infrastructure/prompts.test.ts`: aserciones a "al menos 6" (ES) / "at least 6" (EN) +
  objetivo/materiales; refs US-61→US-67.
- ✅ `test/infrastructure/mock-provider.test.ts`: `toBeGreaterThanOrEqual(6)` (cota superior 8);
  título del test a US-67.
- ✅ `test/application/recommend-activities.test.ts` y `test/routes/activities.integration.test.ts`
  siguen verdes (solo comprueban `instrucciones` presente/no vacía).
- ✅ **NO** se añade validación dura de recuento en `parseResponse.ts` (política "sanea, no rechaza":
  `instrucciones` sigue opcional y saneada).

## Definition of Done

- `pnpm install` + `pnpm check` verde (typecheck + lint + format:check + test).
- Tests co-localizados (prompt/mock) actualizados; caso de uso/ruta verdes.
- Sin cambio de esquema Prisma → sin actualizar `modelo-datos.md`.
- Versionado **diferido**: en la rama solo se acumula `## [Unreleased]` (no se toca `version`).
- Sin merge/finish sin confirmación del usuario.
