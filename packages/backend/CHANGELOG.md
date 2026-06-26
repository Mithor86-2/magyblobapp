# Changelog

Todos los cambios destacables del paquete `@magyblob/backend` se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Dependencia `zod` (v4) para validación declarativa en capas application/infrastructure
  (no en `/domain`, que conserva cero dependencias externas). (US-44)

### Changed

- Validación de fronteras no fiables migrada de chequeos `typeof` imperativos a esquemas Zod,
  conservando el comportamiento de **sanear, no solo rechazar**: salida del LLM
  (`parseResponse.ts`) y settings JSON (`cloudSettings.ts`, `storyParams.ts`). (US-44)

### Deprecated

### Removed

### Fixed

### Security

## [0.16.0] - 2026-06-24

Git hooks de calidad con Husky + lint-staged (US-36).

### Added

- Git hooks de calidad con Husky + lint-staged (US-36): `pre-commit` corre `lint-staged` (ESLint
  `--fix` en el backend + Prettier sobre lo _staged_) y `pre-push` corre el gate completo
  `pnpm check`. Integración y E2E siguen solo en CI. Dependencias solo de desarrollo.

## [0.15.0] - 2026-06-24

Cobertura estratégica por riesgo de negocio (Strategic Coverage 100/80/0, US-35).

### Added

- **Cobertura estratégica por riesgo de negocio (Strategic Coverage 100/80/0, US-35):** umbrales de
  coverage **por _glob_** en [`vitest.config.ts`](vitest.config.ts) (provider `v8`) — **100%** en el
  tier CORE (`parseResponse`, `FallbackProvider`, `createAIProvider`, `MockProvider`, casos de uso,
  value-objects, entidades de dominio) y **80%** de baseline IMPORTANT. El tier INFRASTRUCTURE
  (interfaces, DTOs, vocabularios) y lo cubierto por otras suites (repos Prisma, ElevenLabs) se
  **excluyen** de la medición. Nuevo script `test:coverage`.
- Tests del tier CORE que faltaban: `parse-response.test.ts` (saneo de la salida del LLM) y
  `entities.test.ts` (invariantes de `Guardian`, `Story`, `Activity`, `InteractionEvent`,
  `StoryNarration`, `AuditLog`); y ramas restantes en value-objects (`equals`), `MockProvider` (es/en),
  `createAIProvider` (hot-swap de actividades), `FallbackProvider` (fallo no-`Error`) y casos de uso.

## [0.14.0] - 2026-06-23

Parámetros del cuento por defecto: temperatura 0.7 y 150–200 palabras (US-18/US-28).

### Changed

