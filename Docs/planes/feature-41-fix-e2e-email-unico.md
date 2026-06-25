# Plan — Feature 41: fix E2E web (email único por test)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** del arreglo.

## Contexto

Al combinar **US-37** (E2E multinavegador: 3 `projects`) con **US-39** (specs de actividades e
historial), el E2E web empezó a fallar:

- ✅ El backend E2E levanta un **Postgres efímero** que persiste estado durante **toda la corrida**
  (no se resetea entre tests ni entre navegadores).
- ❌ Los specs (`onboarding.spec.ts` y `actividades-historial.spec.ts`) reutilizaban un **email fijo**
  para el alta del adulto. Al repetirse el alta (N tests × M navegadores) fallaba con "email ya
  registrado" y el onboarding no avanzaba → timeout esperando "Crear nuevo perfil".

Antes no se veía porque el E2E corría en **un** solo navegador.

## Historias cubiertas

- Arreglo de **US-37** y **US-39** (no introduce historia nueva; corrige las existentes).

## Tareas

- [x] ✅ Helper `packages/app/e2e/_correo.ts` → email único por test (`project` + título).
- [x] ✅ `onboarding.spec.ts` usa `correoUnico(testInfo)`.
- [x] ✅ `actividades-historial.spec.ts`: `completarOnboarding(page, correo)` con email por test.
- [x] ✅ Versión patch (app 0.14.1, raíz 0.21.1) + CHANGELOG `Fixed`.
- [x] ✅ Lección aprendida documentada.
- [ ] ❌ Validación E2E real con Docker (`pnpm --filter @magyblob/app test:e2e`) — la corre el usuario.
- [ ] ❌ Cierre con `cerrar-feature` (merge a develop) tras confirmación.
