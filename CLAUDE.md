# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

El **estado por fase es volátil y vive en [Docs/phases.md](Docs/phases.md)** — léelo al empezar la
sesión; no se duplica aquí. El plan maestro
[Docs/plan-ejecucion-master.md](Docs/plan-ejecucion-master.md) **debe consultarse antes de construir
nada**: define la arquitectura, el orden de fases y el gate (Definition of Done) que cierra cada una.

**Living tracking docs (read at the start of a session, update at the end):**

- [Docs/phases.md](Docs/phases.md) — what's done / what's pending per phase. Update when a phase advances or closes.
- [Docs/memory.md](Docs/memory.md) — decisions made along the way and their rationale.
- [Docs/lecciones-aprendidas.md](Docs/lecciones-aprendidas.md) — concrete gotchas and how they were solved.
- [Docs/historias-usuario/](Docs/historias-usuario/README.md) — historias de usuario y criterios de
  aceptación (Gherkin), un documento por épica + índice con la tabla de trazabilidad
  (historia → fase → pantalla). Es la fuente de los tests del DoD.
- [Docs/modelo-datos.md](Docs/modelo-datos.md) — modelo de datos (diagrama entidad-relación y
  entidades: `Guardian`, `ChildProfile`, `Story`, `Activity`, `InteractionEvent`, `AuditLog`). Es la
  fuente conceptual; su materialización relacional vive en el esquema Prisma
  [packages/backend/prisma/schema.prisma](packages/backend/prisma/schema.prisma). Si cambias el
  esquema, actualiza también este doc.

**Regla de planes (enforced):** todo plan de implementación se escribe como documento en
[Docs/planes/](Docs/planes/) (un fichero por fase, p. ej. [Docs/planes/fase-5.md](Docs/planes/fase-5.md)),
nunca solo en el chat. Cada plan se estructura en **fases → tareas** y debe permitir seguir su
estado: marca cada tarea como pendiente / en curso / hecha (p. ej. `❌`/`🔄`/`✅` o checkboxes) y
actualiza esas marcas a medida que avanza el trabajo. El alcance global sigue viviendo en
[Docs/plan-ejecucion-master.md](Docs/plan-ejecucion-master.md) y el estado por fase en
[Docs/phases.md](Docs/phases.md); los documentos de `Docs/planes/` desarrollan el **cómo** se trocea
y ejecuta cada fase.

It is the codebase for a Máster (TFM) project: a bilingual children's app that creates a child
profile and generates stories / recommends activities using a local LLM.

## Skills del proyecto

Hay skills disponibles que automatizan flujos de este repo. Úsalas en lugar de reproducir los pasos
a mano (solo estas tres son relevantes aquí; el resto de skills instaladas son de otros stacks):

- **`abrir-feature`** — al iniciar una feature o fase. Crea la rama con Git Flow desde `develop`,
  escribe/enlaza el plan en [Docs/planes/](Docs/planes/) (fases→tareas con seguimiento de estado),
  vincula la historia de usuario (US-NN) y deja el `## [Unreleased]` del CHANGELOG listo. Es el
  extremo de apertura del ciclo que cierra `cerrar-feature`. Vive en el repo:
  [.claude/skills/abrir-feature/](.claude/skills/abrir-feature/).
- **`nuevo-caso-uso`** — al añadir un caso de uso o endpoint al backend. Andamia el vertical slice
  Clean Arch: interfaz de repositorio en `domain`, caso de uso + DTOs en `application` con su test
  (dobles in-memory), repo Prisma en `infrastructure`, ruta Fastify con JSON Schema y su test de
  integración. Vive en el repo: [.claude/skills/nuevo-caso-uso/](.claude/skills/nuevo-caso-uso/).
- **`nueva-pantalla`** — al añadir una pantalla o flujo a la app Expo. Andamia las capas del app
  (`domain` tipos/gateway → `infrastructure/http` → estado en store Zustand o `useState` →
  `presentation/screens` consumiendo el `api` inyectado y los tokens de theme → registro en el
  navegador). Vive en el repo: [.claude/skills/nueva-pantalla/](.claude/skills/nueva-pantalla/).
- **`cerrar-feature`** — al finalizar una feature o cerrar una fase. Aplica la Definition of Done
  (gate verde con `pnpm check`), el versionado SemVer, el `CHANGELOG.md` por paquete, la
  actualización de docs y el cierre con Git Flow. Es la skill que ejecuta el proceso descrito en
  "Versionado y changelog" más abajo. Vive en el repo: [.claude/skills/cerrar-feature/](.claude/skills/cerrar-feature/).
- **`gitflow-es:git`** / **`gitflow-es:commit`** (plugin `gitflow-es`) — para cualquier operación de
  ramas o commits (start/finish de features, hotfixes, releases, mensajes en Conventional Commits en
  español). Ver "Git workflow" más abajo.

## Working strategy (non-obvious, enforced)

- **Vertical slice first.** Get one end-to-end flow working (create profile → generate story)
  before widening scope. Everything after Phase 4 is _widening_, not _rebuilding_.
