# Plan — feature 71: prompts de actividad (3–6 pasos), persistir prompts y fecha en DTO

> Historia: [US-61](../historias-usuario/epic-b-cuentos.md#us-61) (épica B; afecta también a la C).
> Coordinación del lote: [coordinacion-ajustes-historial.md](coordinacion-ajustes-historial.md)
> (feature A). Rama: `feature/71-prompts-pasos-persistencia`. **Solo backend.**

Tres ajustes backend del lote de mejoras de historial, repartidos por capa para paralelismo con la
feature B (app). A toca solo backend y B solo app → sin ficheros compartidos.

## Fase 1 — Andamiaje (docs)

- ✅ US-61 en `Docs/historias-usuario/epic-b-cuentos.md` (Gherkin, ancla `#us-61`; nota que afecta a
  actividades, épica C).
- ✅ Trazabilidad en `Docs/historias-usuario/README.md` (Should · Mejoras · `— (prompts/BD)` · B) y
  listado de la épica B.
- ✅ Este plan (fases → tareas).
- ✅ `## [Unreleased]` en `packages/backend/CHANGELOG.md`.
- ✅ Commit `docs(planes): plan y US-61 de la feature 71`.

## Fase 2 — Implementación

### (#2) Pasos 3–6 en actividades

- ✅ `buildActivitiesPrompt` (ES y EN) en `infrastructure/ai/prompts.ts`: pide explícitamente que
  `instrucciones` tenga **entre 3 y 6 pasos** numerados, claros y para niños de 2 a 6 años.
- ✅ `MockProvider`: instrucciones mock con 3–6 pasos numerados.
- ✅ Tests en `prompts.test.ts` y `mock-provider.test.ts`.

### (#3) Persistir el prompt usado

- ✅ `prompt: string` en `GeneratedStory` y `GeneratedActivity` (`domain/ai/AIProvider.ts`).
- ✅ Providers lo devuelven: `Ollama`/`Cloud` el prompt realmente enviado (system + user);
  `Mock` uno representativo; `Fallback` propaga el del proveedor que sirvió.
- ✅ `prompt?: string` (nullable) en las entidades `Story` y `Activity`.
- ✅ `prisma/schema.prisma`: columna `prompt String?` en `stories` y `activities` + migración SQL
  `ADD COLUMN "prompt" TEXT;` + `prisma generate`.
- ✅ Mapeo en `PrismaStoryRepository`/`PrismaActivityRepository`.
- ✅ `GenerateStory` y `RecommendActivities` guardan `generado.prompt` en la entidad.
- ✅ `Docs/modelo-datos.md` actualizado (regla schema↔modelo).
- ✅ **NO** se expone en el DTO público (solo BD). Modo anónimo: no persiste (sin cambio).

### (#4 backend) Fecha en el DTO

- ✅ `creadoEn` (ISO string) en `StoryOutput` y `ActivityOutput` (`application/dto.ts`).
- ✅ `Activity` gana `creadoEn` (la entidad no lo llevaba; la columna ya existe) para poder mapearlo.
- ✅ Mapeo desde `entity.creadoEn` en `application/mappers.ts`.
- ✅ Tests del mapper / ruta.

## Definition of Done

- `pnpm install` + `pnpm check` verde (typecheck + lint + format:check + test).
- Tests co-localizados (prompt/mock/parseResponse/caso de uso/mapper).
- `modelo-datos.md` actualizado.
- Versionado **diferido**: en la rama solo se acumula `## [Unreleased]` (no se toca `version`).
- Sin merge/finish sin confirmación del usuario.
