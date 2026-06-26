# Plan — Feature 54: Dashboard/Home sin sesión (uso libre efímero) (US-50)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Coordinación del lote en
> [coordinacion-mejoras-paralelo.md](coordinacion-mejoras-paralelo.md) (feature **F-E**). Aquí va el
> **cómo** se trocea y ejecuta.
>
> Rama: `feature/54-dashboard-anonimo` (desde `develop`). Historia: **US-50** (épica F, plataforma).

## Contexto

Qué existe ya (✅):

- ✅ **Generación con sesión**: casos de uso `GenerateStory`/`RecommendActivities`
  ([application/use-cases](../../packages/backend/src/application/use-cases/)) que **persisten** y
  exigen `profileId`; rutas `POST /stories` y `POST /activities/recommend`
  ([routes/stories.ts](../../packages/backend/src/routes/stories.ts),
  [routes/activities.ts](../../packages/backend/src/routes/activities.ts)) **protegidas** con el
  decorador `authenticate` (JWT, US-45) y validadas con Zod (US-47/US-44).
- ✅ **`AIProvider`** (`generateStory`/`recommendActivities`) con fallback a `mock`; recibe un
  `ChildProfile` y los `temas`/`estilos` o `categoria`/`cantidad`.
- ✅ **Arranque del app**: [`resolveInitialRoute`](../../packages/app/src/presentation/initialRoute.ts)
  decide la ruta inicial (US-49); navegación en `navigation.ts`/`App.tsx`; gateways en
  [domain/gateways.ts](../../packages/app/src/domain/gateways.ts) + adaptador
  [infrastructure/http.ts](../../packages/app/src/infrastructure/http.ts).

Qué falta (❌):

- ❌ **No hay modo anónimo**: sin sesión el arranque va a `Welcome` y toda generación exige sesión y
  `profileId` persistido. No se puede probar la app sin registrarse.
- ❌ No hay rutas públicas de generación ni rate-limit.

### Decisiones tomadas (con el usuario, lote 2026-06-26)

- **Efímero (C-1):** el modo anónimo **genera y devuelve JSON sin persistir nada y sin nombre de
  niño**. No crea `ChildProfile`/`Story`/`Activity`; **no toca el modelo de datos ni Prisma**.
- **Datos mínimos:** los casos de uso anónimos reciben solo `edad`, `idioma` y `temas`/`estilos`
  (cuento) o `categoria`/`cantidad` (actividades). Internamente construyen un `ChildProfile`
  **transitorio** (nombre genérico no identificativo, sin id ni `guardianId` reales) para reusar el
  `AIProvider`, y lo descartan tras generar.
- **Rutas públicas:** `POST /stories/anonymous` y `POST /activities/recommend/anonymous` **sin** el
  decorador `authenticate`, validadas con Zod.
- **Rate-limit en memoria (sin dependencia nueva):** hook `onRequest` propio con un mapa
  IP→contador; máx. **3 cuentos + 3 actividades** por cliente, **429** al superarlo.
- **App:** `DashboardScreen` como ruta inicial **sin sesión** (`resolveInitialRoute`: sin sesión →
  `Dashboard`), con accesos a alta/login y contador **efímero** de usos (no persistente).

## Historias cubiertas

- **US-50 — Dashboard/Home sin sesión (uso libre efímero)**
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-50))

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha. Cada fase: **crear test → `pnpm check` verde →
actualizar docs**.

### Fase 1 — Andamiaje (docs) ✅

- ✅ US-50 creada en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md#us-50) (criterios
  Gherkin) + sumada al listado de la épica F.
