# Plan — Feature 49: flujo de trabajo en paralelo sin conflictos

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

El trabajo en paralelo con Claude (varias sesiones / subagentes) genera conflictos **al mergear a
`develop`**, no durante el trabajo aislado (el aislamiento ya está resuelto: worktree por feature,
`worktree.baseRef: "head"`, ESLint ignora `.claude/**`). Los tres conflictos recurrentes (ver
[../lecciones-aprendidas.md](../lecciones-aprendidas.md), Lecciones A y D):

- ✅ Aislamiento durante el trabajo (worktrees) — ya resuelto.
- ❌ Colisión de versión + CHANGELOG: ambas features eligen el mismo `x.y.z` al empezar el cierre.
- ❌ `pnpm-lock.yaml`: conflictos difíciles al regenerarse.
- ❌ Cambios sin commit perdidos al cambiar de rama (solo sin worktree).

**Decisiones tomadas con el usuario:**

1. Diferir la versión: se asigna **al integrar en `develop`** (no al abrir/cerrar la feature). Como
   `develop` es lineal, los cierres se serializan → desaparece la colisión de versión.
2. Toda la **política de versionado vive en una skill propia (`versionar`)**, fuente única;
   `CLAUDE.md` y `cerrar-feature` la **referencian**, no la duplican.

Feature de tooling/proceso (devex). **Sin US** (no toca funcionalidad de producto).

## Historias cubiertas

- Ninguna (cambio de proceso/devex; no aplica historia de usuario).

## Tareas

- [x] ✅ `.gitattributes` con `merge=union` para los CHANGELOG (raíz + `packages/*`).
- [x] ✅ Skill `versionar` — fuente única del versionado diferido + CHANGELOG + recetas de conflicto.
- [x] ✅ `cerrar-feature`: delegar versionado/CHANGELOG en `versionar` (quitar pasos embebidos).
- [x] ✅ `CLAUDE.md`: referenciar `versionar` (sección versionado), añadir skill al índice, enlazar
      doc de paralelismo y `.gitattributes` en Git workflow.
- [x] ✅ `Docs/trabajo-en-paralelo.md` — protocolo único (worktrees, commit-pronto, recetas de merge).
- [x] ✅ Registrar decisión en `memory.md` y `lecciones-aprendidas.md`.
- [x] ✅ Verificar que `abrir-feature` no pre-asigna versión (solo deja `## [Unreleased]`; OK).
- [x] ✅ Verificación: union CHANGELOG (probado con dos ramas → merge sin conflicto, ambos bullets),
      `git check-attr` confirma union, gate `pnpm check` verde (exit 0).
- [ ] ❌ Docs + cierre con `cerrar-feature` (pendiente confirmación del usuario).
