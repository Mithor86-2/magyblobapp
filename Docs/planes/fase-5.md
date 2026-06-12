# Plan — Fase 5: Resto de funcionalidad (descomposición por features)

> Plan de ejecución de la Fase 5. El alcance global vive en
> [../plan-ejecucion-master.md](../plan-ejecucion-master.md); el estado vivo en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Cerrados el HITO 1 (Fase 4) y el refactor del app a Clean Architecture, toca **ensanchar**:
actividades recomendadas con IA, progreso e historial, proveedor cloud opcional y la decisión sobre
Chroma. La exploración confirma que buena parte del andamiaje del backend **ya existe** y no hay que
rehacerlo:

- ✅ Entidad `Activity` (`domain/entities/Activity.ts`, con `completar()`), vocabulario `CATEGORIAS`
  (`arte|musica|logica`), modelo Prisma `activities`, y `Story.marcarLeido()` + `estado`.
- ✅ `AIProvider.recommendActivities` ya implementado en `MockProvider` y `OllamaProvider`
  (+ `FallbackProvider`). El modo `cloud` de `createAIProvider` hoy avisa y cae a mock.
- ❌ Faltan: `ActivityRepository` (interfaz + Prisma + doble in-memory), casos de uso
  `RecommendActivities` / `SaveProgress` / `GetHistory`, sus DTOs, rutas, `CloudProvider` real, y en
  la app: tipo/gateway `Activity`, tab navigator y pantallas Inicio/Actividades/Historial.

**Decisiones (con el usuario):** trocear en **features secuenciales** cerradas una a una con la
skill `cerrar-feature`. **CloudProvider y Chroma se retiraron del alcance** (2026-06-12): el
proyecto se queda con los modos `mock`/`local` (privacidad por diseño) y con el **dedup simple por
título** para no repetir actividades; ni la IA en la nube ni la base vectorial ganan su sitio para
el MVP (YAGNI).

## Descomposición (orden de ejecución)

1. **Actividades end-to-end** ✅ — detallada abajo.
2. **Historial + Progreso** ✅: `GetHistory` + `SaveProgress` (marcar cuento leído / completar
   actividad con estrellas) + pantallas **Inicio** e **Historial** (tabs a 4).

Cada feature: rama `git flow feature start <n>-<desc>`, gate verde, cierre con `cerrar-feature`
(SemVer, CHANGELOG, docs). Convenciones del repo: dominio en español, andamiaje en inglés;
`app` extiende `expo/tsconfig.base`; ESLint raíz ignora `packages/app/**` (gate cubre typecheck/
format/test).

---

## FEATURE 1 — Actividades end-to-end (primera)

Objetivo: generar actividades con IA para el perfil y verlas en la app, con la **shell de pestañas**.
Rama: `feature/5-actividades`.

### Backend

- **`domain/repositories/ActivityRepository.ts`** (interfaz): `save(activity)`,
  `findByProfile(profileId): Promise<Activity[]>`. Sigue el patrón de `StoryRepository.ts`.
- **`application/use-cases/RecommendActivities.ts`**: deps `{ profiles, activities, ai, newId, now }`
  (patrón de `GenerateStory.ts`). `execute({ profileId, categoria?, cantidad? })`:
  1. `profiles.findById` → `NotFoundError` si no existe.
  2. `ai.recommendActivities({ perfil, categoria, cantidad: cantidad ?? 3 })`.
  3. **Dedup simple** (justifica omitir Chroma): traer `activities.findByProfile`, descartar las
     generadas cuyo `titulo` ya exista para el perfil (case-insensitive).
  4. Mapear `GeneratedActivity[]` → entidades `Activity` (`newId`, `profileId`, `creadoEn`),
     persistir cada una y devolver `ActivityOutput[]`.
