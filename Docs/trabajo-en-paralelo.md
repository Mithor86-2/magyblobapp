# Trabajo en paralelo sin conflictos

Protocolo único para trabajar en **varias features a la vez** (varias sesiones / subagentes de
Claude) sin que el merge a `develop` genere conflictos manuales. Resuelve los tres focos de fricción
documentados en [lecciones-aprendidas.md](lecciones-aprendidas.md) (Lecciones A y D).

## Regla de oro: aislar y commitear pronto

- **Un worktree por feature**, creado desde `develop` limpio. Un repo tiene un solo working tree;
  varias tareas sobre el mismo directorio se pisan al hacer checkout (los cambios sin commitear de
  una rama no viajan con el `checkout` de otra y **se pierden**). Ver la "Regla de paralelismo" del
  [CLAUDE.md](../CLAUDE.md).

  ```bash
  git worktree add -b feature/<id>-<slug> develop .claude/worktrees/<slug>
  ```

  Subagentes en paralelo: `isolation: "worktree"`.

- **Commitea pronto y a menudo** en la rama de la feature: los commits sobreviven a un cambio de
  rama; el working tree no.

## Versionado diferido (evita el conflicto de versión)

El número de versión es un **recurso compartido**. Por eso **la rama de feature no toca `version`**
(`package.json` raíz, `packages/*`, `app.json`): solo acumula entradas bajo `## [Unreleased]`. La
versión y la sección fechada del CHANGELOG se asignan **al integrar en `develop`** (post-merge),
donde la operación queda serializada y dos features dejan de elegir el mismo `x.y.z` a ciegas.

El detalle (criterio SemVer, mecánica Keep a Changelog, paso "Versiona al integrar") vive en la skill
[`versionar`](../.claude/skills/versionar/) — este doc no lo duplica.

## Recetas de conflicto al integrar

| Archivo                               | Cómo se resuelve                                                                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHANGELOG.md` (raíz / `packages/*`)  | `merge=union` en [.gitattributes](../.gitattributes) fusiona ambos lados sin marcadores. Revisa que no queden bullets duplicados ni grupos repetidos. |
| `pnpm-lock.yaml`                      | **No** se edita a mano: `pnpm install` (pnpm reconcilia el lockfile) y `git add pnpm-lock.yaml`.                                                      |
| `package.json` / `app.json` (versión) | Con versionado diferido ya **no debería** chocar. Si choca por histórico, toma la siguiente versión libre en `develop`.                               |

**Escalado opcional** (solo si el paralelismo se vuelve intenso): la opción `git-branch-lockfiles` de
pnpm crea un lockfile por rama y evita el conflicto del lockfile por completo
(`pnpm install --merge-git-branch-lockfiles` consolida en `develop`). No se activa por defecto porque
añade ruido al flujo de una sola rama.

## Otros gotchas

- **ESLint y los worktrees:** el worktree integrado vive físicamente dentro del repo, así que las
  herramientas que recorren el filesystem deben ignorar `.claude/worktrees/`. Ya está cubierto
  (`.claude/**` en `eslint.config.mjs`; `.claude/worktrees/` en `.gitignore`).
- **Rutas con espacios rompen los worktrees** (`Master IA` vs `Master-IA`). Si `git worktree list`
  marca una entrada `prunable`, repárala con `git worktree repair "<ruta-correcta>"`.