- ✅ Fila de trazabilidad en [README.md](../historias-usuario/README.md) (Should · Mejoras · "Inicio
  sin sesión" · Épica F).
- ✅ Este plan escrito.
- ✅ `## [Unreleased]` (6 grupos) presente en ambos CHANGELOG.
- ✅ Commit `docs(planes): plan y US-50 de la feature 54 (dashboard anónimo)`.

### Fase 2 — Backend: casos de uso + rutas anónimas + rate-limit ✅

- ✅ `GenerateStoryAnonymous` ([application/use-cases](../../packages/backend/src/application/use-cases/GenerateStoryAnonymous.ts)):
  input `{ edad, idioma?, temas, estilos }`; valida vocabulario; construye `ChildProfile` transitorio;
  delega en `ai.generateStory`; **no persiste**; devuelve `AnonymousStoryOutput`. Test co-localizado.
- ✅ `RecommendActivitiesAnonymous` ([application/use-cases](../../packages/backend/src/application/use-cases/RecommendActivitiesAnonymous.ts)):
  input `{ edad, idioma?, categoria?, cantidad? }`; delega en `ai.recommendActivities`; **no
  persiste**; devuelve `AnonymousActivityOutput[]`. Test co-localizado.
- ✅ DTOs anónimos en [application/dto.ts](../../packages/backend/src/application/dto.ts).
- ✅ Rate-limit en memoria: hook `onRequest` ([routes/anonymousRateLimit.ts](../../packages/backend/src/routes/anonymousRateLimit.ts))
  con `TooManyRequestsError` (429) en [domain/errors.ts](../../packages/backend/src/domain/errors.ts)
  - manejo en [routes/errorHandler.ts](../../packages/backend/src/routes/errorHandler.ts).
- ✅ Rutas públicas `POST /stories/anonymous` y `POST /activities/recommend/anonymous` (sin
  `authenticate`), Zod en frontera. Tests de integración (200/201 + 429 + 400).

### Fase 3 — App: DashboardScreen + gateways anónimos + arranque ✅

- ✅ Gateways `stories.generateAnonymous` y `activities.recommendAnonymous` en
  [domain/gateways.ts](../../packages/app/src/domain/gateways.ts) + adaptador
  [infrastructure/http.ts](../../packages/app/src/infrastructure/http.ts) (rutas públicas, sin `auth`).
- ✅ Tipos de petición anónima en [domain/types.ts](../../packages/app/src/domain/types.ts).
- ✅ `DashboardScreen` ([presentation/screens](../../packages/app/src/presentation/screens/DashboardScreen.tsx)):
  explica la app, genera hasta 3 cuentos + 3 actividades (contador efímero `useState`), enlaza a
  alta/login. Test de componente.
- ✅ `resolveInitialRoute`: sin sesión → `Dashboard`. Test actualizado.
- ✅ Registro de la ruta en [navigation.ts](../../packages/app/src/presentation/navigation.ts) y
  [App.tsx](../../packages/app/App.tsx).

### Fase 4 — Cumplimiento + cierre ✅

- ✅ [cumplimiento-menores.md](../cumplimiento-menores.md): fila **C-14** (modo anónimo efímero, sin
  persistir dato de menor ni nombre; coherente con C-1).
- ✅ Entradas en `## [Unreleased]` de ambos CHANGELOG (sin tocar `version`).
- ✅ `pnpm check` verde.

## Tests

- **Backend (application):** `GenerateStoryAnonymous`/`RecommendActivitiesAnonymous` no persisten
  (repos sin escrituras), generan en el idioma indicado, rechazan vocabulario inválido.
- **Backend (rutas):** `POST /stories/anonymous` y `.../recommend/anonymous` → 201 dentro del límite,
  **429** al superarlo, **400** ante entrada inválida, **sin** token (públicas).
- **App:** `DashboardScreen` llama a los gateways anónimos y respeta el contador (deshabilita al
  llegar a 3); `resolveInitialRoute` → `Dashboard` sin sesión.

## Docs + cierre

- US-50 + trazabilidad ✅ · cumplimiento C-14 ✅ · CHANGELOG `[Unreleased]` (versión diferida) ✅.
- **No** se cierra la feature (sin `finish`/merge): se detiene tras `pnpm check` verde y commits.
