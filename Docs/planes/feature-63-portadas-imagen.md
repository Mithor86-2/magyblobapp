# Plan — Feature 63: Portadas de imagen de cuentos y actividades (US-59)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Coordinación del lote en
> [coordinacion-mejoras-paralelo-2.md](coordinacion-mejoras-paralelo-2.md) (F7). Aquí va el **cómo**
> se trocea y ejecuta.
>
> Rama: `feature/63-portadas-imagen` (desde `develop`). Historia: **US-59** (épica B; afecta también
> a actividades, épica C). Depende de **F2** (Activity/schema/ActivityCard) y **F6** (cabeceras), ya
> en `develop`.

## Contexto

Qué existe ya (✅):

- ✅ **Interfaz `AIProvider`** (`generateStory`, `recommendActivities`) en
  [domain/ai/AIProvider.ts](../../packages/backend/src/domain/ai/AIProvider.ts), con `MockProvider`,
  `OllamaProvider`, `CloudProvider` (OpenAI-compat) y `FallbackProvider`.
- ✅ **Preset `gemini`** y `GEMINI_API_KEY` en
  [config.ts](../../packages/backend/src/config.ts) (`config.cloudApiKeys.gemini`) y
  [cloudPresets.ts](../../packages/backend/src/infrastructure/ai/cloudPresets.ts).
- ✅ **Entidades `Story`/`Activity`** + DTOs + mappers + repos Prisma; casos de uso `GenerateStory` y
  `RecommendActivities`.
- ✅ **Patrón de imagen estática por nombre** en la app (F6): `Screen` mapea `headerImageName` a un
  `require` estático ([Screen.tsx](../../packages/app/src/presentation/components/Screen.tsx)).
- ✅ **7 respaldos** en `packages/app/assets/images/story/`: `animales`, `espacio`, `magia`,
  `aventuras`, `musica` (temas) + `aventura`, `divertido` (estilos). Falta `educativo` (estilo): el
  respaldo es **por tema**, así que está cubierto.

Qué falta (❌):

- ❌ La app no muestra ninguna portada ni en cuentos ni en actividades.
- ❌ No hay generación de imagen ni campos `Story.portada` / `Activity.imagen`.

### Decisiones tomadas (lote nº 2, F7 — ya DECIDIDO)

- **Modelo = Gemini/Imagen** (`imagen-4.0-generate-001`), reutiliza `GEMINI_API_KEY`.
- **La app SIEMPRE muestra portada con cero latencia:** imagen generada si existe; si no, respaldo
  local empaquetado por **tema** (mapa estático, `default` si faltara).
- **Generación best-effort:** no bloquea ni rompe la creación del cuento/actividad; si falla o no hay
  clave, el campo queda `null`.
- **Prompt de imagen:** tema/estilo/título, **NUNCA** el nombre del niño (cumplimiento C-5).
- **Almacenamiento:** simple — data URL / base64 en el campo (migrable a bucket después).

## Fase 1 — Andamiaje (docs)

- ✅ US-59 en [epic-b-cuentos.md](../historias-usuario/epic-b-cuentos.md) (Gherkin, ancla `#us-59`).
- ✅ Fila de trazabilidad + listado épica B en [README.md](../historias-usuario/README.md).
- ✅ Este plan.
- ✅ `## [Unreleased]` en CHANGELOG de backend y app.
- ✅ Commit `docs(planes): plan y US-59 de la feature 63 (portadas de imagen)`.

## Fase 2 — Implementación

### Backend (generación opcional con Gemini)

- ❌ `generateImage(prompt: string): Promise<string | null>` en la interfaz `AIProvider` (domain).
  Devuelve una **data URL** (`data:image/png;base64,...`) o `null` si no se pudo generar.
- ❌ Implementaciones:
  - `MockProvider.generateImage` → `null` (sin red; la app usa el respaldo local).
  - `OllamaProvider.generateImage` → `null` (Ollama no genera imágenes).
  - `CloudProvider.generateImage` → delega en el adaptador de imagen Gemini.
  - `FallbackProvider`/`HotSwapAIProvider` → propagan a `generateImage` con la misma política (sin
    clave o error ⇒ `null`, **no** lanza).
- ❌ **Adaptador `GeminiImageProvider`** (infraestructura): `POST {baseUrl}/models/{model}:predict`
  con header `x-goog-api-key`, body `{instances:[{prompt}], parameters:{sampleCount:1}}`; respuesta
  `{predictions:[{bytesBase64Encoded}]}` → data URL. `fetchFn` inyectable (tests sin red). Si no hay
  clave o la respuesta falla, devuelve `null`.
- ❌ **Constructor del prompt de imagen** (`buildImagePrompt(tema, estilo, titulo)`): estilo de
  ilustración infantil + sujeto por tema/estilo/título; **sin** nombre del niño.

### Persistencia y dominio

- ❌ `Story.portada?: string` y `Activity.imagen?: string` (nullable) en entidades + DTOs + mappers.
- ❌ `schema.prisma`: `portada String?` en `Story`, `imagen String?` en `Activity`.
- ❌ **Migración SQL a mano** (`ADD COLUMN ... NULL`) + `prisma generate`.
- ❌ Actualizar [modelo-datos.md](../modelo-datos.md) (erDiagram + nota).

### Cableado (best-effort)

- ❌ `GenerateStory`: tras crear el `Story`, intenta `ai.generateImage(...)` envuelto en try/catch;
  el fallo no rompe la creación. Persistir la portada si llega.
- ❌ `RecommendActivities`: análogo para `imagen` por actividad (sin nombre del niño).
- ❌ Schemas de salida de ruta y schemas Zod de la app (`storySchema`, `activitySchema`) admiten
  `portada`/`imagen` opcionales.

### App (SIEMPRE una portada)

- ❌ Mapa estático `respaldoPorTema` (require por tema) + `default`.
- ❌ Componente/util `portadaSource(generada?, tema)`: usa la generada si existe, si no el respaldo.
- ❌ Render en `StoryReaderScreen`, `StoryGeneratorScreen` y `ActivityCard`.
- ❌ Tipos `Story.portada?` / `Activity.imagen?` en `domain/types.ts`.

### Optimización de assets

- ❌ Optimizar las 7 imágenes de `story/` (~750 KB → ~200-350 KB) con PIL.

### Cumplimiento

- ❌ Documentar en [cumplimiento-menores.md](../cumplimiento-menores.md) que la generación de portada
  con Gemini envía tema/estilo/título (sin datos del niño) a un tercero (C-5); sin clave, solo
  respaldo local.

### Tests

- ❌ Adaptador de imagen Gemini (con `fetchFn` mock, sin red): éxito → data URL; HTTP/JSON malo →
  `null`; sin clave → `null`.
- ❌ Fallback de selección por tema en la app (respaldo correcto por tema y `default`).
- ❌ `GenerateStory` no rompe si `generateImage` lanza/devuelve `null` (cuento se crea igual).

## Definition of Done

- `pnpm install` + `pnpm check` verde (exit 0).
- US-59 + trazabilidad + cumplimiento (C-5) + modelo-datos al día.
- `## [Unreleased]` en backend y app (versión diferida; no se toca `version` en la rama).
- Commits Conventional Commits en español, staging selectivo.
- **Pendiente de validar con clave Gemini real** (la generación solo se ejercita con mock en el gate).
