# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a **greenfield repository** — at the time of writing it contains only documentation,
no application code yet. The authoritative plan lives in
[Docs/plan-ejecucion-master.md](Docs/plan-ejecucion-master.md) and **must be consulted before
building anything**. It defines the architecture, the phase order, and the gate (Definition of
Done) that closes each phase. When you add code, update this file to replace the planned commands
below with the real ones.

It is the codebase for a Máster (TFM) project: a bilingual children's app that creates a child
profile and generates stories / recommends activities using a local LLM.

## Working strategy (non-obvious, enforced)

- **Vertical slice first.** Get one end-to-end flow working (create profile → generate story)
  before widening scope. Everything after Phase 4 is *widening*, not *rebuilding*.
- **One session per phase.** Work only the current phase and stop at its Definition of Done
  before moving on. Do not pull work forward from later phases.
- **YAGNI over completeness.** The plan repeatedly favors less abstraction where it doesn't pay
  off (e.g. value-objects only for `edad`/`idioma`; Chroma only if it earns its place — otherwise
  document why it was skipped). Prefer the simpler option and justify omissions in writing.

## Definition of Done (gates every phase)

No phase closes until **all** of these pass:

```bash
tsc --noEmit          # type-check clean
# ESLint + Prettier with no errors
# Vitest tests green
docker compose up     # whole stack comes up on a clean machine
```

`docker compose up` reproducibility is a hard requirement — clone → `docker compose up` → app
running, with no hidden steps. Local AI needs `ollama pull gemma:2b` (document it in startup).

> These commands are the project's intended tooling per the plan; wire up the actual scripts as
> Phase 0 lands, then make this section concrete (test runner invocation, single-test command, etc.).

## Planned architecture

Clean Architecture in a **monorepo** (pnpm workspaces or turborepo) with `backend` and `app`
packages. Stack per the plan: PostgreSQL 16, Chroma (vector DB, conditional), Ollama (local LLM),
Expo + Zustand (mobile app), Prisma (or chosen ORM), pino (structured logs).

Layering (dependencies point inward — `/domain` has **zero external dependencies**):

- **`/domain`** — pure business logic: entities (`ChildProfile`, `Story`, `Activity`),
  value-objects, and repository *interfaces*. No frameworks, no IO.
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
