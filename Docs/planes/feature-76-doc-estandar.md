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

## Fases y tareas

### Fase 1 — Cerrar huecos de cabecera (backend)

- [ ] ❌ Cabecera de módulo en las 4 rutas (`profiles`, `stories`, `anonymous`, `activities`):
      `/** Rutas Fastify de … · valida con JSON Schema · US-NN */`.
- [ ] ❌ `CloudProvider.ts`: documentar (texto vía Groq/dialecto OpenAI, fallback a Mock).
- [ ] ❌ `createAIProvider.ts`: documentar la factory (compone `AIProvider` según `AI_PROVIDER`;
      envuelve en `FallbackProvider`).
- [ ] ❌ `OllamaProvider.ts`: mover el bloque doc al inicio del módulo.
- [ ] ❌ `Story.ts`: cabecera de clase (entidad con estado nuevo/leído + favorito, US-63).
- [ ] ❌ `RecommendActivities.ts`: mover el bloque `/** */` al inicio de la clase.

### Fase 2 — Cerrar huecos de cabecera (app)

- [ ] ❌ Cabecera en las 4 pantallas (propósito + flujo + US que cubren).
- [ ] ❌ `Icon.tsx`: cabecera del componente (wrapper de Ionicons unificado con el theme).

### Fase 3 — Estándar _enforced_ con eslint-plugin-jsdoc

- [ ] ❌ Añadir `eslint-plugin-jsdoc` como devDependency (raíz/workspace) — consultar la doc vigente
      del plugin antes de configurar (flat config).
- [ ] ❌ Configurar `jsdoc/require-jsdoc` en [../../eslint.config.mjs](../../eslint.config.mjs) para
      **exports públicos** (clases, interfaces, funciones exportadas) con `publicOnly`.
- [ ] ❌ Excluir `**/*.test.ts`, `packages/backend/src/generated/**` y lo que no sea fuente propia;
      calibrar severidad (`warn`→`error`) sin volver ruidoso el gate.
- [ ] ❌ Ajustar cualquier export público que la regla marque (o documentarlo).

### Fase 4 — Gate + docs + cierre

- [ ] ❌ `pnpm check` en verde (typecheck + lint + format:check + test).
- [ ] ❌ Entradas en `CHANGELOG.md` (backend y app) bajo `## [Unreleased]` (`Added`/`Changed`).
- [ ] ❌ Actualizar [../lecciones-aprendidas.md](../lecciones-aprendidas.md) si hay gotcha del plugin.
- [ ] ❌ Pruebas con el usuario → confirmación → cierre con `cerrar-feature`.

## Notas de alcance

- **No** se toca lógica de negocio: solo comentarios y configuración de lint. No se añaden
  `@param/@returns` masivos (la convención es prosa); la regla exige _presencia_ de bloque, no formato
  TSDoc completo.
- No entra en esta feature: `typedoc` / generación de sitio de documentación (se puede valorar aparte).
- `ideas.txt` (raíz, sin trackear) es ajeno a esta rama; no se incluye.
