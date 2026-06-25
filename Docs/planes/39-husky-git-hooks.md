# Plan — Feature 39: Git hooks de calidad con Husky + lint-staged

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

- ✅ Existe un gate canónico de la Definition of Done: `pnpm check` =
  `typecheck && lint && format:check && test` (raíz [../../package.json](../../package.json)).
- ✅ Integración de persistencia (`test:integration`) y E2E (`test:e2e`) **corren aparte** (requieren
  Docker) y **siempre en CI** — ver [../estrategia-pruebas.md](../estrategia-pruebas.md). No entran en
  el gate local rápido.
- ✅ ESLint 9 (flat config) ignora la app (`packages/app`) y los ficheros de config; el lint raíz solo
  analiza el backend (`eslint .`). La app no tiene `lint` propio en el gate.
- ❌ No hay **Git hooks**: la regla "verifica el gate antes de pedir commit/cierre" es hoy disciplina
  **manual**. Nada impide commitear/pushear con el gate en rojo.

**Decisión (con el usuario):** automatizar el gate con [Husky](https://typicode.github.io/husky/) v9
y [lint-staged](https://github.com/lint-staged/lint-staged), con la arquitectura de gates "rápido en
commit / completo en push":

- **`pre-commit` (segundos):** `lint-staged` sobre los archivos _staged_ (autofix de ESLint en
  backend + Prettier). Rápido, arregla solo lo tocado, no recorre todo el monorepo.
- **`pre-push` (el gate completo):** `pnpm check` (typecheck + lint + format:check + test). Si el
  gate está en rojo, **aborta el push**.
- **Integración y E2E NO van en hooks** — requieren Docker y se quedan en CI (coherente con
  [../estrategia-pruebas.md](../estrategia-pruebas.md) y US-32).

**Por qué se descartó la propuesta inicial (correcciones aplicadas):**

- `pnpm build` en pre-commit → **sustituido por `typecheck`**: el gate del proyecto usa `tsc --noEmit`,
  no `build` (que solo aplica al backend, escribe en `dist/` y copia Prisma).
- `test:e2e`/`test:coverage` en pre-push → **fuera**: E2E requiere Docker/Playwright; coverage requiere
  Docker y duplica los tests. Ambos viven en CI. El pre-push ejecuta el gate canónico `pnpm check`.
- Faltaba `format:check` → cubierto: Prettier entra vía `lint-staged` (commit) y `pnpm check` (push).
- `#!/usr/bin/env sh` + `chmod +x` → **innecesarios en Husky v9.1+** (el shebang/sourcing se eliminó y
  `husky init` deja los hooks listos); incluirlos emite _deprecation warning_.

**Notas técnicas (doc oficial Husky v9.1.7 + lint-staged):**

- Instalación: `pnpm add -D -w husky` → `pnpm exec husky init` (crea `.husky/`, el `prepare: "husky"`
  en el `package.json` raíz y `.husky/pre-commit` de ejemplo). El `prepare` reactiva los hooks tras
  cada `pnpm install` (se comparten al clonar).
- Hook v9 = **solo los comandos** (sin shebang ni `. "$(dirname …)/_/husky.sh"`).
- Saltar puntualmente: `git commit/push --no-verify` (uso excepcional, no por defecto).
- **lint-staged + ESLint flat config:** ESLint 9 **falla** si recibe un fichero que su `ignores`
  excluye (p. ej. `packages/app/**`) salvo `--no-warn-ignored`. Por eso se **acota ESLint al backend**
  y Prettier a todo. Glob propuesto:
  - `packages/backend/**/*.ts` → `eslint --fix`, `prettier --write`
  - `*.{ts,tsx,js,mjs,json,md,yml,yaml}` (y app) → `prettier --write`

**Cumplimiento de menores:** `husky` y `lint-staged` son **devDependencies**; sin runtime, sin red,
sin SDKs de terceros (coherente con [../cumplimiento-menores.md](../cumplimiento-menores.md), igual que
SonarJS/coverage).

## Historias cubiertas

- US-36 — Git hooks de calidad (Husky + lint-staged) ([épica F](../historias-usuario/epic-f-plataforma.md#us-36))

## Tareas

- [x] ✅ **T1 · Instalar dependencias.** `husky@^9.1.7` y `lint-staged@^17` como `devDependency` raíz
      (`pnpm add -D -w`); `pnpm exec husky init` (crea `.husky/`, `core.hooksPath=.husky/_` y `prepare`).
- [x] ✅ **T2 · Configurar `prepare`.** `"prepare": "husky"` presente en
      [../../package.json](../../package.json) raíz (lo añadió `husky init`).
- [x] ✅ **T3 · Hook `pre-commit`.** `.husky/pre-commit` → `pnpm exec lint-staged` (sin shebang).
- [x] ✅ **T4 · Config `lint-staged`.** Bloque en el `package.json` raíz: `eslint --fix --no-warn-ignored` + Prettier en `packages/backend/**/*.ts`, Prettier en `packages/app/**/*.{ts,tsx}` y en
      `*.{js,mjs,cjs,json,md,yml,yaml}`. El `--no-warn-ignored` evita que un fichero ignorado por ESLint
      rompa el hook.
- [x] ✅ **T5 · Hook `pre-push`.** `.husky/pre-push` → `pnpm check` con mensaje y `exit 1` si falla.
- [x] ✅ **T6 · Verificar.** Commit limpio → `lint-staged` corre y pasa. Fichero con error de lint
      (`no-unused-vars`) → el commit **se bloquea** (`pre-commit script failed code 1`); `--no-verify`
      lo salta. `pre-push` ejecuta `pnpm check` → **verde** (backend 139 + app 41 tests). Sin warnings
      de deprecación de Husky.
- [x] ✅ **T7 · Docs.** Sección "Git hooks locales (Husky)" en
      [../estrategia-pruebas.md](../estrategia-pruebas.md) y entrada `## [Unreleased] → Added` en
      [../../packages/backend/CHANGELOG.md](../../packages/backend/CHANGELOG.md). Pendiente: cierre con
      la skill **cerrar-feature** (versión SemVer, changelog fechado, pruebas al usuario, Git Flow finish).

## Verificación / DoD

- `git commit` dispara `lint-staged` y formatea/lintea solo lo _staged_ (segundos).
- `git push` ejecuta `pnpm check`; con el gate en rojo, **el push se aborta** (`exit ≠ 0`).
- Integración/E2E **no** se ejecutan en hooks (siguen en CI).
- Husky v9 sin _deprecation warnings_ (hooks sin shebang/chmod).
- Sin dependencias de runtime nuevas (solo `devDependencies`); cumplimiento de menores intacto.
- `pnpm check` verde tras los cambios de tooling.

## Notas de proceso

- Feature **transversal** (toca `package.json` raíz + `.husky/`): se desarrolla en el worktree
  `.claude/worktrees/husky-git-hooks` (rama `feature/39-husky-git-hooks`, creada desde `develop`),
  para no mezclarse con `feature/35-strategic-coverage` ni con los worktrees 37/38 en curso.
- Cierre con **cerrar-feature** (gate verde → versión SemVer → CHANGELOG fechado → pruebas al usuario
  → confirmación → `git flow feature finish`).
