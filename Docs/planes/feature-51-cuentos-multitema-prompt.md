# Plan — Feature 51: Cuentos mejorados (multi-tema/estilo + prompt + longitud) (US-47)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Coordinación del lote en
> [coordinacion-mejoras-paralelo.md](coordinacion-mejoras-paralelo.md) (feature **F-B**). Aquí va el
> **cómo** se trocea y ejecuta.
>
> Rama: `feature/51-cuentos-multitema-prompt` (desde `develop`, su propio worktree). Historia:
> **US-47** (épica B, generación de cuentos). Combina las mejoras **2.4** (multi-selección) y **2.6**
> (prompt más dinámico/largo) en una sola feature porque ambas reescriben el pipeline de cuentos.

## Contexto

Qué existe ya (✅):

- ✅ **Generación con un solo tema y un solo estilo:** ruta `POST /stories`
  ([routes/stories.ts](../../packages/backend/src/routes/stories.ts)) con `bodySchema` Zod
  (`tema: z.enum(TEMAS)`, `estilo: z.enum(ESTILOS)`), caso de uso
  [GenerateStory](../../packages/backend/src/application/use-cases/GenerateStory.ts) y DTO
  `GenerateStoryRequest`/`StoryOutput` ([application/dto.ts](../../packages/backend/src/application/dto.ts)).
- ✅ **Puerto de IA** [AIProvider](../../packages/backend/src/domain/ai/AIProvider.ts) con
  `GenerateStoryInput { perfil; tema: Tema; estilo: Estilo }`; implementaciones `MockProvider`,
  `OllamaProvider`, `CloudProvider`, `FallbackProvider`.
- ✅ **Prompt configurable y personalizado** (US-26/US-28):
  [prompts.ts](../../packages/backend/src/infrastructure/ai/prompts.ts) (`buildStoryPrompt` interpola
  `tema`/`estilo` individuales, tono por edad, intereses, reglas narrativas, longitud).
- ✅ **Parámetros de longitud/formato** configurables vía `AppSetting prompt.story.params`
  ([storyParams.ts](../../packages/backend/src/infrastructure/ai/storyParams.ts):
  `palabrasMin`/`palabrasMax`/`rima`/`formatos`); seed actual
  ([prisma/seed.ts](../../packages/backend/prisma/seed.ts)) y migración
  `20260623010000_params_cuento_por_defecto` con `palabrasMin:150, palabrasMax:200`.
- ✅ **App — generador con chip único:**
  [StoryGeneratorScreen.tsx](../../packages/app/src/presentation/screens/StoryGeneratorScreen.tsx)
  con `useState<Tema>`/`useState<Estilo>` (selección única) y `SelectableChip`; gateway
  `api.stories.generate({ profileId, tema, estilo })`
  ([domain/gateways.ts](../../packages/app/src/domain/gateways.ts),
  [infrastructure/http.ts](../../packages/app/src/infrastructure/http.ts),
  [infrastructure/schemas.ts](../../packages/app/src/infrastructure/schemas.ts)).

Qué falta (❌):

- ❌ **No se puede elegir más de un tema ni más de un estilo** (UI y contrato son singulares).
- ❌ **El prompt no combina** varios temas/estilos en una lista legible.
- ❌ **El límite de palabras** (`palabrasMax`) se queda corto para un cuento "más desarrollado".

### Decisiones tomadas (con el usuario / coordinación del lote)

- **SIN migración Prisma** (decisión anti-conflicto del lote, F-C es la única que migra). El cuento
  sigue persistiendo en las columnas actuales de `Story` (`tema`/`estilo` **singulares**): se guarda
  un valor **representativo** de la selección (p. ej. el primero de cada lista). No se añaden columnas
  ni se toca [schema.prisma](../../packages/backend/prisma/schema.prisma) ⇒ tampoco
  [modelo-datos.md](../modelo-datos.md).
- **Contrato en arrays:** la ruta y `GenerateStoryInput` pasan a `temas: Tema[]` / `estilos: Estilo[]`
  (no vacíos). Singular → plural; sin compatibilidad hacia atrás (cliente y servidor en el monorepo).
- **Prompt:** `buildStoryPrompt` interpola la **lista legible** de temas y estilos, conservando las
  reglas narrativas (US-28) y la personalización (US-26).
- **Longitud:** subir `palabrasMax` en `storyParams.ts` (default en código) y en el seed
  `prompt.story.params`; **sin migración** (el seed se aplica en `pnpm db:seed`; la migración de datos
  existente no se reescribe en esta rama para no chocar con F-C).
- **App:** chips de **selección múltiple** (toggle), validando ≥1 tema y ≥1 estilo antes de generar.

## Historias cubiertas

