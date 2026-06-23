# Plan — Fase 6 (Calidad): integración con BD real, E2E y CI

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Rama: `feature/34-integracion-e2e-ci` (worktree desde `develop`, en paralelo a
> `feature/33-observer-event-bus`). Historia: **US-32**.

## Contexto

Qué hay ya (✅) y qué falta (❌):

- ✅ **Unitarios** de dominio/aplicación con dobles in-memory (sin IO).
- ✅ **Integración de rutas** con `app.inject()` + `makeInMemoryDeps()` (HTTP, pero **sin BD**).
- ✅ **Componentes de la app** (US-30) con React Native Testing Library sobre Vitest/jsdom.
- ❌ **Integración de persistencia**: nada ejercita los `Prisma*Repository` contra un PostgreSQL
  real (mapeo ORM↔entidad, cascadas, constraints). Solo verificado a mano (`phases.md`).
- ❌ **E2E de backend**: el flujo completo por HTTP contra el stack real solo se probó a mano.
- ❌ **E2E de app**: no hay pruebas de flujo/navegación; los componentes se prueban aislados.
- ❌ **CI**: no existe `.github/workflows`; el gate (`pnpm check`) se corre a mano.
- ❌ **Documentación de la estrategia de pruebas** (pirámide + guía TDD) en un único documento.

Decisiones tomadas con el usuario (2026-06-22):

- **Integración** = añadir pruebas de los `Prisma*Repository` **contra PostgreSQL real** (no solo
  formalizar los in-memory).
- **E2E** = **ambos**: E2E de backend contra el stack real **y** E2E de app con **Playwright**.
- **CI** = **sí**, GitHub Actions ejecutando el gate + integración + E2E.
- Todo en modo **`mock`** por defecto (cumplimiento-menores: sin red ni IA externa ni SDKs de
  terceros en runtime; dependencias nuevas solo de desarrollo/CI). Sin romper el arranque
  reproducible (US-06).

## Historias cubiertas