- **One session per phase.** Work only the current phase and stop at its Definition of Done
  before moving on. Do not pull work forward from later phases.
- **YAGNI over completeness.** The plan repeatedly favors less abstraction where it doesn't pay
  off (e.g. value-objects only for `edad`/`idioma`; a vector DB was considered and dropped in
  favor of simple title-dedup). Prefer the simpler option and justify omissions in writing.

## Code conventions (enforced)

- **Layer import-boundaries are the project invariant.** Dependencies point inward: `/domain`
  imports from no other layer and depends on no framework; the application layer depends only on
  `/domain` interfaces, never on infrastructure. This is enforced by ESLint
  (`no-restricted-imports` in [eslint.config.mjs](eslint.config.mjs)). **If the lint blocks an
  import, the design is wrong, not the lint** — move the dependency, don't disable the rule.
- **Ubiquitous language in Spanish, scaffolding in English.** Domain vocabulary (entities and their
  fields: `Guardian`, `ChildProfile`, `nombre`, `edad`, `idioma`, `parentesco`, `intereses`) stays
  in Spanish — it is the shared language with the plan and the user stories. Technical scaffolding
  (`Repository`, `UseCase`, `Provider`, `Dto`, `*Error`) stays in English. Commits and docs are in
  Spanish.
- **Tests: one per use case and per endpoint, co-located.** Vitest, files named `*.test.ts` next to
  the unit under test. Domain/application tests touch no IO (no DB, no HTTP, no Ollama) — that is
  what the layering buys; use the `MockProvider` and in-memory repos. Integration tests for routes
  live under `test/`.
- **Children's-app compliance constrains every feature.** Before adding anything that touches the
  network, third-party SDKs, analytics, or data retention, check
  [Docs/cumplimiento-menores.md](Docs/cumplimiento-menores.md): no third-party SDKs, no external
  calls in the default (`mock`) mode, data minimization, parental gate. When in doubt, don't add it.

## Definition of Done (gates every phase)

No phase closes until **all** of these pass (run from the repo root):

```bash
pnpm check            # typecheck + lint + format:check + test (the whole gate, one command)

# Or individually:
pnpm typecheck        # tsc --noEmit per package
pnpm lint             # ESLint (lint:fix to autofix)
pnpm format:check     # Prettier (format to write)
pnpm test             # Vitest per package

docker compose up     # whole stack comes up on a clean machine
```

Single backend test: `pnpm --filter @magyblob/backend exec vitest run <file>`
(or `vitest run -t "<test name>"`).

**Regla de seguridad (enforced): verifica el gate antes de pedir commit o cerrar la rama.** Al
**terminar cualquier ajuste**, ejecuta la comprobación completa (`pnpm check` = typecheck + lint +
format:check + test; o los comandos individuales cuando proceda) y **valida que todo pasa en verde
(exit 0)** antes de solicitar el commit o de proponer cerrar la rama. Si algo falla, arréglalo y
re-ejecuta hasta que pase; **no** pidas commit ni cierre con el gate en rojo o sin haberlo corrido.
Esta regla aplica en **cada iteración**, no solo al cierre de fase, y antecede a las dos reglas de
abajo (pruebas con el usuario → confirmación → `finish`).

**Regla de seguridad (enforced): pruebas con el usuario como último paso.** Cuando la fase lo
amerite, además del gate automático, el **último paso** antes de cerrarla es **solicitar las
pruebas al usuario**: que las haga **manualmente** (dale pasos/comandos concretos) o que se le
**ofrezca/genere una verificación automatizada**. No des la fase por cerrada sin ese paso. Encadena
con la regla de confirmación: pruebas → confirmación explícita → `git flow feature finish`.

`docker compose up` reproducibility is a hard requirement — clone → `cp .env.example .env` →
`docker compose up` → backend on <http://localhost:3000/health>, with no hidden steps. The default
`AI_PROVIDER=mock` means it runs with no GPU/model. For real local AI, run `pnpm ollama:setup`
(pulls `gemma:2b` into the Ollama container).

## Planned architecture

Clean Architecture in a **monorepo** (pnpm workspaces or turborepo) with `backend` and `app`
packages. Stack: PostgreSQL 16, Ollama (local LLM), Expo + Zustand (mobile app), Prisma (or chosen
ORM), pino (structured logs).

Layering (dependencies point inward — `/domain` has **zero external dependencies**):

- **`/domain`** — pure business logic: entities (`ChildProfile`, `Story`, `Activity`),
  value-objects, and repository _interfaces_. No frameworks, no IO.
- **Application** — use cases (`CreateChildProfile`, `RecommendActivities`, `SaveProgress`,
  `GetHistory`), each with its own test, plus input/output DTOs.
- **Infrastructure** — PostgreSQL repos implementing the domain interfaces, HTTP controllers/routes,
  centralized error handling, migrations + seeds.

### The AI layer is the core of the project

A single `AIProvider` interface (`generateStory`, `recommendActivities`) with **two swappable
modes** selected by env var (`mock | local`):

