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

- [x] ✅ Añadir `zod` (v4.4.3) como dependencia de `@magyblob/backend` y de `@magyblob/app`. No
      bloqueado por `minimumReleaseAge`.
- [x] ✅ **parseResponse.ts** — saneo manual sustituido por esquemas Zod: `storySchema`
      (`textoNoVacio` = trim + min(1)), `actividadSchema` (`z.enum(CATEGORIAS)`, `textoNoVacio`,
      `duracionMin`/`nivel` vía `enteroEnRango(...).optional()` → `undefined` si falta o fuera de rango).
      Firmas públicas y mensajes de error intactos. Tests existentes verdes sin cambios.
- [x] ✅ **cloudSettings.ts** — `parseCloudSetting` con `cloudSettingSchema.safeParse` (`activo` boolean,
      `target` vía `z.custom(esCloudTarget)`, `model` `z.string().trim().min(1)`); `JSON.parse` con
      try/catch conservado; fallo → `null`. Tests verdes.
- [x] ✅ **storyParams.ts** — `parseStoryParams` con `storyParamsSchema` (enteros positivos,
      `palabrasMax >= palabrasMin` por `refine`, `rima` boolean, `formatos` filtrado+dedup no vacío por
      `refine`); helper `enteroPositivo` eliminado. Tests verdes (incluye dedup).
- [x] ✅ **app/infrastructure/http.ts + schemas.ts** — esquemas Zod por respuesta en
      `infrastructure` (reusan vocabularios de `domain`); `request` recibe el esquema y valida en la
      frontera → `ApiError` tipo `malformed` si no cumple (en vez del cast `as`). Decisión del usuario:
      validar y actualizar tests. Los mocks parciales de `http.test.ts` pasan a fixtures completos.
- [x] ✅ Backend: tests existentes (192) verdes sin tocarlos → el comportamiento se preservó 1:1.
- [x] ✅ App: `http.test.ts` con fixtures completos + 2 tests nuevos del caso `malformed` (objeto y
      lista con elemento inválido); 87 tests verdes.
- [x] ✅ **Invariante de capas verificado:** `grep` y `pnpm lint` confirman 0 imports de `zod` en
      `/domain` (regla `no-restricted-imports` verde).
- [x] ✅ Gate completo `pnpm check` verde (EXIT 0): typecheck + lint + format + 192 backend + 87 app.
- [x] ✅ Entradas en `packages/backend/CHANGELOG.md` y `packages/app/CHANGELOG.md`.

## Fase 2 — Rutas Fastify vía type-provider (hecha)

- [x] ✅ `fastify-type-provider-zod` (v7) instalado, compatible con Fastify 5 + Zod 4. Compiladores
      (`validatorCompiler`/`serializerCompiler`) cableados en [server.ts](../../packages/backend/src/server.ts)
      antes de registrar rutas. Sin esquema `response`, la serialización por defecto se mantiene (no
      afecta a la narración que devuelve un `Buffer`).
- [x] ✅ Las 4 rutas con body (`guardians`, `guardians/login`, `profiles`, `stories`,
      `activities/recommend`, `activities/:id/complete`) migradas de JSON Schema a Zod vía
      `app.withTypeProvider<ZodTypeProvider>()`; el tipo del body se **infiere del esquema** (se elimina
      `app.post<{ Body }>` y los imports de DTO en las rutas). `.strict()` replica
      `additionalProperties: false`.
- [x] ✅ **Decisión de capas:** los DTOs de `application` **no** se derivan con `z.infer` de los
      esquemas Zod — eso obligaría a `application → infrastructure`, prohibido por el invariante. Los
      esquemas Zod viven en las rutas (infra) y los DTOs siguen siendo el contrato de los casos de uso;
      la duplicación eliminada es la del **literal JSON Schema**.
- [x] ✅ `errorHandler` intacto: los errores de validación de Zod llegan con `statusCode 400` igual que
      los de Ajv → contrato `{ error: { tipo, mensaje } }` y status 400 preservados. Regex de email del
      login con la misma supresión `sonarjs/super-linear-regex` que `Guardian.emailValido`.
- [x] ✅ 25 tests de integración de rutas verdes sin cambios de contrato; gate completo `pnpm check`
      verde (EXIT 0): 192 backend + 87 app. Entrada en `packages/backend/CHANGELOG.md`.

> **Pendiente fuera del gate:** las suites con Docker (`test:integration` de persistencia y `test:e2e`)
> no se han corrido en local (requieren Docker); se ejecutan en CI.

## Cierre

- [ ] ❌ Actualizar [phases.md](../phases.md) y, si procede, [memory.md](../memory.md) /
      [lecciones-aprendidas.md](../lecciones-aprendidas.md) (gotcha: Zod prohibido en dominio).
- [ ] ❌ Pruebas con el usuario (manual u ofrecer verificación automatizada) → confirmación explícita →
      cierre con la skill **cerrar-feature** (versión SemVer, CHANGELOG fechado, merge a `develop`).
