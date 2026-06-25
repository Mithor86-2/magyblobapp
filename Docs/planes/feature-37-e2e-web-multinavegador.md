# Plan — Feature 37: E2E web multinavegador (Playwright)

> El alcance global del proyecto vive en
> [plan-ejecucion-master.md](../plan-ejecucion-master.md) y el estado por fase en
> [phases.md](../phases.md). Este documento desarrolla **cómo** se trocea y ejecuta esta feature
> (fases → tareas con seguimiento de estado). Cierra con la skill **cerrar-feature**.

Rama: `feature/37-e2e-web-multinavegador` (desde `develop`).

## Contexto

[US-32](../historias-usuario/epic-f-plataforma.md#us-32) dejó el E2E de la app con Playwright sobre el
**export web de Expo** (`expo export --platform web`), servido por un proxy de mismo origen contra el
backend real en modo `mock`, pero **solo en `chromium`** y con reporter `list`. Esta feature **amplía**
ese E2E a **multi-navegador** (añade el motor **WebKit** = el de iOS y un **viewport móvil** _portrait_)
y a **reporting rico** (HTML + JSON + line, con trazas/vídeo/capturas ante fallo).

**Valida el EXPORT WEB de la app, no la app nativa.** Solo toca la suite E2E de `packages/app` (config y
scripts de prueba); no cambia runtime de la app ni del backend. Respeta
[cumplimiento-menores.md](../cumplimiento-menores.md): modo `mock` por defecto, dependencias solo de
desarrollo, sin SDKs de terceros en runtime, y sin pasos ocultos en el arranque reproducible (US-06).

Estado de partida:

- ✅ E2E web con Playwright sobre Expo web en `chromium` (US-32).
- ✅ `webServer` (backend mock + servidor estático del export), `baseURL`, `testDir`, `workers: 1`.
- ✅ Script `test:e2e` (export web + `playwright test`) y `e2e:install` (`playwright install chromium`).
- ❌ Proyectos `mobile-chrome` (Pixel 5) y `mobile-safari` (iPhone 13, WebKit).
- ❌ Reporting HTML + JSON + line.
- ❌ Screenshot/video/trace ante fallo + `retries: 1` solo en CI.
- ❌ `e2e:install` instalando también el binario de **webkit**.
- ❌ `.gitignore` de `playwright-report/` y `test-results/`.
- ❌ Estrategia de coste en CI (chromium en el gate de PR; mobile-\* en nightly por `--project`).

## Historias cubiertas

- [US-36 — E2E web multinavegador (Playwright)](../historias-usuario/epic-f-plataforma.md#us-36) · Could (Mejoras).

## Tareas

### Fase 1 — Multi-navegador

- ✅ Añadir a `packages/app/playwright.config.ts` los proyectos `chromium`
  (`devices['Desktop Chrome']`, baseline), `mobile-chrome` (`devices['Pixel 5']`, viewport móvil
  _portrait_) y `mobile-safari` (`devices['iPhone 13']`, motor WebKit). Conservar sin cambios
  `webServer`, `baseURL` (`http://127.0.0.1:4173`), `testDir` (`./e2e`) y `workers: 1`. _(Hecho:
  se conservaron además `fullyParallel`, `timeout` y `expect`.)_

### Fase 2 — Reporting y depuración

- ✅ Añadir reporters `html` (`outputFolder: 'playwright-report'`, `open: 'never'`),
  `json` (`outputFile: 'test-results/results.json'`) y `line`.
- ✅ Configurar `use`: `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`,
  `trace: 'retain-on-failure'`, y `retries: 1` **solo en CI** (`retries: process.env.CI ? 1 : 0`;
  con `workers: 1` y `retries: 0`, `on-first-retry` no captura nada).

### Fase 3 — Scripts e ignore

- ✅ Actualizar el script `e2e:install` de `packages/app/package.json` a
  `playwright install chromium webkit`.
- ✅ Actualizar `.gitignore` (raíz) para ignorar `packages/app/playwright-report/` y
  `packages/app/test-results/`.

### Fase 4 — Coste en CI (documentación)

- ❌ Documentar la estrategia de coste (con `workers: 1`, ~3x navegadores en serie): dejar **solo
  `chromium`** en el gate de PR y `mobile-safari`/`mobile-chrome` en un job **nightly** filtrando por
  `--project`. Reflejarlo en [estrategia-pruebas.md](../estrategia-pruebas.md) y/o en el workflow de CI.
  _(Pendiente: tarea de documentación/CI; se aborda en el cierre con el usuario.)_

### Fase 5 — Gate y cierre

- ✅ Verificar el gate: `pnpm check` (typecheck + lint + format:check + test) en verde, exit 0
  (139 backend + 41 app). _(El E2E con Docker queda fuera del gate, como `test:e2e`; se verifica aparte.)_
- ❌ Verificar que el **E2E sigue verde** (al menos `chromium`; idealmente los tres proyectos con
  Docker y `e2e:install`). _(Requiere Docker/Testcontainers y binarios de navegador → verificación
  del usuario; ver Riesgos.)_
- ✅ Actualizar docs (CHANGELOG de `@magyblob/app`, `phases.md`, `memory.md`,
  `lecciones-aprendidas.md`, `estrategia-pruebas.md`, este plan).
- ✅ Versionado SemVer (minor): app `0.11.0 → 0.12.0`, raíz `0.18.0 → 0.19.0`; CHANGELOG de
  `@magyblob/app` movido a `## [0.12.0] - 2026-06-24` con `## [Unreleased]` vacío.
- ❌ Cierre con Git Flow (`git flow feature finish`): **pendiente de confirmación explícita del
  usuario** tras sus pruebas con Docker/navegadores.

## Riesgos / pendientes

- **Verificación con navegadores reales (Docker).** El config compila y pasa lint/format/typecheck,
  pero la ejecución real de los tres `projects` requiere Docker (Testcontainers) y los binarios de
  Chromium + WebKit (`pnpm --filter @magyblob/app e2e:install`). No se ejecutó aquí; lo verifica el
  usuario con `pnpm --filter @magyblob/app test:e2e`.
- **Locators en viewport móvil.** `e2e/onboarding.spec.ts` localiza por rol/nombre accesible (no por
  estructura ni estilo), lo que es robusto frente al viewport; pero el flujo no se ha ejercitado en
  `mobile-chrome`/`mobile-safari`. Si algún paso quedara fuera de viewport o requiriese scroll en
  _portrait_ (Pixel 5 / iPhone 13), podría fallar en esos proyectos. No se cambió el test (el cambio
  no sería trivial); de surgir, se ajustará el spec tras la verificación con navegadores reales.
