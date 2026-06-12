---
name: cerrar-feature
description: Cierra una feature aplicando la Definition of Done del proyecto — gate verde (pnpm check), versionado SemVer, CHANGELOG por paquete (Keep a Changelog), actualización de docs y cierre con Git Flow. Úsala cuando el usuario pida cerrar/finalizar una feature, hacer el cierre de fase o preparar el merge a develop.
---

# Cerrar feature

Guía para finalizar una feature de **magyblobApp** sin saltarse ningún paso del cierre.
Sigue las reglas _enforced_ del [CLAUDE.md](../../../CLAUDE.md): Definition of Done, versionado
y changelog, actualización de documentación, y Git workflow.

Ejecuta los pasos **en orden**. No avances al siguiente si el actual no está verde.

## 1. Verifica el gate (Definition of Done)

Desde la raíz del repo:

```bash
pnpm check            # typecheck + lint + format:check + test (todo el gate)
```

- Si falla **lint**, recuerda: si el lint bloquea un import entre capas, **el diseño está mal, no el
  lint** — mueve la dependencia, no desactives la regla.
- Si falla **format**, corrige con `pnpm format` (no edites a mano).
- Si fallan **tests**, arréglalos antes de continuar. Cada caso de uso y cada endpoint debe tener su
  test co-localizado.

No cierres la feature hasta que `pnpm check` pase entero. Si la feature toca el arranque, valida
también que `docker compose up` levanta la pila en limpio (requisito duro de reproducibilidad).

## 2. Actualiza la documentación

Antes de versionar, pon al día **toda** la documentación que el cambio deje desfasada:

- **Tracking docs vivos** (obligatorio en cada cierre):
  - [Docs/phases.md](../../../Docs/phases.md) — marca la fase como avanzada/cerrada con su DoD.
  - [Docs/memory.md](../../../Docs/memory.md) — decisiones tomadas y su porqué.
  - [Docs/lecciones-aprendidas.md](../../../Docs/lecciones-aprendidas.md) — gotchas concretos y cómo se resolvieron.
- **README** (raíz y/o del paquete afectado) si cambian comandos, arranque o uso.
- **Docs/api.md** si cambian endpoints, parámetros o el contrato HTTP.
- **Docs/modelo-datos.md** si la feature tocó `packages/backend/prisma/schema.prisma` (modelo, campo,
  relación, índice o `@@map`): actualiza el bloque `mermaid erDiagram` y revisa la parte conceptual
  (vocabularios, value-objects, cascadas, minimización).
- Cualquier ADR, historia de usuario o doc de cumplimiento afectado.

Todo en **español** (lenguaje ubicuo del proyecto).

## 3. Sube la versión (SemVer)

Actualiza el campo `version`:

- Raíz: [package.json](../../../package.json).
- Paquete(s) afectado(s): `packages/backend/package.json` y/o `packages/app/package.json`.

Criterio SemVer:

- `patch` (x.y.**z**) — correcciones retrocompatibles.
- `minor` (x.**y**.0) — funcionalidad nueva retrocompatible (lo habitual al cerrar una feature).
- `major` (**x**.0.0) — cambios incompatibles.

El bump va en el **mismo cierre**, no se difiere.

## 4. Mueve el CHANGELOG

Por cada paquete con cambios, edita su `CHANGELOG.md`
(`packages/backend/CHANGELOG.md`, `packages/app/CHANGELOG.md`) siguiendo
[Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/):

1. Lo que esté en `## [Unreleased]` (agrupado en `Added`, `Changed`, `Deprecated`, `Removed`,
   `Fixed`, `Security`) se mueve a una nueva sección versionada:

   ```markdown
   ## [x.y.z] - AAAA-MM-DD
   ```

   Usa la fecha de hoy en formato `AAAA-MM-DD`.

2. Deja un `## [Unreleased]` vacío con los seis grupos para la próxima feature.
3. Las entradas se redactan en español.

> Si tienes acceso a la fecha actual del entorno, úsala. Si no, pregúntala al usuario antes de
> escribir la fecha; no la inventes.

## 5. Commit y cierre con Git Flow

Stagea selectivamente (`git add <file>`, **nunca** `git add -A`). Mensaje en
**Conventional Commits en español**, imperativo, ≤72 chars en el asunto:

```
tipo(alcance): descripción
```

Tipos: `feat|fix|refactor|docs|style|test|chore|perf|ci`.

**Regla de seguridad (enforced): pruebas con el usuario.** Cuando la fase/feature lo amerite, antes
de finalizar **solicita las pruebas al usuario**: que las realice **manualmente** (dale pasos o
comandos concretos) o **ofrécele/genera una verificación automatizada**. No cierres sin ese paso.

**Regla de seguridad (enforced): pide confirmación antes de finalizar.** No ejecutes
`git flow feature finish` (ni el merge a `develop`/`main`) sin **confirmación explícita del
usuario**. Haz todo lo anterior (gate, versión, CHANGELOG, docs, commits, pruebas) y **detente
aquí**: pregunta y espera el "sí" antes de cerrar la rama.

Tras la confirmación, cierra la rama con Git Flow usando `git flow` directamente. La skill
**`gitflow-es:git`** del plugin cubre el detalle del flujo:

```bash
git flow feature finish <id>-<descripcion-kebab-case>
```

Recuerda: la identidad local de commit es la cuenta personal `Mithor86-2` — **no** la resetees.

## Checklist final

- [ ] `pnpm check` verde.
- [ ] (si aplica) `docker compose up` levanta la pila en limpio.
- [ ] phases.md / memory.md / lecciones-aprendidas.md actualizados.
- [ ] README / api.md / docs afectadas actualizados.
- [ ] Si la feature tocó `schema.prisma`, `modelo-datos.md` sincronizado (diagrama + parte conceptual).
- [ ] `version` subida en package.json(s) según SemVer.
- [ ] CHANGELOG movido de Unreleased a versión fechada (por paquete).
- [ ] Commit(s) en Conventional Commits (español) + rama cerrada con Git Flow.
