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
- [x] ✅ Script `pnpm --filter @magyblob/backend test:e2e` (config `vitest.e2e.config.ts`); el `pnpm
      test` del gate diario **excluye** `test/e2e`. Documentación de cómo correrlo en 6.5.

### 6.3 — E2E de app (Playwright sobre Expo web)

- [ ] ❌ Añadir Playwright (`@playwright/test`) como `devDependency` de `packages/app` + config
      (`playwright.config.ts`): `webServer` que sirve la app en web (`expo start --web` o
      `expo export` + estático) apuntando a un backend en `mock`.
- [ ] ❌ Spec del flujo de onboarding: abrir app → crear perfil → generar cuento → ver el cuento,
      localizando por **rol/etiqueta accesible** (coherente con US-30), no por estructura.
- [ ] ❌ Decidir backend para el E2E de app: stack `mock` (compose) o mock de red en el navegador.
      Propuesta: backend real en `mock` para que sea verdaderamente E2E.
- [ ] ❌ Script `pnpm e2e:app` + manejo de artefactos (trace/screenshot en fallo). `.gitignore`
      para `playwright-report/` y `test-results/`.

### 6.4 — CI (GitHub Actions)

- [ ] ❌ `.github/workflows/ci.yml` disparado en `push` y `pull_request`. Jobs: 1. **gate**: `pnpm install` + `pnpm check` (typecheck + lint + format:check + test unit). 2. **integration**: Postgres (service o Testcontainers) + `test:integration`. 3. **e2e-backend**: `docker compose up` en `mock` + `e2e:backend`. 4. **e2e-app**: instalar navegadores Playwright + `e2e:app`.
- [ ] ❌ Caché de pnpm/store y de navegadores Playwright. Subir reportes/trazas como artefactos.
- [ ] ❌ El workflow **falla** si cualquier job falla (hace cumplir el DoD). Documentar el badge.

### 6.5 — Documentación de la estrategia de pruebas + guía TDD

- [ ] ❌ `Docs/estrategia-pruebas.md`: la **pirámide** del proyecto (unitario / integración / E2E),
      qué cubre cada nivel, **cómo ejecutar** cada uno en local y en CI, y el **mapa** test→capa.
- [ ] ❌ Guía **TDD**: ciclo Red→Green→Refactor en casos de uso y rutas; **dónde aplica test-first
      y dónde no** (tabla), con la justificación YAGNI. Enlazar desde `CLAUDE.md` y `phases.md`.
- [ ] ❌ Actualizar `README` (raíz/paquetes) con la sección de pruebas y los nuevos scripts.

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