- **`application/dto.ts`**: `RecommendActivitiesRequest { profileId; categoria?; cantidad? }` y
  `ActivityOutput { id, profileId, categoria, titulo, descripcion, duracionMin?, nivel?,
completadaEn?, valoracion? }`.
- **`dependencies.ts`**: añadir `activities: ActivityRepository` a `AppDeps`.
- **`infrastructure/repositories/PrismaActivityRepository.ts`**: impl con mapper fila↔entidad
  (patrón `PrismaStoryRepository.ts`). Cablear en `infrastructure/composition.ts`
  (`buildProductionDeps`).
- **`routes/activities.ts`**: `POST /activities/recommend` con `bodySchema` (profileId requerido;
  `categoria` enum `CATEGORIAS` opcional; `cantidad` int 1-5 opcional) → `RecommendActivities`.
  Registrar en `server.ts`. (Sin `InteractionEvent` en recomendar: el vocabulario de eventos no
  tiene "recomendada"; el evento `actividad_completada` llega en la Feature 2.)
- **Tests**: `test/support/doubles.ts` → `InMemoryActivityRepository` + añadir `activities` a
  `makeInMemoryDeps`. `test/application/recommend-activities.test.ts` (genera N, respeta idioma del
  perfil vía FakeAIProvider, dedup por título). `test/routes/activities.integration.test.ts`
  (`POST /activities/recommend` → 201 con lista; perfil inexistente → 404).

### App (incluye la shell de pestañas)

- **`domain/types.ts`**: `CATEGORIAS = ['arte','musica','logica']` + `Categoria`, modelo `Activity`
  (espejo de `ActivityOutput`) y `RecommendActivitiesRequest`.
- **`domain/gateways.ts`**: `ActivityGateway { recommend(req): Promise<Activity[]> }` + añadirlo a `Api`.
- **`infrastructure/http.ts`**: implementar `activities.recommend` → `POST /activities/recommend`.
- **`presentation/labels.ts`**: `CATEGORIA_LABEL` (`Arte | Música | Lógica`).
- **Navegación (cambio estructural)**: añadir dependencia `@react-navigation/bottom-tabs` (vía
  `npx expo install`). `presentation/navigation.ts`: tipar un `MainTabParamList`. El root stack pasa
  a `Consent → CreateProfile → Main`, donde `Main` es un **tab navigator**. En esta feature, **2
  pestañas**: **Cuentos** (el actual `StoryGeneratorScreen`) y **Actividades** (nueva). Inicio e
  Historial se añaden en la Feature 2 (evita pantallas placeholder). Indicador activo tipo "blob"
  pastel con `tabBarIcon` (`@expo/vector-icons`, ya disponible) + fondo redondeado.
- **`presentation/screens/ActivitiesScreen.tsx`**: "Actividades para hoy"; botón **Generar
  actividades** (`api.activities.recommend({ profileId: currentProfile.id })`), estados de
  carga/error/reintento, y lista de `ActivityCard`. Filtro opcional de categoría con `SelectableChip`.
- **`presentation/components/ActivityCard.tsx`**: tarjeta con borde inferior de color por categoría
  (arte→coral, musica→menta, logica→cielo), emoji por categoría (🎨/🎵/🧩), badge de categoría,
  título, descripción y `duraciónMin`/`nivel`.
- **`App.tsx`**: montar el tab navigator como destino tras crear el perfil.
- **Test app**: extender `infrastructure/http.test.ts` con `activities.recommend`
  (`POST /activities/recommend`, cuerpo correcto).

### Verificación Feature 1

1. `pnpm check` verde (typecheck app+backend, lint, formato, tests nuevos incluidos).
2. `npx expo export --platform ios` bundlea sin errores (nueva dependencia de tabs + pantallas).
3. End-to-end real: `pnpm up:local` + app → crear perfil → pestaña **Actividades** → **Generar** →
   ver 3 tarjetas; comprobar en BD que `activities` tiene filas del perfil
   (`docker compose exec postgres psql ... select ... from activities`).

---

## FEATURE 2 — Historial + Progreso ✅ (cerrada 2026-06-12)

Objetivo: ver el historial del perfil (cuentos + actividades) y registrar progreso (marcar
cuento leído, completar actividad con estrellas). Completa las 4 pestañas del diseño.
Rama: `feature/5-historial-progreso`.