- **US-47 — Cuentos mejorados: multi-tema/estilo, prompt más rico y mayor longitud**
  ([épica B](../historias-usuario/epic-b-cuentos.md#us-47)) — amplía
  [US-03](../historias-usuario/epic-b-cuentos.md#us-03) y
  [US-28](../historias-usuario/epic-b-cuentos.md#us-28).

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha. Cada fase: **crear/ajustar test → `pnpm check` verde
→ actualizar docs** (regla del DoD). Andamiaje actual: solo plan + historia + CHANGELOG (sin código).

### Fase 0 — Andamiaje (plan, US-47, CHANGELOG) ✅

- ✅ Historia **US-47** en [epic-b-cuentos.md](../historias-usuario/epic-b-cuentos.md#us-47) con
  criterios Gherkin; fila en la trazabilidad de [README.md](../historias-usuario/README.md) y en el
  listado de la épica B.
- ✅ Este plan en `Docs/planes/`.
- ✅ `## [Unreleased]` con los 6 grupos Keep a Changelog en `packages/backend/CHANGELOG.md` y
  `packages/app/CHANGELOG.md` (la feature toca ambos paquetes).

### Fase 1 — Dominio + contrato a arrays (backend) ❌

- ❌ `GenerateStoryInput` en [AIProvider.ts](../../packages/backend/src/domain/ai/AIProvider.ts):
  `tema: Tema` → `temas: Tema[]`; `estilo: Estilo` → `estilos: Estilo[]` (ambos no vacíos por
  contrato; el caso de uso valida).
- ❌ DTO `GenerateStoryRequest` en [dto.ts](../../packages/backend/src/application/dto.ts): `temas`,
  `estilos` (arrays de string que el caso de uso valida contra el vocabulario).
- ❌ `bodySchema` en [routes/stories.ts](../../packages/backend/src/routes/stories.ts):
  `temas: z.array(z.enum(TEMAS)).min(1)`, `estilos: z.array(z.enum(ESTILOS)).min(1)` (rechaza lista
  vacía y valores fuera de vocabulario).
- ❌ `GenerateStory` ([GenerateStory.ts](../../packages/backend/src/application/use-cases/GenerateStory.ts)):
  valida cada elemento (`esTema`/`esEstilo`), invoca `ai.generateStory({ perfil, temas, estilos })` y
  **persiste un valor representativo** en `Story.tema`/`Story.estilo` (el primero de cada lista) —
  sin migración.
- **Tests (caso de uso):** `GenerateStory.test.ts` — genera con varios temas/estilos (in-memory + mock
  provider); rechaza listas vacías o valores inválidos (`DomainError`); persiste el representativo.

### Fase 2 — Prompt con lista legible + longitud (backend) ❌

- ❌ `buildStoryPrompt` en [prompts.ts](../../packages/backend/src/infrastructure/ai/prompts.ts):
  interpolar **lista legible** de `input.temas` y `input.estilos` (helper tipo `listaLegible(items,
  idioma)` → "animales y magia" / "animals and magic"); placeholders `{tema}`/`{estilo}` →
  `{temas}`/`{estilos}` en los valores de plantilla; conservar reglas narrativas (US-28),
  `tonoPorEdad`, intereses (US-26) y el bloque de `instruccionFormato`.
- ❌ Subir `palabrasMax` (más desarrollo narrativo) en
  [storyParams.ts](../../packages/backend/src/infrastructure/ai/storyParams.ts) (default en código) y
  en el seed `prompt.story.params` de [prisma/seed.ts](../../packages/backend/prisma/seed.ts). **Sin
  migración Prisma** (no se reescribe `20260623010000_*`).
- ❌ Ajustar `MockProvider`/`Ollama`/`Cloud` y `FallbackProvider` a la nueva firma `temas`/`estilos`
  (la mock mantiene salida determinista válida).
- **Tests (prompt + provider/gateway de IA):** `prompts.test.ts` — el prompt ES/EN incluye la lista
  legible de varios temas/estilos y respeta `palabrasMin/Max`; `MockProvider.test.ts` /
  `fallback-provider.test.ts` siguen verdes con la firma de arrays.

### Fase 3 — Endpoint ❌

- ❌ Test de integración de `POST /stories`
  ([test/](../../packages/backend/test/)): acepta `temas`/`estilos` (arrays), 201 con cuento;
  400 ante lista vacía o valor fuera de vocabulario (validación Zod en frontera).

### Fase 4 — App: chips multi-selección + gateway ❌

- ❌ Tipos/gateway app: `api.stories.generate` pasa `temas: Tema[]` / `estilos: Estilo[]`
  ([domain/types.ts](../../packages/app/src/domain/types.ts),
  [domain/gateways.ts](../../packages/app/src/domain/gateways.ts)); adaptador
  [infrastructure/http.ts](../../packages/app/src/infrastructure/http.ts) y validación de respuesta
  [infrastructure/schemas.ts](../../packages/app/src/infrastructure/schemas.ts).
- ❌ [StoryGeneratorScreen.tsx](../../packages/app/src/presentation/screens/StoryGeneratorScreen.tsx):
  `useState<Tema[]>`/`useState<Estilo[]>` con toggle por chip (`SelectableChip` ya soporta
  `selected`); botón "Generar" deshabilitado / con aviso si no hay ≥1 tema y ≥1 estilo; `trackAction`
  con los arrays.
- **Tests (componente/gateway app):** test user-centric de `StoryGeneratorScreen` (toggle de varios
  chips, no genera sin selección) y del gateway `stories.generate` (envía arrays).

### Fase 5 — Docs + cierre ❌

- ❌ Marcar fases en este plan y `phases.md` si procede; nota en
  [memory.md](../memory.md)/[lecciones-aprendidas.md](../lecciones-aprendidas.md) si surge un gotcha.
- ❌ **No** se toca `modelo-datos.md` (sin cambios de esquema) ni `cumplimiento-menores.md` (sin
  red/SDK/dato nuevo del menor: el cuento sigue minimizado).
- ❌ Cierre con la skill `cerrar-feature` (gate verde → versionado **diferido** vía `versionar` al
  integrar en `develop`, CHANGELOG en ambos paquetes, pruebas con el usuario → confirmación →
  `finish`).

## Definition of Done

- `pnpm check` verde (typecheck + lint + format + tests) tras cada fase.
- Tests nuevos co-localizados: caso de uso `GenerateStory`, prompt, endpoint `POST /stories`,
  componente `StoryGeneratorScreen` y gateway `stories.generate`.
- US-47 creada + trazabilidad en [historias-usuario/README.md](../historias-usuario/README.md) (hecho
  en Fase 0).
- **Sin** migración Prisma; `modelo-datos.md` intacto. CHANGELOG por paquete al integrar.
- Pruebas con el usuario antes del cierre; `finish` solo tras confirmación explícita.
