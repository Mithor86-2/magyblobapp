# Changelog

Todos los cambios destacables del paquete `@magyblob/backend` se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Narración de cuentos (US-22): puerto `TTSProvider` (dominio) y proveedor `ElevenLabsProvider`
  (`POST /v1/text-to-speech/{voice_id}`, modelo `eleven_multilingual_v2`, voz por idioma ES/EN). El
  backend actúa de **proxy** (la `xi-api-key` no sale del servidor). Nueva ruta
  `GET /stories/:id/narration` que devuelve el MP3 como `audio/mpeg`.
- Caché de narración: entidad `StoryNarration` + tabla `story_narrations` (1-1 con `stories`,
  borrado en cascada) y migración `add_story_narration`. El audio se sintetiza una sola vez por
  cuento y se reutiliza (sin gastar créditos en cada reproducción).
- Evento de uso `cuento_narrado` (`InteractionEvent`), registrado solo en la primera síntesis.
- Configuración `tts` (env `ELEVENT_LABS_API`, `ELEVENLABS_MODEL`, `ELEVENLABS_VOICE_ID_ES/_EN`,
  `ELEVENLABS_TIMEOUT_MS`).
- Saneo del texto antes de narrar (`sanitizeForSpeech`): quita emojis y pictogramas para que el
  motor TTS no los lea en voz alta.
- Trazas (pino) de la narración: proveedor, voz, modelo, idioma, texto enviado (tamaño + extracto)
  y respuesta (estado, bytes, ms), más cache hit/miss en la ruta.

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.6.0] - 2026-06-18

Funcionalidad y personalización: prompts personalizados y parámetros del cuento (US-26/US-18).

### Added

- Parámetros configurables del cuento en `AppSetting` (`prompt.story.params`, US-26/US-18): JSON con
  `palabrasMin`, `palabrasMax`, `rima` y `formatos` (lista de `cuento | fabula | poema | adivinanza`).
  En cada generación se **elige un formato al azar** de la lista para dar dinámica, y se inyectan
  longitud y rima en el prompt del cuento. Validado/saneado en `storyParams.ts`; leído por
  `OllamaProvider` y `CloudProvider`; default sembrado. Si la clave falta o es inválida, el cuento
  se genera con el comportamiento de siempre. Sin cambios en el contrato HTTP ni en el modelo de datos.

### Changed

- Prompts de IA más personalizados por niño (US-26): `buildStoryPrompt`/`buildActivitiesPrompt` usan
  ahora los **intereses** del perfil y ajustan el **tono/dificultad por tramo de edad** (2-3 / 4 /
  5-6). Los nuevos valores (`intereses`, `tono`) también están disponibles para las plantillas
  configurables de `AppSetting`. Sin cambios en el contrato HTTP ni en el modelo de datos.

## [0.5.0] - 2026-06-12

Autor del contenido (US-25): proveedor de IA efectivo persistido.

### Added

- Proveedor de IA **efectivo** persistido en `Story` y `Activity` (US-25): cada provider
  (`Mock`/`Ollama`/`Cloud`) estampa su identidad (`mock`/`local`/`cloud`) en el resultado y el
  `FallbackProvider`/`HotSwap` propagan el que realmente sirvió (fallback ⇒ `mock`). Nuevo
  vocabulario `PROVEEDORES_IA`; campo `proveedor` en las entidades, en el esquema Prisma (migración
  `add_proveedor_to_story_activity`, default `mock`) y en `StoryOutput`/`ActivityOutput` (lo
  devuelven `POST /stories`, `POST /activities/recommend` y `GET /profiles/:id/history`).

## [0.4.0] - 2026-06-12

Fase 5.5 (US-19): inicio de sesión ligero del adulto por email.

### Added

- Caso de uso `LoginGuardian` y ruta `POST /guardians/login` (US-19): identificación del adulto
  por email (login ligero, sin contraseña; la autenticación robusta queda fuera del alcance del
  TFM). Devuelve la cuenta si el email existe y `NotFoundError`/404 si no; registra un `AuditLog`
  con `accion=login` en la frontera HTTP. Reutiliza `GuardianRepository.findByEmail` (sin cambios
  de esquema).

