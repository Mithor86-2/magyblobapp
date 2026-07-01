# Plan — Feature 76: Estándar de documentación de código (cabeceras + lint)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

Rama: `feature/76-doc-estandar-jsdoc` (desde `develop`). Historia: **US-65**
([épica F](../historias-usuario/epic-f-plataforma.md#us-65)). Naturaleza: **mejora de calidad/tooling**
post-HITO 2; **no altera lógica**.

## Contexto

Una auditoría de documentación (junio 2026) concluyó que el proyecto **ya cumple una convención de
facto** coherente y con buena cobertura (~89–90 %):

- ✅ Cabecera de módulo `/** */` en **prosa española** describiendo el propósito.
- ✅ Interfaces/campos con semántica importante documentados; trazabilidad a **US-NN** y a requisitos
  de **cumplimiento** (`C-N`).
- ✅ Español en la doc, inglés en el andamiaje. Sin TSDoc formal (`@param/@returns`); prosa.
- ❌ **14 ficheros** de `src` sin cabecera de módulo (huecos concretos, abajo).
- ❌ El estándar **no está _enforced_**: no hay `eslint-plugin-jsdoc`, `typedoc` ni regla de doc en el
  gate. La cobertura depende de disciplina manual.

**Decisión (con el usuario):** hacer ambas cosas en una sola feature — (1) cerrar los 14 huecos
siguiendo la convención existente y (2) volverla _enforced_ con `eslint-plugin-jsdoc`
(`jsdoc/require-jsdoc`, `publicOnly`) integrada en `pnpm check`, excluyendo tests y código generado.

### Los 14 huecos (fuente: auditoría)

**Backend (9):**

- Rutas (cabecera de módulo): `packages/backend/src/routes/profiles.ts`, `.../stories.ts`,
  `.../anonymous.ts`, `.../activities.ts`.
- Providers IA: `.../infrastructure/ai/CloudProvider.ts` (sin doc),
  `.../infrastructure/ai/createAIProvider.ts` (factory sin doc),
  `.../infrastructure/ai/OllamaProvider.ts` (doc mal ubicada → moverla al inicio).
- Dominio/aplicación: `.../domain/entities/Story.ts` (falta cabecera de clase),
  `.../application/use-cases/RecommendActivities.ts` (bloque en línea ~21 → llevar al inicio).

**App (5):**

- Pantallas: `packages/app/src/presentation/screens/StoryGeneratorScreen.tsx`, `.../HistoryScreen.tsx`,
  `.../CreateProfileScreen.tsx`, `.../ActivitiesScreen.tsx`.
- Componente: `packages/app/src/presentation/components/Icon.tsx`.

## Historias cubiertas

- US-65 — Estándar de documentación de código (cabeceras + lint)
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-65))

## Hallazgo (revisión con el linter como fuente de verdad)

Al configurar la regla se comprobó que **la auditoría sobre-reportó**: los 3 «backend sin doc» del
conteo eran ficheros **generados de Prisma** (`src/generated/**`), y `CloudProvider`, `createAIProvider`,
`OllamaProvider`, `Story` y `RecommendActivities` **ya tenían** doc adyacente en su clase/función (el
patrón correcto del proyecto). Los **huecos reales**, según `jsdoc/require-jsdoc`, eran **14 funciones
exportadas** sin bloque (mappers, type-guards, `parseStory`/`parseActivities`, `buildStoryPrompt`/
`buildActivitiesPrompt`) + las **4 pantallas** del app. **Alcance del _enforce_: backend**, porque el
app **no tiene ESLint** en el gate (montarlo es tarea de infra aparte, ver Follow-ups).

## Fases y tareas

### Fase 1 — Cerrar huecos de cabecera (backend)

- [x] ✅ Cabecera de módulo en las 4 rutas (`profiles`, `stories`, `anonymous`, `activities`).
- [x] ✅ `CloudProvider`/`createAIProvider`/`OllamaProvider`: ya documentados en su símbolo (sin cambio).
- [x] ✅ `Story.ts` y `RecommendActivities.ts`: ya tienen doc de clase adyacente (sin cambio).
- [x] ✅ Documentadas 14 funciones exportadas que la regla marcó (mappers, type-guards, parseResponse,
      prompts, storyParams).

### Fase 2 — Cerrar huecos de cabecera (app)

- [x] ✅ Cabecera en las 4 pantallas (`StoryGenerator`, `History`, `CreateProfile`, `Activities`).
- [x] ✅ `Icon.tsx`: ya tenía doc (falsa alarma de la auditoría; sin cambio).

### Fase 3 — Estándar _enforced_ con eslint-plugin-jsdoc

- [x] ✅ `eslint-plugin-jsdoc` añadido como devDependency del workspace.
- [x] ✅ `jsdoc/require-jsdoc` en [../../eslint.config.mjs](../../eslint.config.mjs) para exports
      públicos (`ClassDeclaration` + `FunctionDeclaration`, `publicOnly`), acotado a
      `packages/backend/src/**`. Solo `require-jsdoc` (no el preset), acorde a la convención de prosa.
- [x] ✅ Excluidos tests y `src/generated/**` (ignore global). Interfaces **no** exigidas (evita ruido
      en los «bags» de opciones triviales).
- [x] ✅ Documentados los 14 exports que la regla marcó → `pnpm lint` en verde.

### Fase 4 — Gate + docs + cierre

- [x] ✅ `pnpm check` en verde (typecheck + lint + format:check + test): backend 311, app 187.
- [x] ✅ Entradas en `CHANGELOG.md` (backend y app) bajo `## [Unreleased]`.
- [ ] 🔄 Pruebas con el usuario → confirmación → cierre con `cerrar-feature`.

## Follow-ups (fuera de alcance)

- Montar ESLint en el app Expo (no existe hoy) para extender el _enforce_ de documentación a las
  pantallas/componentes. Sería su propia feature de tooling.
- Valorar `typedoc` para generar un sitio de documentación navegable.

## Notas de alcance

- **No** se toca lógica de negocio: solo comentarios y configuración de lint. No se añaden
  `@param/@returns` masivos (la convención es prosa); la regla exige _presencia_ de bloque, no formato
  TSDoc completo.
- No entra en esta feature: `typedoc` / generación de sitio de documentación (se puede valorar aparte).
- `ideas.txt` (raíz, sin trackear) es ajeno a esta rama; no se incluye.
