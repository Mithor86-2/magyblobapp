# Plan — Feature 46 / US-44: Validación de fronteras de datos con Zod

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Hoy **no hay Zod** en el repo (ni en `package.json` ni en código). La validación de datos vive
repartida en tres formas distintas:

- **Input HTTP (rutas):** JSON Schema escrito a mano + Ajv (integrado en Fastify 5) en
  [profiles.ts](../../packages/backend/src/routes/profiles.ts),
  [guardians.ts](../../packages/backend/src/routes/guardians.ts),
  [activities.ts](../../packages/backend/src/routes/activities.ts),
  [stories.ts](../../packages/backend/src/routes/stories.ts). Los tipos se declaran **aparte** en
  [dto.ts](../../packages/backend/src/application/dto.ts) → duplicación mantenida a mano (✅ funciona,
  pero el schema y el DTO pueden desincronizarse).
- **Salida del LLM (no fiable):** saneo imperativo (`typeof`/rangos/filtrado) en
  [parseResponse.ts](../../packages/backend/src/infrastructure/ai/parseResponse.ts). Un modelo pequeño
  alucina (categorías inexistentes, `nivel: 1000`) → el código **sanea, no solo rechaza**.
- **Settings JSON (no fiable):** `JSON.parse` + chequeos manuales en
  [cloudSettings.ts](../../packages/backend/src/infrastructure/ai/cloudSettings.ts) y
  [storyParams.ts](../../packages/backend/src/infrastructure/ai/storyParams.ts) (ante la duda → `null`).
- **Respuestas del backend en la app:** **sin validación**, cast directo `as TResponse` en
  [app/.../http.ts](../../packages/app/src/infrastructure/http.ts) → agujero de robustez real.

**Decisiones tomadas con el usuario (2026-06-25):**

- Introducir **Zod 4** (estable; `safeParse`/`parse` idénticos a Zod Mini; bundle core −2x, Zod Mini
  −6.6x — relevante para Expo) de forma **incremental y acotada**, no en bloque.
- **Restricción dura de arquitectura:** Zod **no entra en `/domain`**. El invariante de capas
  (`no-restricted-imports` en [eslint.config.mjs](../../eslint.config.mjs)) prohíbe dependencias
  externas en dominio. Los value-objects [Edad.ts](../../packages/backend/src/domain/value-objects/Edad.ts)
  e [Idioma.ts](../../packages/backend/src/domain/value-objects/Idioma.ts) **no se tocan**. Los esquemas
  Zod viven en **application/infrastructure** (backend) y en `infrastructure` (app).
- **Cumplimiento de menores:** Zod es librería de validación pura, sin red/SDK/telemetría → **no
  afecta** a C-2/C-5 ([cumplimiento-menores.md](../cumplimiento-menores.md)). No requiere desviación.
- **Comportamiento a preservar:** los esquemas deben **sanear igual que hoy** (no endurecer ni relajar
  la validación existente); los tests co-localizados actuales son la red de seguridad.
- **Fase 2 es opcional** y se decide tras la Fase 1: migrar rutas a `fastify-type-provider-zod` solo
  si el beneficio (matar la duplicación schema↔DTO) compensa el cambio en la ruta de error Ajv →
  `errorHandler`.

## Historias cubiertas

- US-44 — Validación de fronteras de datos con Zod ([épica F](../historias-usuario/epic-f-plataforma.md#us-44))

## Fase 1 — Validación en fronteras no fiables (valor alto, riesgo bajo)

Todo en capas externas (infra del backend + infra de la app), con tests existentes como red.

- [ ] ❌ Añadir `zod` (v4) como dependencia de `@magyblob/backend` y de `@magyblob/app`
      (`pnpm --filter <pkg> add zod`). Verificar `minimumReleaseAge` del workspace no bloquea la versión.
- [ ] ❌ **parseResponse.ts** — sustituir el saneo manual por esquemas Zod equivalentes:
      `storySchema` (`titulo`/`cuerpo` string no vacío tras `trim`), `actividadSchema`
      (`categoria` vía `z.enum(CATEGORIAS)`, `titulo`/`descripcion` no vacíos, `duracionMin`/`nivel`
      enteros en rango con descarte → `undefined`). Conservar: filtrar inválidas, `slice(cantidad)`,
      error si 0 válidas. Mantener firmas públicas (`parseStory`/`parseActivities`).
- [ ] ❌ **cloudSettings.ts** — `parseCloudSetting` con `z.object({activo, target, model}).safeParse`;
      `target` validado contra `esCloudTarget`, `model` no vacío; ante fallo → `null` (privacidad por
      defecto). Sin lanzar.
- [ ] ❌ **storyParams.ts** — `parseStoryParams` con esquema Zod: `palabrasMin/Max` enteros positivos
      con `max >= min`, `rima` boolean, `formatos` array filtrado a vocabulario y dedup; fallo → `null`.
- [ ] ❌ **app/infrastructure/http.ts** — esquemas Zod para las respuestas (`Guardian`, `ChildProfile`,
      `Story`, `Activity`, `History`); `request<T>` valida con `safeParse` y lanza `ApiError`
      controlado (en vez de `as TResponse`) si la forma no cumple. Evaluar Zod Mini por bundle.
- [ ] ❌ Tests co-localizados por esquema (válido / inválido / saneable) que repliquen el
      comportamiento de la validación manual sustituida (`parseResponse.test.ts`, settings, http).
- [ ] ❌ **Verificar invariante de capas:** `pnpm lint` confirma que ningún import de `zod` aparece en
      `/domain` (regla `no-restricted-imports` verde).
- [ ] ❌ Gate verde (`pnpm check`) + entradas en `CHANGELOG.md` (backend y app) bajo `## [Unreleased]`.

## Fase 2 — Rutas Fastify vía type-provider (OPCIONAL, decidir tras Fase 1)

- [ ] ❌ Evaluar `fastify-type-provider-zod` compatible con Fastify 5; comprobar que la ruta de error
      (validación → 400) sigue pasando por [errorHandler.ts](../../packages/backend/src/routes/errorHandler.ts).
- [ ] ❌ Migrar los 4 schemas de ruta a esquemas Zod como **única fuente de verdad**, derivando los
      tipos de [dto.ts](../../packages/backend/src/application/dto.ts) con `z.infer` (elimina duplicación).
- [ ] ❌ Tests de integración de rutas verdes sin cambios de contrato; documentar el nuevo flujo de
      validación en la API doc si aplica.

## Cierre

- [ ] ❌ Actualizar [phases.md](../phases.md) y, si procede, [memory.md](../memory.md) /
      [lecciones-aprendidas.md](../lecciones-aprendidas.md) (gotcha: Zod prohibido en dominio).
- [ ] ❌ Pruebas con el usuario (manual u ofrecer verificación automatizada) → confirmación explícita →
      cierre con la skill **cerrar-feature** (versión SemVer, CHANGELOG fechado, merge a `develop`).
