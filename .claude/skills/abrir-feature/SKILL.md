---
name: abrir-feature
description: Arranca una feature de magyblobApp — crea la rama con Git Flow desde develop, escribe/enlaza el plan en Docs/planes con estructura fases→tareas, vincula la historia de usuario (US-NN) y deja el CHANGELOG con su sección Unreleased lista. Úsala cuando el usuario pida iniciar/abrir una feature o empezar una fase. Es el extremo de apertura del ciclo que cierra `cerrar-feature`.
---

# Abrir feature

Guía para **iniciar** una feature de **magyblobApp** dejando el andamiaje de seguimiento en su
sitio antes de escribir código. Es la simétrica de la skill `cerrar-feature`: aquí se prepara el
terreno (rama, plan, historia, changelog), allí se cierra (gate, versión, changelog fechado, merge).

Sigue las reglas _enforced_ del [CLAUDE.md](../../../CLAUDE.md): regla de planes, historias de
usuario, Git workflow y changelog. Ejecuta los pasos **en orden**.

## 1. Encuadra la feature

Antes de tocar nada, ten claro:

- **Qué fase** del [plan maestro](../../../Docs/plan-ejecucion-master.md) cubre y qué trozo de esa fase.
- **Qué historia(s) de usuario** la justifican. Revisa [Docs/historias-usuario/](../../../Docs/historias-usuario/README.md):
  - Si ya existe la US-NN, anótala para enlazarla.
  - Si **no existe**, créala (con sus criterios en Gherkin en el documento de la épica que toque, o
    una épica nueva) **antes** de empezar — los criterios son la fuente de los tests del DoD.
- **Identificador y slug** de la feature: `<id>-<descripcion-kebab-case>` (p. ej. `5-actividades`).

## 2. Crea la rama con Git Flow

Desde `develop` (consulta la skill **git-flow** para el detalle; el wrapper `gflow` **no** existe en
este repo — usa `git flow` directamente):

```bash
git flow feature start <id>-<descripcion-kebab-case>
```

No resetees la identidad local de commit (cuenta personal `Mithor86-2`).

## 3. Escribe el plan en Docs/planes

**Regla de planes (enforced): todo plan vive como documento, no solo en el chat.** Crea
`Docs/planes/<nombre>.md` (un fichero por fase; si la fase ya tiene su `fase-N.md`, añade la
descomposición de la feature dentro, no crees uno paralelo).

El plan se estructura en **fases → tareas** y debe permitir seguir su estado. Estructura mínima:

```markdown
# Plan — <Feature / Fase N>: <título>

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Qué existe ya (✅) y qué falta (❌). Decisiones tomadas con el usuario y su porqué.

## Historias cubiertas

- US-NN — <título> ([épica](../historias-usuario/<epica>.md))

## Tareas

- [ ] ❌ Tarea 1 …
- [ ] ❌ Tarea 2 …
- [ ] ❌ Tests (uno por caso de uso / endpoint / gateway)
- [ ] ❌ Docs + cierre con `cerrar-feature`
```

Marca el estado de cada tarea y **mantenlo al día** según avanzas: `❌` pendiente · `🔄` en curso ·
`✅` hecha (o checkboxes `[ ]`/`[x]`). Este documento es el que se consulta al retomar la sesión.

## 4. Deja el CHANGELOG preparado

En cada paquete que vaya a tocar la feature (`packages/backend/CHANGELOG.md`,
`packages/app/CHANGELOG.md`), asegúrate de que existe una sección `## [Unreleased]` con los seis
grupos de [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/) (`Added`, `Changed`,
`Deprecated`, `Removed`, `Fixed`, `Security`). Anota ahí las entradas a medida que implementas; el
movimiento a versión fechada lo hace `cerrar-feature`.

## 5. Primer commit de andamiaje (opcional)

Si el plan/historia son entregable propio, commitéalos en Conventional Commits (español), staging
selectivo (`git add <file>`, **nunca** `git add -A`):

```
docs(planes): plan de la feature <id> y vinculación de historias
```

## Checklist de apertura

- [ ] Fase y trozo del plan maestro identificados.
- [ ] Historia(s) de usuario existentes enlazadas, o creadas con criterios Gherkin.
- [ ] Rama `feature/<id>-<desc>` creada desde `develop` con Git Flow.
- [ ] Plan en `Docs/planes/` con estructura fases→tareas y marcas de estado.
- [ ] `## [Unreleased]` presente en el/los CHANGELOG de los paquetes afectados.

Cuando la feature esté terminada, ciérrala con la skill **cerrar-feature**.
