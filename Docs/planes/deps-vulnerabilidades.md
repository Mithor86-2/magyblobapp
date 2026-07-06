# Plan — Fix: vulnerabilidades de dependencias (Dependabot)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Cierra el ítem de seguridad del backlog de CI/CD
> ([../mejoras-cicd-pendientes.md](../mejoras-cicd-pendientes.md) §1, `pnpm audit`).

## Contexto

Tras el push a `develop`, GitHub/Dependabot reportó **7 vulnerabilidades** (1 high · 5 moderate ·
1 low). Análisis con `pnpm audit`: **todas son dependencias transitivas de dev/build/test**, sin
exposición en el runtime de producción (el backend corre en Docker/Linux con Fastify; la app es
React Native y no sirve un dev server web en producción).

| Sev      | Paquete             | Cadena (vía)                                          | Parche        |
| -------- | ------------------- | ----------------------------------------------------- | ------------- |
| high     | `vite`              | app › @vitest/coverage-v8 › vitest › vite             | `≥6.4.3`      |
| moderate | `vite`              | ídem (path traversal optimized deps)                  | `≥6.4.2`      |
| moderate | `launch-editor`     | vía vite (dev server)                                 | vite `≥6.4.3` |
| moderate | `esbuild`           | app › vitest › esbuild                                | `≥0.24.3`     |
| low      | `esbuild`           | backend › tsx › esbuild                               | `≥0.28.1`     |
| moderate | `@hono/node-server` | backend › prisma (CLI) › @prisma/dev                  | `≥1.19.13`    |
| moderate | `uuid`              | app › @sentry/react-native › expo › @expo/cli › xcode | `≥11.1.1`     |

**Decisión con el usuario:** corregir con `overrides` en `pnpm-workspace.yaml` (pnpm 11 ya **no** lee
el campo `pnpm` del `package.json`), forzando las versiones parcheadas de los transitivos. **`uuid` se
excluye**: forzar v11 bajo un `xcode` que espera la API de `uuid` v3 tiene riesgo real de romper el
prebuild nativo/EAS; se acepta el riesgo (es tooling de build, moderate, Windows/uso concreto) y se
deja anotado.

Cobertura de los overrides (versiones resueltas tras `pnpm install`):

- `esbuild@<0.28.1 → >=0.28.1` (resuelto **0.28.1**) → cubre las **dos** advisories de esbuild.
- `vite@<=6.4.2 → >=6.4.3` (resuelto **8.1.3**, deduplicado con vitest) → cubre la **high**, la
  path-traversal y la de `launch-editor`.
- `@hono/node-server@<1.19.13 → >=1.19.13` → cubre el bypass de serveStatic.

Resuelve **6 de 7** (todas menos `uuid`), incluida la única high. `pnpm audit` final: 1 moderate
(`uuid`).

## Historias cubiertas

- Sin US: es endurecimiento de seguridad/CI (no funcionalidad de usuario). Traza al backlog de
  CI/CD ([../mejoras-cicd-pendientes.md](../mejoras-cicd-pendientes.md) §1).

## Tareas

- [x] ✅ Añadir `overrides` a `pnpm-workspace.yaml` (vite, esbuild, @hono/node-server).
- [x] ✅ `pnpm install` para regenerar `pnpm-lock.yaml` con las versiones forzadas.
- [x] ✅ Verificar con `pnpm audit`: 0 high, solo queda `uuid` (moderate) documentada.
- [x] ✅ Anotar entrada `Security` en los CHANGELOG de backend y app (`## [Unreleased]`).
- [x] ✅ Marcar `uuid` como riesgo aceptado / pendiente en `mejoras-cicd-pendientes.md`.
- [x] ✅ Gate verde (`pnpm check`, exit 0). Pendiente: cierre con `cerrar-feature` (confirmación).
