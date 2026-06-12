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
skill `cerrar-feature`; **CloudProvider con Claude** como feature final (modelos recientes vía skill
`claude-api`; solo activo si hay `ANTHROPIC_API_KEY`); **omitir Chroma** documentando el porqué
(dedup simple por título basta para el MVP — YAGNI).

## Descomposición (orden de ejecución)

1. **Actividades end-to-end** ← detallada abajo; se ejecuta primero.
2. **Historial + Progreso**: `GetHistory` + `SaveProgress` (marcar cuento leído / completar
   actividad con estrellas) + pantallas **Inicio** e **Historial** (tabs a 4).
3. **CloudProvider (Claude)**: implementar el modo `cloud` real en `createAIProvider`.
4. **Decisión Chroma**: documentar la omisión (memory.md + nota en ADR 0004) con el dedup simple
   como alternativa adoptada.

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

## Features 2-4 (resumen; se detallan al llegar)

- **F2 Historial + Progreso**: `GetHistory` (lista cuentos + actividades del perfil; reusa
  `StoryRepository.findByProfile` y `ActivityRepository.findByProfile`), `SaveProgress`
  (`Story.marcarLeido()` → requiere `StoryRepository.update/save`; `Activity.completar(valoracion)`
  → `ActivityRepository.save`). Rutas `GET /profiles/:id/history`, `PATCH /stories/:id`,
  `POST /activities/:id/complete`. App: pestañas **Inicio** (bienvenida con el niño actual) e
  **Historial** (cuentos con estado/bookmark + actividades con estrellas); tabs a 4.
- **F3 CloudProvider (Claude)**: `infrastructure/ai/CloudProvider.ts` (consultar skill `claude-api`
  para modelos/SDK); `createAIProvider` modo `cloud` lo usa **solo si hay `ANTHROPIC_API_KEY`**, si
  no, mock con aviso. Salida estructurada equivalente a la de Ollama. Tests con SDK mockeado.
- **F4 Chroma — documentar omisión**: nota en `Docs/memory.md` y addendum en
  `Docs/ADR/0004-base-de-datos-vectorial-chroma.md` explicando que el dedup simple por título (F1)
  cubre el MVP y Chroma no gana su sitio (YAGNI); dejar el contenedor documentado como opcional.
