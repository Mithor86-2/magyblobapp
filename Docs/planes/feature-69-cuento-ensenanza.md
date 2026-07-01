# Feature US-69 — Cuento a la carta: elegir la enseñanza/valor

**Objetivo:** el adulto puede elegir (opcionalmente) la **enseñanza/valor** que quiere
transmitir con el cuento; el cuento se construye alrededor de esa moraleja. Convierte la app
en una herramienta **educativa dirigida** (argumento fuerte de defensa). Reutiliza el corazón
del proyecto (`AIProvider`) sin cambiar su interfaz — solo amplía el prompt y añade un campo.

**Rama (al abrir):** `feature/<id>-cuento-ensenanza` desde `develop` (worktree). **Versionado diferido.**

## Decisiones (confirmadas)

- **Catálogo cerrado `ENSENANZAS`** (ASCII en dominio; presentación con acentos en la UI):
  - `amistad` — amistad y compartir.
  - `emociones` — gestionar emociones (enfado, tristeza, frustración).
  - `valentia` — valentía y superar miedos.
  - `honestidad` — honestidad y respeto.
- **Flujo:** **opcional** (0 o 1), **selección única**, **persistida** en `Story` (migración)
  y **filtrable** en el Historial (coherente con los filtros de US-62). Reutiliza el patrón
  de `TEMAS`/`ESTILOS` y del prompt maestro US-26/US-28 (que ya tiene "enseñanza final").

## Diseño técnico (resumen)

- **Vocabulario:** `ENSENANZAS`, tipo `Ensenanza` y guard `esEnsenanza` en
  `domain/vocabulary.ts`; entidad `Story` con `ensenanza?: Ensenanza`.
- **Contrato:** `POST /stories` acepta `ensenanza?` (`z.enum(ENSENANZAS).optional()`);
  `StoryOutput` la devuelve; se persiste en `stories.ensenanza` (`String?`, migración).
- **Prompt:** `buildStoryPrompt` interpola la enseñanza en texto legible ES/EN, reforzando la
  moraleja final sin romper US-26/US-28; `MockProvider` la refleja de forma determinista.
- **App:** chip único opcional "¿Qué quieres enseñar?" en `StoryGeneratorScreen`; filtro por
  enseñanza en `HistoryScreen`/`historyFilters.ts`; badge opcional en `StoryReaderScreen`.

---

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha

### Fase 0 — Apertura

- ❌ Crear rama/worktree `feature/<id>-cuento-ensenanza` desde `develop` (skill `abrir-feature`).
- ❌ Crear **US-69** con criterios Gherkin en [epic-b-cuentos.md](../historias-usuario/epic-b-cuentos.md)
  - fila en la tabla de trazabilidad.
- ❌ `## [Unreleased]` listo en el CHANGELOG del backend y del app.

### Fase 1 — Dominio

- ❌ `vocabulary.ts`: `ENSENANZAS`, `Ensenanza`, `esEnsenanza` (documentado, skill `documentar`).
- ❌ `domain/entities/Story.ts`: campo opcional `ensenanza`.
- ❌ **Tests** del type-guard y de la entidad (valor válido/ausente).

### Fase 2 — Aplicación

- ❌ `application/dto.ts`: `GenerateStoryRequest.ensenanza?` y `StoryOutput.ensenanza?`.
- ❌ `GenerateStory`: propaga `ensenanza` al prompt y a la persistencia.
- ❌ `mappers.ts`: `toStoryOutput` incluye `ensenanza`.
- ❌ **Tests** del caso de uso: con enseñanza (aparece en salida) y sin ella (opcional).

### Fase 3 — Infraestructura (prompt + Prisma)

- ❌ `infrastructure/ai/prompts.ts`: `buildStoryPrompt` interpola la enseñanza (ES/EN legible),
  reforzando la moraleja final (respeta US-26/US-28).
- ❌ `MockProvider`: refleja la enseñanza de forma determinista (para tests y modo por defecto).
- ❌ `schema.prisma`: `Story.ensenanza String?` + **migración** (coordinada con US-68, ver
  [coordinacion](coordinacion-logros-ensenanza.md)).
- ❌ `PrismaStoryRepository`: mapper fila↔entidad persiste/lee `ensenanza`.
- ❌ Actualizar [../modelo-datos.md](../modelo-datos.md) (campo `ensenanza` en `Story`).
- ❌ **Tests:** prompt contiene la enseñanza elegida; mock determinista.

### Fase 4 — Ruta HTTP

- ❌ `routes/stories.ts`: `bodySchema` añade `ensenanza: z.enum(ENSENANZAS).optional()` (`.strict()`).
- ❌ **Test de integración:** enseñanza válida (201 + persistida), enum inválido (400), ausente (201).

### Fase 5 — App

- ❌ `domain/types.ts`: `GenerateStoryRequest.ensenanza?` y `Story.ensenanza?`.
- ❌ `infrastructure/schemas.ts`: el esquema de `Story` admite `ensenanza`.
- ❌ `StoryGeneratorScreen.tsx`: grupo de `SelectableChip` **selección única opcional** con
  opción por defecto "Ninguna"; envía `ensenanza` solo si se eligió.
- ❌ `historyFilters.ts` + `HistoryScreen.tsx`: filtro por enseñanza (con "Todas" por defecto),
  combinado con los filtros existentes (US-62/US-64).
- ❌ (Opcional) badge de enseñanza en `StoryReaderScreen`.
- ❌ i18n ES/EN de las 4 enseñanzas (`i18n/locales/es.ts`, `en.ts`).
- ❌ **Tests:** componente del generador (chip único opcional), `historyFilters` (filtra por
  enseñanza), `schemas` (acepta/omite el campo).

### Fase 6 — Cierre

- ❌ Gate `pnpm check` verde (backend + app) y `expo export`.
- ❌ CHANGELOG (Unreleased) por paquete; actualizar [../phases.md](../phases.md) e historias.
- ❌ **Pruebas con el usuario** (generar cuentos con y sin enseñanza; verificar filtro en Historial).
  Recomendado validar la calidad del prompt con `pnpm prompts:dump` (Groq/Gemini) fuera del gate.
- ❌ `git flow feature finish` **solo tras confirmación** (versionado diferido al integrar).

## Cumplimiento

- Sin terceros nuevos ni red en el modo por defecto: `ENSENANZAS` es vocabulario local y el
  prompt corre en `mock`/`local`/`cloud` como el resto. No añade PII: la enseñanza es un
  enum, no texto libre.