### Historias cubiertas

- **US-07** — Guardar / marcar cuento (estado `nuevo|leído`) ([epic-b](../historias-usuario/epic-b-cuentos.md)).
- **US-08** — Ver historial de cuentos; dominio `GetHistory` ordena por fecha desc ([epic-d](../historias-usuario/epic-d-historial.md)).
- **US-10** — Registrar actividad completada con valoración ([epic-c](../historias-usuario/epic-c-actividades.md)).

> **Decisión:** el plan nombraba `SaveProgress` genérico; se parte en **dos casos de uso cohesivos**
> (`MarkStoryRead`, `CompleteActivity`) porque el progreso es estado de `Story`/`Activity`
> (decisión I-6), y cada uno toca una entidad distinta. Más limpio que un caso de uso "cajón".

### Backend (tareas)

- [ ] ❌ `GetHistory` (caso de uso): devuelve `{ stories, activities }` ordenados por fecha desc.
      Reusa `StoryRepository.findByProfile` y `ActivityRepository.findByProfile` (ambos ya existen).
      DTO `HistoryOutput`.
- [ ] ❌ `MarkStoryRead` (US-07): `findById` → `Story.marcarLeido()` → persistir. Requiere que
      `PrismaStoryRepository.save` sea **upsert** (hoy hace `create`); `InMemoryStoryRepository` ya
      sobrescribe. Sin método nuevo en el puerto.
- [ ] ❌ `CompleteActivity` (US-10): añadir `findById(id)` a `ActivityRepository` (+ Prisma +
      in-memory) → `Activity.completar(valoracion, now)` → `save` (ya hace upsert). Valida 1-3.
- [ ] ❌ Rutas: `GET /profiles/:profileId/history`, `POST /stories/:id/read`,
      `POST /activities/:id/complete` (body `{ valoracion }`). Registrar en `server.ts`. El
      `actividad_completada` se escribe como `InteractionEvent` en la frontera HTTP.
- [ ] ❌ Tests: caso de uso por cada uno (dobles in-memory) + integración de las 3 rutas.

### App (tareas)

- [ ] ❌ `domain`: tipos `HistoryOutput`; gateways — `history.get(profileId)`,
      `stories.markRead(id)`, `activities.complete(id, valoracion)`; impl en `infrastructure/http`.
- [ ] ❌ Pestañas a **4** (Inicio · Actividades · Cuentos · Historial), orden del diseño.
- [ ] ❌ Pantalla **Inicio**: bienvenida con el nombre del niño actual + CTAs a Cuentos/Actividades.
- [ ] ❌ Pantalla **Historial**: sección Cuentos (estado `nuevo|leído` + "Ver de nuevo" → `markRead`)
      y sección Actividades hechas (estrellas + fecha). Carga vía `history.get`.
- [ ] ❌ Completar actividad con valoración (estrellas) desde `ActivityCard`/Actividades → `complete`.
- [ ] ❌ Test del gateway (`infrastructure/http.test.ts`) para las nuevas operaciones.
- [ ] ❌ Docs + cierre con `cerrar-feature` (SemVer, CHANGELOG, api.md, phases.md).

### Verificación F2

1. `pnpm check` verde (tests nuevos incluidos) + `expo export` sin errores.
2. e2e contra PostgreSQL real (rebuild backend): generar cuento → `read` → estado `leído`;
   recomendar actividad → `complete` con estrellas → aparece en `GET .../history`.

---

## Fuera de alcance (retirado el 2026-06-12)

- **CloudProvider (Claude):** no se implementa el modo `cloud`. Se mantienen `mock`/`local`
  (privacidad por diseño, sin clave en la nube). El stub actual de `createAIProvider` (cloud →
  aviso + mock) se deja como está.
- **Chroma (base vectorial):** no se usa. El **dedup simple por título** (F1) cubre "no repetir"
  para el MVP; Chroma añadiría infra sin aporte claro (YAGNI).
