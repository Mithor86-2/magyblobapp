# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Phase 0 (andamiaje) is closed.** The monorepo scaffolding is in place: pnpm workspaces
(`packages/backend`, `packages/app`), a Fastify backend with a `/health` route, ESLint + Prettier +
Vitest wired up, and a `docker compose up` that brings the full stack (backend + PostgreSQL 16 +
Chroma + Ollama) up on a clean machine. No domain/application code yet — that is Phase 1.

The authoritative plan lives in [Docs/plan-ejecucion-master.md](Docs/plan-ejecucion-master.md) and
**must be consulted before building anything**. It defines the architecture, the phase order, and
the gate (Definition of Done) that closes each phase.

It is the codebase for a Máster (TFM) project: a bilingual children's app that creates a child
profile and generates stories / recommends activities using a local LLM.

## Working strategy (non-obvious, enforced)

- **Vertical slice first.** Get one end-to-end flow working (create profile → generate story)
  before widening scope. Everything after Phase 4 is _widening_, not _rebuilding_.
- **One session per phase.** Work only the current phase and stop at its Definition of Done
  before moving on. Do not pull work forward from later phases.
- **YAGNI over completeness.** The plan repeatedly favors less abstraction where it doesn't pay
  off (e.g. value-objects only for `edad`/`idioma`; Chroma only if it earns its place — otherwise
  document why it was skipped). Prefer the simpler option and justify omissions in writing.

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

`docker compose up` reproducibility is a hard requirement — clone → `cp .env.example .env` →
`docker compose up` → backend on <http://localhost:3000/health>, with no hidden steps. The default
`AI_PROVIDER=mock` means it runs with no GPU/model. For real local AI, run `pnpm ollama:setup`
(pulls `gemma:2b` into the Ollama container).

## Planned architecture

Clean Architecture in a **monorepo** (pnpm workspaces or turborepo) with `backend` and `app`
packages. Stack per the plan: PostgreSQL 16, Chroma (vector DB, conditional), Ollama (local LLM),
Expo + Zustand (mobile app), Prisma (or chosen ORM), pino (structured logs).

Layering (dependencies point inward — `/domain` has **zero external dependencies**):

- **`/domain`** — pure business logic: entities (`ChildProfile`, `Story`, `Activity`),
  value-objects, and repository _interfaces_. No frameworks, no IO.
- **Application** — use cases (`CreateChildProfile`, `RecommendActivities`, `SaveProgress`,
  `GetHistory`), each with its own test, plus input/output DTOs.
- **Infrastructure** — PostgreSQL repos implementing the domain interfaces, HTTP controllers/routes,
  centralized error handling, migrations + seeds.

### The AI layer is the core of the project

A single `AIProvider` interface (`generateStory`, `recommendActivities`) with **three swappable
modes** selected by env var (`mock | local | cloud`):

- **MockProvider** — built first; fast, testable without Ollama. Also the **automatic fallback**
  when the active provider doesn't respond, and the safety net so an evaluator with no GPU can run
  everything in mock mode.
- **OllamaProvider** — runs against `gemma:2b` (the default local model).
- **CloudProvider** — optional, one only (Claude or OpenAI), active only if an API key is present.

When working on AI features, default to the latest Claude models for any cloud path
(see the claude-api skill for current model IDs).

## Git workflow (established, follow it)

Git Flow is initialized: `main` (production) + `develop` (development). Branch from `develop`:

```bash
git flow feature start <id>-<descripcion-kebab-case>
git flow feature finish <id>-<descripcion-kebab-case>
```

The `gflow` wrapper is **not** available in this repo (it expects `scripts/flow.sh`, which was
intentionally not added) — use `git flow` directly. See the **git-flow** skill for the full flow.

Commit messages follow **Conventional Commits in Spanish**, imperative mood, ≤72-char subject:
`tipo(alcance): descripción` with types `feat|fix|refactor|docs|style|test|chore|perf|ci`.
Stage selectively (`git add <file>`), never `git add -A`.

The local commit identity is set to the personal GitHub account `Mithor86-2` (not the global
work identity) — preserve this; do not reset `git config --local user.*`.