### Changed

- El email del adulto se **normaliza** (recorte + minúsculas) en la entidad `Guardian`, y el alta
  y el login normalizan la clave de búsqueda antes de `findByEmail`. Así el login encuentra la
  cuenta y la unicidad del alta se respeta aunque se teclee con mayúsculas o espacios.

## [0.3.0] - 2026-06-12

Feature 14 (US-14): modo de IA `cloud` opt-in, conmutable en caliente desde BD.

### Added

- Modo de IA **`cloud`** (opt-in, OFF por defecto) reintroducido (US-14): `CloudProvider`
  compatible con OpenAI (`POST /chat/completions`, `response_format: json_object`) que sirve a
  cualquier proveedor del mismo dialecto (Groq, Gemini, OpenRouter, Cerebras) vía un registro de
  presets (`cloudPresets.ts`). Selección **conmutable en caliente desde BD** (`AppSetting` clave
  `ai.cloud` = `{activo,target,model}`, validada en `cloudSettings.ts`); las API keys van en
  variables de entorno (`<TARGET>_API_KEY`), nunca en BD. `createAIProvider` resuelve el proveedor
  por petición (`HotSwapAIProvider`) con fallback a mock; `config.cloudApiKeys` lee las keys de env.
  Seed de `ai.cloud` desactivado por defecto. Tests de `CloudProvider`, validación y factoría.
- Smoke test manual `pnpm ai:smoke:cloud` (`scripts/smoke-cloud.ts`): genera contra el proveedor
  cloud real (key en env), verificado contra Groq `llama-3.3-70b-versatile`.

### Changed

- Extraído el parseo/saneo de la salida del LLM a `parseResponse.ts` y las claves de `AppSetting`
  a `AI_SETTING_KEYS` (`prompts.ts`), compartidos por `OllamaProvider` y `CloudProvider` (sin
  cambio de comportamiento del modo local).
- `docker-compose.yml` pasa las API keys de cloud (`GROQ/GEMINI/OPENROUTER/CEREBRAS_API_KEY`,
  vacías por defecto) al backend.

## [0.2.1] - 2026-06-12

### Fixed

- `OllamaProvider` sanea la salida del LLM: `nivel` (entero 1-3) y `duracionMin` (entero 1-60)
  fuera de rango pasan a `undefined`, en vez de propagarse (gemma:2b a veces devuelve, p. ej.,
  `nivel: 1000`).

## [0.2.0] - 2026-06-12

Feature 2 de la Fase 5 (US-07/08/10): historial y progreso.

### Added

- Caso de uso `GetHistory` (cuentos + actividades del perfil, por fecha desc) + ruta
  `GET /profiles/:profileId/history`.
- Caso de uso `MarkStoryRead` (US-07) + ruta `POST /stories/:id/read`.
- Caso de uso `CompleteActivity` (US-10, valoración 1-3) + ruta `POST /activities/:id/complete`
  con `InteractionEvent` `actividad_completada`. Tests de los tres casos de uso + integración.
- `ActivityRepository.findById`; mappers compartidos `toStoryOutput`/`toActivityOutput`.

### Changed

- `PrismaStoryRepository.save` pasa a **upsert** (permite persistir el cambio de estado a
  `leído` sin un método aparte).

## [0.1.0] - 2026-06-11

Primer incremento con seguimiento de changelog (las Fases 0-3 son anteriores a esta
convención). Feature 1 de la Fase 5 (US-09): recomendación de actividades con IA.

### Added

- Caso de uso `RecommendActivities` (genera actividades con `AIProvider`, las persiste y
  aplica **dedup simple por título** frente a las del perfil) + DTOs `RecommendActivitiesRequest`
  / `ActivityOutput`.
- `ActivityRepository` (puerto en `domain`) + `PrismaActivityRepository` (impl PostgreSQL);
  `activities` añadido a `AppDeps` y al composition root.
- Ruta `POST /activities/recommend` con validación por JSON Schema (categoría del vocabulario,
  cantidad 1-5) + test de integración. Test del caso de uso con dobles en memoria.