- Parámetros del cuento por defecto (US-18/US-28): la **temperatura** baja a **0.7** (seed, migración y
  default de código en `Ollama`/`Cloud`) y la **longitud** sube a **150–200 palabras**
  (`prompt.story.params`, cargado por migración). Se **deja de sembrar** `prompt.story.template` (una
  plantilla fija que hardcodeaba "4 a 6 frases" e **ignoraba** los params): ahora se usa la plantilla
  por defecto de código, que sí respeta longitud, intereses, tono y formato (sigue siendo configurable
  por `AppSetting`). Además se **refuerza la instrucción de longitud** del prompt ("al menos N
  palabras, en varios párrafos") para mejorar el cumplimiento del LLM.

### Deprecated

### Removed

### Fixed

### Security

## [0.13.0] - 2026-06-23

Observabilidad de los prompts de IA (US-34).

### Added

- Observabilidad de IA (US-34): `OllamaProvider` y `CloudProvider` registran a nivel `info` (pino) el
  **prompt enviado** al LLM (system + user), su **configuración resuelta** (plantilla por defecto o de
  `AppSetting`, `params` de longitud/rima/formato, temperatura, modelo, cantidad/categoría) y la
  **respuesta cruda** del modelo, para cuentos y actividades. Se extiende `AILogger` con `info`
  (opcional) y se inyecta el logger en ambos providers. El `MockProvider` no aplica (sin prompts).
  Nota: el prompt incluye el nombre del niño (PII) — desviación asumida, ver
  [cumplimiento-menores.md](../../Docs/cumplimiento-menores.md) (C-5).

### Deprecated

### Removed

### Fixed

### Security

## [0.12.0] - 2026-06-23

Modo cloud activado por defecto (decisión del proyecto; desviación de privacidad asumida).

### Changed

- El modo **cloud pasa a estar ACTIVO por defecto** (US-14): el AppSetting `ai.cloud` se siembra
  `{activo:true, target:'groq', model:'llama-3.3-70b-versatile'}` y se **carga al arrancar** mediante
  una migración de datos idempotente (no pisa cambios del adulto). Sigue siendo conmutable en caliente
  y **sin la API key del target en env cae al modo base** (mock/local), preservando la reproducibilidad
  sin keys. Implica una **desviación de privacidad** documentada en
  [ADR 0002](../../Docs/ADR/0002-tres-modos-de-ia.md) y
  [cumplimiento-menores.md](../../Docs/cumplimiento-menores.md) (C-5).

## [0.11.0] - 2026-06-23

Pruebas de integración contra Postgres real y E2E del backend por HTTP (US-32, Fase 6).

### Added

- Pruebas de **integración de persistencia** contra un PostgreSQL real y efímero (US-32): los ocho
  `Prisma*Repository` (`Guardian`, `ChildProfile`, `Story`, `Activity`, `StoryNarration`,
  `InteractionEvent`, `AuditLog`, `Settings`) se ejercitan con **Testcontainers** aplicando el
  historial real de migraciones, verificando el mapeo ORM↔entidad, las FK, las cascadas
  (`onDelete: Cascade`/`SetNull`), el upsert y los campos JSON/`Bytes`. Suite separada
  (`pnpm --filter @magyblob/backend test:integration`, requiere Docker), fuera del `pnpm test` diario.
- Prueba **E2E del backend** (US-32): el servidor Fastify real (composición de producción) contra un
  PostgreSQL real (Testcontainers) ejercitado por **HTTP real** en modo `mock`, recorriendo el flujo
  del MVP (alta → login → perfil → cuento → historial → actividades) y verificando la persistencia y
  el `AuditLog`. Suite separada (`pnpm --filter @magyblob/backend test:e2e`, requiere Docker).

## [0.10.0] - 2026-06-23

Patrón **Observer** para telemetría y auditoría (US-17): la emisión de eventos se desacopla del
enrutado HTTP mediante un bus de eventos de dominio en proceso.

### Added

- Bus de eventos de dominio (patrón **Observer**): puerto `EventBus` + `DomainEvent` en `domain/events`,
  implementación `InMemoryEventBus` y suscriptores de telemetría/auditoría (`wireDomainEvents`) en
  `infrastructure/events`. Cableado en el composition root (Feature 33, US-17).

### Changed

- Las rutas publican un evento de dominio (`deps.bus.publish(...)`) en vez de construir y guardar
  directamente `InteractionEvent`/`AuditLog`. Desacopla la telemetría/auditoría del enrutado HTTP y
  elimina la duplicación en los 6 handlers; el comportamiento y los datos persistidos no cambian.

## [0.9.0] - 2026-06-22

Análisis estático de calidad con SonarJS (US-31): reglas de bugs y code smells en el gate del lint.

### Added

- Análisis estático de calidad con `eslint-plugin-sonarjs` (US-31): se habilita su configuración
  `recommended` en la flat config de ESLint para detectar bugs y _code smells_ (complejidad
  cognitiva, expresiones idénticas, ramas colapsables…) en el backend, dentro del gate `pnpm lint`.
  Dependencia solo de desarrollo (sin runtime, red ni SDKs de terceros).

### Changed

- Saneo de incidencias `sonarjs/*` en el backend: alternación de combinadores en `sanitizeForSpeech`
  (con supresión justificada de `single-character-alternation`), aserción `toHaveLength` en el test de
  actividades y supresión en línea de `super-linear-regex` en el email de `Guardian`. Reglas
  `todo-tag`, `void-use` y `no-nested-conditional` desactivadas con justificación escrita;
  `no-clear-text-protocols` off solo en tests.

## [0.8.0] - 2026-06-19

Reglas narrativas del cuento (prompt maestro, US-28): estructura, tono y final feliz en el system.

### Changed

- Reglas narrativas del cuento / prompt maestro (US-28): el system prompt de `generateStory`
  (`INSTRUCCION_SEGURIDAD`, **por idioma** ES/EN) incorpora estructura (presentación, situación,
  amigo que ayuda, resolución y enseñanza final), tono tierno, onomatopeyas suaves y final feliz y
  tranquilo. No cambia el contrato HTTP ni la personalización (US-26); solo afecta a `local`/`cloud`.
- El system prompt del cuento ya **no se siembra** en `AppSetting` (US-28): un único texto en
  español pisaba el system por idioma del código y hacía que se escribiera en español aunque el
  perfil fuera `en`. Ahora el system vive solo en código (bilingüe); la plantilla
  (`prompt.story.template`) sigue siendo configurable. Limitación conocida: en `local` con modelos
  pequeños (`gemma:2b`, `llama3.2:3b`) el cuento sale **en español** aunque el perfil sea `en`; el
  inglés de calidad y el cumplimiento pleno de las reglas se obtienen en `cloud` (verificado con
  Groq 70B). Coherente con ADR 0003.

### Fixed

- Idioma del cuento en plantillas configurables (US-28): nuevo valor `{idiomaNombre}`
  (`español`/`inglés`) y plantilla del seed corregida (antes `{idioma}` quedaba como "en"/"es", p.
  ej. "Escríbelo en en", y el modelo a veces escribía en el idioma equivocado).

## [0.7.0] - 2026-06-18

Narración de cuentos con ElevenLabs (US-22): el backend como proxy de TTS.

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