- US-32 — Integración con BD real, E2E y CI ([épica F](../historias-usuario/epic-f-plataforma.md#us-32))
- US-17 (parcial) — Logs/tracking se rozan en E2E (verificación de `AuditLog`); el grueso vive en
  `feature/33-observer-event-bus`. No solapar: aquí solo se **verifica**, no se implementa.

## Sub-fases y tareas

Estado: `❌` pendiente · `🔄` en curso · `✅` hecha.

### 6.1 — Integración de persistencia (Prisma ↔ PostgreSQL real) ✅

- [x] ✅ **Testcontainers** (`@testcontainers/postgresql`) como `devDependency` del backend. Builds
      nativos transitivos (`ssh2`, `cpu-features`, `protobufjs`) desactivados en `pnpm-workspace.yaml`
      (solo para Docker remoto vía SSH/gRPC; con Docker local no se usan).
- [x] ✅ Soporte de test [`test/support/db.ts`](../../packages/backend/test/support/db.ts): arranca
      `postgres:16-alpine`, aplica el historial real de migraciones (`prisma migrate deploy`, invocado
      por ruta absoluta de node+CLI para no usar `PATH`), expone un `PrismaClient` (`datasourceUrl`) y
      aísla estado con `TRUNCATE … RESTART IDENTITY CASCADE`. Factorías en `test/support/fixtures.ts`.
- [x] ✅ Suite `test/integration-db/` con **un fichero por repositorio** (8): `Guardian`,
      `ChildProfile`, `Story`, `Activity`, `StoryNarration`, `InteractionEvent`, `AuditLog` y
      `Settings`. Cubre round-trip + mapeo ORM↔entidad, FK reales, **cascadas** (`Guardian→ChildProfile`,
      `Story→StoryNarration`, `ChildProfile→InteractionEvent`), **SetNull** (`AuditLog`), upsert y JSON.
      **25 tests en verde** contra Postgres real.
- [x] ✅ Script `pnpm --filter @magyblob/backend test:integration` (config Vitest aparte,
      `vitest.integration.config.ts`); el `pnpm test` del gate diario **excluye** `integration-db` (no
      exige Docker).
- [x] ✅ Decisión: la integración **no** entra en el `pnpm check` local (no exige Docker en el día a
      día); se ejecuta aparte en local y **siempre en CI** (job dedicado en 6.4).

### 6.2 — E2E de backend (stack real por HTTP) ✅

- [x] ✅ Test E2E [`test/e2e/flujo-mvp.e2e.test.ts`](../../packages/backend/test/e2e/flujo-mvp.e2e.test.ts):
      servidor Fastify **real** (composición de producción, sin dobles) + Postgres real
      (Testcontainers) ejercitado por **HTTP real** (`fetch` a un puerto efímero) en `AI_PROVIDER=mock`.
- [x] ✅ Flujo del MVP encadenado: `POST /guardians` → `POST /guardians/login` → `POST /profiles` →
      `GET /guardians/:id/profiles` → `POST /stories` → `GET /profiles/:id/history` (el cuento aparece)
      → `POST /activities/recommend` → `POST /activities/:id/complete`. Aserciones de estado y
      persistencia entre llamadas. **3 tests en verde** (+ `/health`).
- [x] ✅ Verificado: `AuditLog` con `consentimiento` y `login` persistidos (leído de la BD real).
- [x] ✅ **Narración** tratada como **límite**: ElevenLabs es externo (fuera del modo `mock` por
      cumplimiento); el test verifica que sin clave la narración falla (no se sirve audio).
- [x] ✅ Script `pnpm --filter @magyblob/backend test:e2e` (config `vitest.e2e.config.ts`). El gate
      diario (`pnpm test`) **excluye** `test/e2e`. Documentación de cómo correrlo en 6.5.

### 6.3 — E2E de app (Playwright sobre Expo web) ✅

- [x] ✅ Playwright (`@playwright/test`) como `devDependency` de `packages/app` + `playwright.config.ts`
      con dos `webServer`: (1) el backend real (`scripts/e2e-serve.ts`: Fastify + Postgres efímero, mock)
      en `:3100`, y (2) [`e2e/serve-web.mjs`](../../packages/app/e2e/serve-web.mjs), que sirve el export
      web de Expo en `:4173` y **proxea** la API al backend (mismo origen → sin CORS).
- [x] ✅ Spec [`e2e/onboarding.spec.ts`](../../packages/app/e2e/onboarding.spec.ts): bienvenida → puerta
      parental (resuelve la suma) → alta del adulto → crear perfil → generar cuento, localizando por
      **rol/nombre accesible** (coherente con US-30). **1 test en verde** sobre Chromium.
- [x] ✅ Backend real en `mock` para que sea **verdaderamente E2E** (decisión confirmada).
- [x] ✅ Scripts `pnpm --filter @magyblob/app test:e2e` (export `--clear` con
      `EXPO_PUBLIC_API_URL=…:4173` + `playwright test`) y `e2e:install` (Chromium). `.gitignore` y
      `.prettierignore` ignoran `playwright-report/` y `test-results/`.
- [x] ✅ Gotcha resuelto: Metro cachea el bundle, así que el export usa `--clear` para reinlinar la
      `EXPO_PUBLIC_API_URL`; el puerto del backend E2E es `3100` para no chocar con el stack de
      `docker compose` (que ocupa el `3000`).

### 6.4 — CI (GitHub Actions) ✅

- [x] ✅ [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) disparado en `push`
      (`main`/`develop`) y `pull_request`, con `concurrency` para cancelar ejecuciones obsoletas.
      Tres jobs: (1) **gate** (`pnpm check`: typecheck + lint + format:check + tests unitarios, sin
      Docker), (2) **integración + E2E backend** (`test:integration` + `test:e2e` con Testcontainers),
      (3) **E2E app** (Playwright/Chromium sobre Expo web).
- [x] ✅ Caché de pnpm vía `actions/setup-node` (`cache: pnpm`); navegadores Playwright instalados con
      `playwright install --with-deps chromium`. El reporte de Playwright se sube como artefacto.
- [x] ✅ El workflow **falla** si cualquier job falla (hace cumplir el DoD). _Nota: la verificación
      real ocurre al hacer push; los comandos de cada job son los mismos ya validados en verde en local._

### 6.5 — Documentación de la estrategia de pruebas + guía TDD ✅

- [x] ✅ [`Docs/estrategia-pruebas.md`](../estrategia-pruebas.md): la **pirámide** (unitario /
      integración / E2E), qué cubre cada nivel, **cómo ejecutar** cada uno en local y en CI, y la tabla
      nivel → qué prueba → dónde vive → runner.
- [x] ✅ Guía **TDD**: ciclo Red→Green→Refactor y la tabla **dónde aplica test-first y dónde no** con
      la justificación YAGNI. Enlazada desde [`CLAUDE.md`](../../CLAUDE.md) (sección DoD); el enlace en
      `phases.md` se añade al cerrar (6.6).
- [x] ✅ `README` raíz: sección **Pruebas** con los nuevos scripts (`test:integration`, `test:e2e`,
      `e2e:install`) y enlace a la estrategia.

### 6.6 — Cierre (DoD)

- [ ] ❌ Gate verde local (`pnpm check`) + integración + E2E.
- [ ] ❌ CHANGELOG por paquete (mover de `## [Unreleased]` a versión fechada) + SemVer.
- [ ] ❌ Actualizar `phases.md` (marcar Fase 6) y tracking docs (`memory.md`,
      `lecciones-aprendidas.md` con los gotchas de Testcontainers/Playwright/CI).
- [ ] ❌ Pruebas con el usuario → confirmación explícita → `cerrar-feature` (no hacer `finish` sin
      el "sí").

## Riesgos / notas

- **Docker en CI**: Testcontainers y `docker compose` necesitan Docker disponible en el runner
  (GitHub-hosted lo trae). Mantener tiempos acotados (imágenes ligeras, `postgres:16-alpine`).
- **Expo web + Playwright**: el arranque de Expo en web puede ser lento; usar `expo export` a
  estático servido por un server simple si `expo start --web` es inestable en CI.
- **No solapar con feature/33**: aquí no se implementa el event bus ni logging nuevo; solo se
  verifica el `AuditLog` ya existente.
- **Cumplimiento**: todo E2E corre en `AI_PROVIDER=mock`; nada de red/IA externa en las pruebas.