- **MockProvider** — built first; fast, testable without Ollama. Also the **automatic fallback**
  when the active provider doesn't respond, and the safety net so an evaluator with no GPU can run
  everything in mock mode.
- **OllamaProvider** — runs against `gemma:2b` (the default local model).

A cloud provider was considered and **dropped from scope** (privacy by design: child data never
leaves the machine). See ADR 0002.

## Git workflow (established, follow it)

Git Flow is initialized: `main` (production) + `develop` (development). Branch from `develop`:

```bash
git flow feature start <id>-<descripcion-kebab-case>
git flow feature finish <id>-<descripcion-kebab-case>
```

**Regla de base (enforced): toda feature/worktree parte de `develop`.** Antes de abrir una feature o
crear un worktree, sitúate en `develop` limpio — **nunca** ramifiques desde otra rama de feature
(arrastra estado equivocado y provoca conflictos). `git flow feature start` ya ramifica de `develop`,
pero el working tree no: parte limpio.

**Regla de paralelismo (enforced): trabajo en paralelo → un worktree por feature.** Un repo tiene un
solo working tree; varias tareas a la vez sobre el mismo directorio se pisan al hacer checkout (ver
[Docs/lecciones-aprendidas.md](Docs/lecciones-aprendidas.md): "el working tree se revierte al
cambiar"). Para trabajar en varias features a la vez, **un git worktree por feature**, creado desde
`develop`: `git worktree add -b feature/<id>-<slug> develop .claude/worktrees/<slug>` (y subagentes
en paralelo con `isolation: "worktree"`). **Siempre que al trabajar en paralelo aparezcan conflictos
de rama por compartir el working tree, crea un worktree por rama** en vez de seguir en el mismo
directorio. La config `.claude/settings.json` fija `worktree.baseRef: "head"` para que el worktree
integrado de Claude Code salga del HEAD (develop) y no de `origin/main`.

**Regla de seguridad (enforced): no finalizar una feature sin confirmación.** Nunca ejecutes
`git flow feature finish` (ni mergees una rama de feature a `develop`/`main`) sin **confirmación
explícita del usuario** en ese momento. Completa el resto del cierre (gate verde, versión,
CHANGELOG, docs, commits) y **detente antes** del `finish`; pregunta y espera el "sí".

Use `git flow` directly. The plugin **`gitflow-es`** (skills `gitflow-es:git` para el ciclo de
ramas/operaciones y `gitflow-es:commit` para los mensajes) cubre el flujo completo — úsalo para
cualquier operación de ramas o commits.

Commit messages follow **Conventional Commits in Spanish**, imperative mood, ≤72-char subject:
`tipo(alcance): descripción` with types `feat|fix|refactor|docs|style|test|chore|perf|ci`.
Stage selectively (`git add <file>`), never `git add -A`.

**Quédate dentro del alcance de la rama (enforced).** Antes de modificar o crear un archivo que
**no** esté en el plan de la feature (`Docs/planes/`) o que **no** corresponda a la intención de la
rama actual, **pregunta** si conviene abrir otra rama siguiendo Git Flow (feature / hotfix según el
caso) en lugar de mezclar el cambio aquí. No mezcles trabajo no relacionado en una rama de feature:
un cambio fuera de alcance va en su propia rama desde `develop` (usa la skill **abrir-feature**), o
se difiere. Si el usuario confirma que va aquí, adelante; si no, créalo en su rama.

The local commit identity is set to the personal GitHub account `Mithor86-2` (not the global
work identity) — preserve this; do not reset `git config --local user.*`.

## Versionado y changelog (enforced)

El **cierre de una feature** lo orquesta paso a paso la skill **`cerrar-feature`** — úsala, no
repitas el procedimiento a mano. Cubre, en el mismo cierre (no se difiere): poner al día la
documentación afectada (tracking docs, README, API, etc.), subir `version` por
[SemVer](https://semver.org/lang/es/) en los `package.json` (raíz + paquete afectado), y mover el
`CHANGELOG.md` de cada paquete (formato [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/),
entradas en español) de `## [Unreleased]` a una sección versionada `## [x.y.z] - AAAA-MM-DD`.

Dos reglas que aplican **durante** el desarrollo, no solo al cerrar:

- **Modelo de datos ↔ esquema.** Siempre que cambie
  [packages/backend/prisma/schema.prisma](packages/backend/prisma/schema.prisma) (modelo, campo,
  relación, índice o `@@map`), actualiza en el **mismo cambio** [Docs/modelo-datos.md](Docs/modelo-datos.md):
  el bloque `mermaid erDiagram` (parte mecánica) y revisa si la parte conceptual (value-objects,
  vocabularios cerrados, cascadas, minimización) sigue siendo cierta. No se difiere.
- **Historias de usuario.** Al construir o cambiar funcionalidad, refleja el estado en
  [Docs/historias-usuario/](Docs/historias-usuario/README.md): ajusta la US-NN y sus criterios, y la
  tabla de trazabilidad del índice (fase y pantalla). Si no tiene historia, créala (ID + criterios
  Gherkin en la épica que corresponda) antes de darla por hecha — son la fuente de los tests del DoD.
