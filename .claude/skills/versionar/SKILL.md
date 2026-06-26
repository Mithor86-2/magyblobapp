---
name: versionar
description: Fuente única del versionado de magyblobApp — política de versionado diferido (la versión se asigna al integrar en develop, no en la rama de feature), criterio SemVer y mecánica del CHANGELOG (Keep a Changelog 1.1.0). Úsala al asignar la versión / mover el CHANGELOG al cerrar una integración, o invocada desde cerrar-feature. Incluye las recetas para resolver conflictos de versión, CHANGELOG y pnpm-lock al mergear en paralelo.
---

# Versionar

**Fuente única** de la política de versionado y CHANGELOG de **magyblobApp**. El [CLAUDE.md](../../../CLAUDE.md)
y la skill [cerrar-feature](../cerrar-feature/SKILL.md) **referencian** esta skill, no la duplican:
si cambia la política de versionado, se cambia aquí.

## Principio: versionado diferido al merge

El número de versión es un **recurso compartido**. Si cada rama de feature lo reserva al empezar (o
al cerrar) su trabajo, dos features en paralelo eligen el mismo `x.y.z` a ciegas y **chocan** al
mergear (`package.json`, `packages/*/package.json`, `app.json`, `CHANGELOG.md`). Es la causa raíz de
la Lección D ([../../../Docs/lecciones-aprendidas.md](../../../Docs/lecciones-aprendidas.md)).

Por eso **la versión se asigna al integrar en `develop`, no en la rama de feature**:

- **En la rama de feature** (durante el desarrollo y al cerrar):
  - **NO toques `version`** en ningún `package.json` ni en `packages/app/app.json`.
  - Acumula las entradas del cambio bajo `## [Unreleased]` del CHANGELOG del paquete afectado,
    agrupadas en `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`.
  - **NO crees** la sección fechada `## [x.y.z]` ni muevas nada todavía.
- **En `develop`, después del merge** (paso "Versiona al integrar", abajo): ahí se elige el número,
  se bumpea y se fecha el CHANGELOG. Como `develop` es lineal, este paso queda **serializado** entre
  features → **sin colisión de versión**.

## Criterio SemVer

Sobre la versión actual en `develop` (mírala con `git fetch` antes de fijarla), elige la **siguiente
libre**:

- `patch` (x.y.**z**) — correcciones retrocompatibles.
- `minor` (x.**y**.0) — funcionalidad nueva retrocompatible (lo habitual al cerrar una feature).
- `major` (**x**.0.0) — cambios incompatibles.

Se versiona la **raíz** ([../../../package.json](../../../package.json)) y el/los paquete(s)
afectado(s) (`packages/backend/package.json`, `packages/app/package.json`, y `packages/app/app.json`
si la app cambió). Cada paquete lleva su propia línea SemVer.

## Mecánica del CHANGELOG (Keep a Changelog 1.1.0)

Por cada paquete con cambios, en su `CHANGELOG.md`:

1. Mueve lo acumulado en `## [Unreleased]` a una nueva sección versionada:

   ```markdown
   ## [x.y.z] - AAAA-MM-DD
   ```

   Usa la fecha de **hoy** del entorno en formato `AAAA-MM-DD`. Si no tienes acceso a la fecha,
   pregúntala al usuario; no la inventes.

2. Deja un `## [Unreleased]` vacío con los seis grupos para la próxima feature.
3. Entradas en **español** (lenguaje ubicuo del proyecto).

## Paso "Versiona al integrar" (en `develop`, post-merge)

Tras `git flow feature finish` (que mergea la feature a `develop`), y ya **situado en `develop`**:

```bash
git fetch origin develop          # ver qué entró en paralelo
# leer la `version` actual en package.json (raíz) y en el/los paquete(s) afectados
```

1. Elige la **siguiente** versión SemVer libre (minor por defecto al cerrar feature).
2. Bumpea `version` en la raíz + paquete(s) afectado(s) (`app.json` si la app cambió).
3. Mueve el `## [Unreleased]` a `## [x.y.z] - AAAA-MM-DD` y deja un `[Unreleased]` vacío.
4. Commit directo en `develop` y push:

   ```bash
   git add package.json packages/<pkg>/package.json packages/<pkg>/CHANGELOG.md
   git commit -m "chore(release): vX.Y.Z"
   git push origin develop
   ```

## Recetas de conflicto al integrar (trabajo en paralelo)

- **`CHANGELOG.md`** — lo resuelve `merge=union` ([../../../.gitattributes](../../../.gitattributes)):
  el merge conserva los bullets de ambos lados sin marcadores. Revisa que no quede algún bullet
  duplicado ni grupos repetidos; arregla a mano si hace falta.
- **`pnpm-lock.yaml`** — **no** se resuelve a mano. Ejecuta `pnpm install` (pnpm reconcilia el
  lockfile automáticamente) y commitea:

  ```bash
  pnpm install
  git add pnpm-lock.yaml
  ```

  Escalado opcional si el paralelismo se vuelve intenso: la opción `git-branch-lockfiles` de pnpm
  crea un lockfile por rama y evita el conflicto por completo
  (`pnpm install --merge-git-branch-lockfiles` para consolidar en `develop`). No está activada por
  defecto porque añade ruido al flujo de una sola rama.

- **`package.json` / `app.json` (versión)** — con versionado diferido ya **no debería** chocar (las
  features no tocan `version`). Si choca por histórico, toma la siguiente versión libre en `develop`.

## Checklist

- [ ] En la rama de feature **no** se modificó ningún `version`.
- [ ] Las entradas del cambio están bajo `## [Unreleased]` (agrupadas), sin sección fechada.
- [ ] Tras el merge, en `develop`: versión bumpeada (raíz + paquete(s)) y CHANGELOG fechado.
- [ ] Conflictos de CHANGELOG/lockfile resueltos con union / `pnpm install`.
