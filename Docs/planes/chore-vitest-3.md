# Plan — chore/vitest-3: migración Vitest 2 → 3 (seguridad de dependencias)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo**.

## Contexto

Al activar Dependabot (repo público) afloraron vulnerabilidades en el **tooling de test**
(dev-only). `pnpm audit` reportaba 7 avisos únicos (1 crítico, 1 alto, 4 moderados, 1 bajo), todos
en `devDependencies` o transitivos de ellas — **ninguno llega a producción**: el backend se empaqueta
con `pnpm deploy --prod` (sin devDeps) y el bundle de la app lo compila EAS/Metro.

El aviso **crítico** (vitest `<3.2.6`: lectura/ejecución de ficheros con el Vitest UI server activo)
encabezaba el chain. El proyecto estaba en `vitest ^2.1.8` (instalado 2.1.9). El parche exige el
**major 3.2.6+**. Ni siquiera era explotable aquí (no se usa `@vitest/ui`; los tests corren
`vitest run` headless), pero cerrar el major arrastra buena parte de los transitivos.

**Decisión (con el usuario):** migrar Vitest 2 → 3 en su propia rama (opción 1), validando el gate.
Guía de migración consultada (Context7 / docs Vitest): la única ruptura relevante —los thresholds
de coverage por glob dejan de heredar `perFile`— **no aplica** (no se fija `perFile` a nivel
superior), así que las configs no necesitaron cambios.

## Historias cubiertas

Sin US de producto: es un **chore de seguridad/tooling** que no altera comportamiento de la app.
Se relaciona con la cobertura estratégica (US-35) solo en que mantiene verde el gate y los umbrales.

## Tareas

- [x] ✅ Consultar cambios _breaking_ de Vitest 3 (thresholds por glob / `perFile`; reporters).
- [x] ✅ Bump `vitest` y `@vitest/coverage-v8` a `^3.2.6` en `packages/backend` y `packages/app`.
- [x] ✅ `pnpm install` (lockfile) — vitest resuelto 3.2.6 en ambos paquetes.
- [x] ✅ Gate verde: `pnpm check` (typecheck + lint + format + test) exit 0; **272 tests app** +
      backend en verde, sin tocar `vitest.config.ts`.
- [x] ✅ `pnpm coverage` exit 0 — umbrales por tier (CORE 100 / IMPORTANT 80) cumplidos.
- [x] ✅ Re-`audit`: **crítico cerrado**; 9→6 alertas Dependabot (todas dev/build-only).
- [x] ✅ Validar suites Docker en Vitest 3 (local, Docker): `test:integration` 30/30 y `test:e2e`
      backend 3/3 en verde. (Playwright no usa Vitest, no le afecta el bump.)
- [x] ✅ CHANGELOG (`Security`) en backend y app bajo `## [Unreleased]`.
- [ ] ❌ Cierre con `cerrar-feature` (versión + merge, previa confirmación del usuario).

## Residuos aceptados (no se fuerzan)

Quedan 6 avisos, **todos dev/build-time, ninguno en producción**, la mayoría _dev-server / solo
Windows_:

- **vite** (1 alto + 2 moderados) y **esbuild** (1 moderado + 1 bajo): los ancla vitest 3 (vite
  5.4.x) y `tsx` (esbuild). El parche de vite está solo en 6.4.3+; **forzar vite 6 bajo vitest 3
  arriesga romper la suite** (coste/beneficio negativo para un fallo de dev-server). Se resolverán
  cuando vitest suba a vite 6 y tsx suba esbuild — vía Dependabot.
- **uuid** (moderado): profundo en el toolchain de Expo (`expo → @expo/config-plugins → xcode →
uuid@7`). Forzar uuid 11 (cambio de major) probablemente rompe `xcode`/prebuild. Build-time y solo
  con arg `buf`; riesgo real ≈ 0. Se difiere a Expo/Dependabot.
