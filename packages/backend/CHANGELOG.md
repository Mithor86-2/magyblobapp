# Changelog

Todos los cambios destacables del paquete `@magyblob/backend` se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.10.2] - 2026-07-06

### Fixed

- Envío de email de verificación (US-93) fallaba con `ENETUNREACH`/`ETIMEDOUT` en PaaS sin salida
  IPv6 (p. ej. Render): nodemailer 9 resolvía el host SMTP a IPv4 **e** IPv6 y elegía una al azar.
  Ahora `SmtpEmailService` resuelve el registro A (IPv4) y conecta contra esa IP (con `tls.servername`
  para validar el certificado), evitando cualquier intento por IPv6. Desbloquea el alta de guardián en
  producción cuando hay SMTP configurado.

### Security

## [1.10.1] - 2026-07-06

### Security

- Forzadas versiones parcheadas de transitivos de dev/build vulnerables (Dependabot) vía `overrides`
  en `pnpm-workspace.yaml`: `esbuild ≥0.28.1` (vía `tsx`) y `@hono/node-server ≥1.19.13` (vía la CLI
  de Prisma). Sin exposición en producción; detalle en
  [Docs/planes/deps-vulnerabilidades.md](../../Docs/planes/deps-vulnerabilidades.md).

## [1.10.0] - 2026-07-04

### Added

- Verificación de titularidad del email por OTP (US-93): con SMTP configurado, el alta
  (`POST /guardians`) crea la cuenta como no verificada, envía un código de 6 dígitos (hash bcrypt,
  caducidad 10 min, máx. 5 intentos) y **no** emite sesión; `POST /guardians/verify-email` valida el
  código y emite los tokens, y `POST /guardians/resend-verification` reenvía con cooldown. Sin SMTP el
  paso se omite (auto-verificado + auto-login, arranque reproducible intacto). Servicio de email SMTP
  (`nodemailer`) cableado solo si hay credenciales; el correo solo transporta email del adulto + código
  (sin PII del menor). Refuerza C-1/C-10 (C-17).
- Puerta parental server-side en el alta (US-92): `GET /guardians/challenge` emite un reto
  aritmético firmado (HMAC con el secreto JWT, con caducidad) y `POST /guardians` exige
  `challengeToken` + `challengeRespuesta` correctos antes de crear la cuenta. Sin terceros ni estado
  en BD (privacy-by-design, C-2/C-6).

### Changed

### Deprecated

### Removed

### Fixed

### Security

- Rate limiting en los endpoints de autenticación (US-92): `@fastify/rate-limit` aplicado a
  `POST /guardians`, `POST /guardians/login` y `POST /guardians/refresh` (429 al superar el umbral),
  con `trustProxy` para contar por IP real tras el proxy de Render/Cloudflare. Frena fuerza bruta,
  credential stuffing y alta masiva.
- Cabeceras de seguridad HTTP con `@fastify/helmet` y política CORS con allowlist
  (`@fastify/cors`): sin orígenes configurados, se deniega cualquier origen cross-site en producción.

## [1.9.3] - 2026-07-03

### Added

- **`/health` expone `version`.** La respuesta incluye ahora `version` (del `package.json`), para que
  el **smoke post-deploy** verifique que Render sirve la versión esperada (no una instancia vieja tras
  un deploy fallido). Cierra el hueco que dejó pasar el crash de v1.9.0/v1.9.1 a producción, junto con
  el nuevo **smoke de arranque del backend en CI** (levanta la imagen como Render y comprueba `/health`)
  y el **workflow `Smoke post-deploy (Render)`**. Ver Docs/analisis-pruebas-cicd.md.

## [1.9.2] - 2026-07-03

### Fixed

- **Producción no arrancaba en Render tras Prisma 7 (build OK, runtime KO).** El generador
  `prisma-client` emitía imports con extensión `.ts` (no determinista, distinto que en local) que
  `tsc` no reescribe: el `dist/generated/prisma/client.js` importaba `./enums.ts` (inexistente en
  runtime) → `node dist/index.js` crasheaba con `ERR_MODULE_NOT_FOUND` y el deploy de Render fallaba
  (v1.9.0/v1.9.1). Se fija `importFileExtension = "js"` en el generador (`schema.prisma`) → imports
  `.js` que resuelven en runtime y, bajo tsc/vitest (NodeNext), mapean al `.ts` fuente. Verificado
  arrancando la imagen (`Server listening` + `/health` 200). Nuevo **smoke de runtime en CI** (importa
  el cliente compilado dentro de la imagen) para cazar esta clase de fallo build-ok/runtime-ko.

## [1.9.1] - 2026-07-03

Sin cambios en el backend; versión unificada del monorepo (patch con fixes de crash en el app).

## [1.9.0] - 2026-07-02

### Added

### Changed

- **Migración a Prisma 7 (chore/prisma-7).** Actualiza `@prisma/client` y `prisma` a 7.x
  (emparejados; Dependabot había subido solo el cliente y rompió el CI). Se adopta el nuevo generador
  Rust-free `prisma-client` (ESM, `moduleFormat = "esm"`, salida `.ts` que compila `tsc` → se elimina
  el `cp` del build). La conexión ya no vive en `datasource.url` del schema: se usa el **driver
  adapter** `@prisma/adapter-pg` (sobre `pg`) en `createPrismaClient`, y la URL de Migrate se declara
  en el nuevo `prisma.config.ts` (desde `DATABASE_URL`). El `Dockerfile` copia `prisma.config.ts` en
  build y runtime. Imports del cliente movidos de `generated/prisma/index.js` a `.../client.js`.
  Validado: gate + coverage + integración (30) + e2e (3) + build de imagen, todo en verde.

### Deprecated

### Removed

### Fixed

### Security

## [1.8.0] - 2026-07-02

### Security

- **Vitest 2 → 3 (chore/vitest-3).** Actualiza `vitest` y `@vitest/coverage-v8` a `^3.2.6`, cerrando
  la vulnerabilidad **crítica** de Vitest (`<3.2.6`, lectura/ejecución de ficheros con el UI server
  activo) y parte de los transitivos. Solo afecta a tooling de test (`devDependencies`); no llega a la
  imagen de producción (`pnpm deploy --prod`). Gate y umbrales de coverage siguen en verde sin cambios
  de configuración. Residuos dev-only (vite/esbuild vía vitest y tsx) se difieren a Dependabot.

## [1.7.0] - 2026-07-02

### Changed

- **Actividades: trato con nombre también en IA real (US-77, ajuste).** El seed
  `prompt.activity.system` (v6) instruye usar el trato del adulto EXACTAMENTE como se indica, con su
  nombre ("mamá Ana", "abuela Ana"), y el ejemplo lo incluye; antes la IA real descartaba el nombre.
- **Continuar la historia: título numerado (US-78, ajuste).** `ContinueStory` deriva el título del
  cuento origen incrementando el número de capítulo ("Joaquín en el bosque" → "… 2" → "… 3") con la
  función `siguienteTitulo`, en vez de usar el título que invente la IA.

### Added

- **Continuar la historia (US-78).** Nuevo caso de uso `ContinueStory` y ruta
  `POST /stories/:id/continue` que genera un **capítulo nuevo** de un cuento existente: pasa el cuerpo
  del cuento origen como contexto al `AIProvider`, hereda tema/estilo/enseñanza y persiste un `Story`
  nuevo **enlazado** al original (`Story.continuacionDe`, columna `continuacionDe` TEXT nullable,
  migración; solo BD, no en el DTO). Reutiliza la portada del origen. `MockProvider` produce una
  continuación determinista (ES/EN). Publica `cuento_generado`.
- **Opción de usar el nombre del niño en el cuento (US-76).** `POST /stories` acepta `usarNombre?`
  (Zod, por defecto `true`); si es `false`, el prompt usa un protagonista genérico ("nuestro pequeño
  amigo" / "our little friend") y pide no inventar un nombre propio (menos PII enviada al proveedor).
  `MockProvider` refleja el protagonista genérico.
- **Logros / recompensas del niño (US-68).** Catálogo de logros en el dominio
  (`domain/logros.ts`: cuentos leídos, actividades completadas, racha de días y explorar temas),
  entidad `Achievement` + repo, caso de uso `GetAchievements` (read-model calculado que reconcilia e
  idempotentemente persiste los desbloqueos) y ruta `GET /profiles/:id/achievements`. Nueva tabla
  `achievements` (migración, cascada por perfil). Todo local, sin PII nueva.
- **Cuento a la carta: enseñanza opcional (US-69).** Vocabulario cerrado `ENSENANZAS`
  (`amistad | emociones | valentia | honestidad`); `POST /stories` acepta `ensenanza?` (Zod), el
  prompt la refuerza (ES/EN, `MockProvider` determinista) y se persiste en `Story.ensenanza`
  (`String?`, migración) devolviéndose en `StoryOutput`.

### Changed

- **Páginas del cuento con al menos 3 frases (US-75).** El system prompt de `generateStory` (ES/EN y
  seed `prompt.story.system` v4) pide que cada página sea un párrafo autoconclusivo de **≥3 frases**
  (antes "un párrafo breve"); el cuerpo del `MockProvider` se amplía a ≥3 frases por página, sin
  romper el mínimo de ≥4 páginas (US-74).
- **Trato al adulto por parentesco + nombre en actividades (US-77).** `terminoCuidador` combina el
  trato con el nombre del adulto de la sesión ("mamá Ana", "abuela/o Ana"); `RecommendActivities` pasa
  `guardian.nombre` al `AIProvider` y el prompt/mock lo usan. Sin nombre (anónimo) → trato genérico.
- **"Realizado" sin valoración obligatoria (US-72).** `Activity.completar` acepta la valoración como
  **opcional** (solo valida 1-3 si viene) y `POST /activities/:id/complete` la admite ausente; el
  estado "hecha" se rige por `completadaEn` (coherente con cómo se cuentan las actividades completadas
  para los logros). Sin migración: `valoracion` y `completadaEn` ya eran nullable.

### Deprecated

### Removed

### Fixed

- `PrismaActivityRepository` **persiste `creadoEn`** al guardar (como `PrismaStoryRepository`), en vez
  de depender del `@default(now())`: corrige el round-trip del test de integración que se rompió al
  añadir `creadoEn` (US-61). Cobertura CORE del backend restaurada al 100% con tests (US-72).

### Security

## [1.6.0] - 2026-07-01

### Added

- Configuración del app (`AppSetting`) declarada en `prisma/app-settings.json` (fuente única, sin
  secretos) con **sync versionado** a la BD: cada clave lleva una `version` y el sync solo crea las
  ausentes o reescribe cuando la versión del JSON es mayor, sin pisar los cambios hechos en caliente
  (p. ej. `ai.cloud`). Corre en el **arranque** del backend y con `pnpm config:sync`; las claves de la
  BD ausentes del JSON se conservan (huérfanas, se loguean). Nueva columna `AppSetting.version`
  (migración). El `seed` pasa a delegar en el mismo mecanismo (US-70).

## [1.5.0] - 2026-07-01

### Added

### Changed

- Prompt de recomendación de actividades más significativo para niños de 2-6 años: pide instrucciones
  de al menos 6 pasos numerados y detallados, un objetivo de aprendizaje y materiales sencillos de
  casa (ES y EN). La plantilla configurable `prompt.activity.template` (seed) se alinea con el nuevo
  default y el `MockProvider` emite siempre ≥6 pasos (US-67).
- Las instrucciones de las actividades se dirigen al adulto acompañante por su **parentesco** (el
  guardián con sesión: "mamá", "papá", "la abuela o el abuelo"…) en vez de "el adulto"; sin parentesco
  (p. ej. modo anónimo) se usa un trato genérico. El caso de uso `RecommendActivities` resuelve el
  parentesco desde el `GuardianRepository` (US-67).

### Deprecated

### Removed

### Fixed

### Security

## [1.4.1] - 2026-06-28

### Added

- Estándar de documentación **_enforced_** (US-65): la regla de lint `jsdoc/require-jsdoc`
  (`eslint-plugin-jsdoc`) exige un bloque de documentación en los **exports públicos** del backend
  (clases y funciones exportadas), integrada en el gate `pnpm check`. Se activa solo `require-jsdoc`
  (no el preset completo) porque la convención del proyecto es **prosa en español**, no TSDoc formal.
  Documentados los 14 exports que faltaban (mappers de salida, type-guards de vocabulario/cloud/formato,
  `parseStory`/`parseActivities`, `buildStoryPrompt`/`buildActivitiesPrompt`) y añadidas cabeceras de
  módulo a las rutas (`profiles`, `stories`, `anonymous`, `activities`).

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.4.0] - 2026-06-28

### Added

- US-63: **favoritos** de cuentos y actividades. Campo `favorito` (booleano, por defecto `false`) en
  las entidades `Story` y `Activity` y en el esquema Prisma (columna `favorito BOOLEAN NOT NULL
DEFAULT false` en `stories` y `activities`, migración). Casos de uso idempotentes
  `SetStoryFavorite` / `SetActivityFavorite` y rutas protegidas `POST /stories/:id/favorite` y
  `POST /activities/:id/favorite` con body Zod `{ favorito: boolean }` que devuelven el
  cuento/actividad actualizado. `favorito` se expone en `StoryOutput` / `ActivityOutput` (lo
  consume el historial).

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.3.0] - 2026-06-27

### Added

- US-61: `creadoEn` (ISO string) en `StoryOutput` y `ActivityOutput` (lo consumirá la app para mostrar
  la fecha de generación). La entidad `Activity` gana `creadoEn` para poder mapearlo.
- US-61: persistencia del **prompt usado** (system + user) por cuento/actividad. `GeneratedStory` y
  `GeneratedActivity` ganan `prompt`; los proveedores (`Mock`/`Ollama`/`Cloud`) lo devuelven y el
  `FallbackProvider` propaga el del proveedor efectivo. Columna `prompt` TEXT **nullable** en `stories`
  y `activities` (migración Prisma). **No** se expone en el DTO público (solo BD); el modo anónimo no
  persiste nada.

### Changed

- US-61: el prompt de actividades (`buildActivitiesPrompt`, ES y EN) pide ahora un paso a paso de
  **3 a 6 pasos** numerados (antes "2 a 4"); el `MockProvider` rellena 3–6 pasos.

### Deprecated

### Removed

### Fixed

### Security

## [1.2.2] - 2026-06-27

### Fixed

- Portadas (US-59): `RecommendActivities` deja de generar la imagen de las actividades (se elimina la
  llamada best-effort a `generateImage`); las portadas por imagen quedan solo para cuentos
  (`GenerateStory`). La columna `Activity.imagen` queda nullable y en desuso (sin migración nueva).

## [1.2.1] - 2026-06-27

### Added

- Script on-demand `prompts:dump` (`pnpm --filter @magyblob/backend prompts:dump`) que recorre un
  conjunto representativo de combinaciones (cada tema y estilo, ES/EN, 1-2 edades), construye los
  prompts reales (`buildStoryPrompt`/`buildActivitiesPrompt`/`buildImagePrompt`) y obtiene el resultado
  real llamando a Groq (cuentos/actividades) y Gemini (portadas), volcándolo a `Docs/muestra-prompts.md`.
  Requiere `GROQ_API_KEY` y `GEMINI_API_KEY`; no entra en el gate (US-60).

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.2.0] - 2026-06-27

### Added

- Portadas de imagen de cuentos y actividades (US-59): la interfaz `AIProvider` gana
  `generateImage(prompt)` y un adaptador **Gemini/Imagen** (`imagen-4.0-generate-001`, endpoint
  `:predict`) que usa `GEMINI_API_KEY` (`config.cloudApiKeys.gemini`); sin clave o ante cualquier
  fallo devuelve `null` (no lanza). Los casos de uso `GenerateStory` y `RecommendActivities` generan
  la imagen de forma **best-effort** (try/catch): si falla o no hay clave, el campo queda `null` y la
  creación del cuento/actividad se completa igual. Se añaden los campos nullable `Story.portada` y
  `Activity.imagen` (entidad + DTO + mapper + `schema.prisma` + migración SQL `ADD COLUMN ... NULL`).
  El prompt de imagen se construye con tema/estilo/título y **nunca** con el nombre del niño
  (cumplimiento C-5).

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.1.0] - 2026-06-26

### Added

- Endpoint `GET /settings/tts/voices`: expone la voz de narración configurada por idioma (ES/EN), el
  modelo y si hay clave de ElevenLabs, sin revelar la `xi-api-key` ni llamar al proveedor (US-55).
- Test del `ElevenLabsProvider` que verifica la selección de voz por idioma del cuento (US-55).

### Changed

- Validación más estricta de la entrada del alta (US-53): el **email** se valida con
  `z.string().email()` (rechazo `400` temprano ante formato inválido; el `409` por email duplicado se
  mantiene) y la **contraseña** exige **≥8 caracteres con al menos una letra y un número**,
  sincronizada con la validación de la app.
- Documentadas las variables `ELEVENLABS_VOICE_ID_ES`/`_EN` en `.env.example` (cómo obtener un
  `voice_id` y qué voz _premade_ multilingüe se usa por defecto en cada idioma) y aclarados los
  defaults en `config.ts` (US-55).
- Contenido IA (US-54): campo de dominio **`Activity.instrucciones`** (paso a paso de la actividad)
  que recorre entidad → `prisma/schema.prisma` (columna `instrucciones TEXT NULL` + migración) →
  `parseResponse` (schema Zod) → `GeneratedActivity` → `ActivityOutput` (DTO) → `mappers` →
  `RecommendActivities`. El `MockProvider` rellena instrucciones deterministas y el prompt de
  actividades pide un paso a paso.
- Contenido IA (US-54): el prompt del cuento (ES/EN) pide **variar el título** en cada generación y
  el `MockProvider` deja de usar el título fijo `"{nombre} y la aventura de {tema}"` por una
  variación elegida de forma determinista según el contenido del cuento.

## [1.0.0] - 2026-06-26

Primer release de producción. Backend desplegado en **Render** (Docker) con PostgreSQL en **Neon** e
IA cloud en **Groq**, verificado de extremo a extremo contra producción (`/health` y generación de
cuento real). Hito de versión: consolida el trabajo de las versiones 0.x; sin cambios de código
respecto a la 0.21.0.

## [0.21.0] - 2026-06-26

### Added

- Ambiente de producción guiado (US-51): **`render.yaml`** en la raíz (Blueprint IaC de Render) que
  despliega el backend como _web service_ Docker con `dockerfilePath: packages/backend/Dockerfile`,
  `dockerContext: .` (contexto = raíz del repo), `branch: main`, `healthCheckPath: /health`, región
  Frankfurt y plan free. Los secretos (`DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`) van con
  `sync: false` (se introducen en el panel, nunca en el repo); el resto (`NODE_ENV=production`,
  `AI_PROVIDER=mock`, TTLs, timeouts) con valor fijo. Las migraciones Prisma corren solas al arrancar
  vía el `CMD` del Dockerfile (`prisma migrate deploy && node dist/index.js`). Ollama no va a
  producción (plan free sin GPU); la IA real se obtiene con el modo cloud (Groq). Guía reproducible
  en `Docs/despliegue.md` (Neon PG16 con `sslmode=require` y host `-pooler`, Render, Groq, cold start
  del plan free, probar antes contra una rama de Neon). Solo infra/docs: no cambia el runtime ni el
  arranque reproducible local (`docker compose up`).
- Modo anónimo efímero (US-50): casos de uso `GenerateStoryAnonymous` y
  `RecommendActivitiesAnonymous` que generan contenido **sin persistir nada** y sin pedir
  `profileId` ni nombre de niño (solo edad, idioma y temas/estilos o categoría/cantidad).
- Rutas **públicas** `POST /stories/anonymous` y `POST /activities/recommend/anonymous` (sin el
  decorador `authenticate`), validadas con Zod, con **rate-limit en memoria** (3 cuentos + 3
  actividades por cliente; sin dependencia nueva) que responde **429** al superarlo.
- Error de aplicación `TooManyRequestsError` (HTTP 429) para el límite del modo anónimo.

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.20.0] - 2026-06-26

### Added

- Validación de la configuración por variables de entorno con un **esquema Zod** (`config.ts`,
  US-46): `loadConfig` parsea/normaliza cada variable (coerción de `PORT`/timeouts a entero positivo,
  `AI_PROVIDER` restringido a `mock|local`, recorte de cadenas) y, en `NODE_ENV=production`, **exige
  `DATABASE_URL`** presente y no vacía, fallando al arrancar con un mensaje claro (`ConfigError` +
  `z.prettifyError`, indicando qué variable falta o está mal). `index.ts` aborta el proceso
  (`exit 1`) imprimiendo el detalle antes de levantar el servidor. Tests ampliados (defaults dev,
  override, normalización de tipos, fallo en producción). Zod ya estaba disponible (US-44); no se
  añade dependencia.

### Changed

- El secreto JWT inseguro/vacío sigue **degradando al default de desarrollo**, pero ahora emite un
  **WARNING** explícito (no es un error fatal, ni en producción): preserva el arranque reproducible
  (`docker compose up`, que corre con `NODE_ENV=production` y `JWT_SECRET` vacío por defecto). La
  validación estricta se reserva a variables genuinamente requeridas (`DATABASE_URL`) y a los
  formatos (enums, números). (US-46)
- Cuentos mejorados (US-47): `POST /stories` acepta **listas** `temas`/`estilos` (multi-selección)
  validadas en frontera con Zod (`z.array(z.enum(...)).min(1)`) y en el caso de uso `GenerateStory`
  (no vacío, sin duplicados, vocabulario cerrado). El prompt (`buildStoryPrompt`) interpola la lista
  legible de temas y estilos en español ("animales y espacio") e inglés ("animals and space"),
  conservando reglas narrativas (US-28), tono por edad e intereses (US-26).
- Firma de la capa de IA a arrays (US-47): `GenerateStoryInput` pasa de `tema`/`estilo` a
  `temas: Tema[]`/`estilos: Estilo[]`, igual que `GenerateStoryRequest`. Se sube el límite de
  longitud del cuento en el seed `prompt.story.params` de `150-200` a **`200-350`** palabras (cuento
  más desarrollado, en varios párrafos). **Sin migración Prisma**: la entidad `Story` mantiene sus
  columnas singulares `tema`/`estilo` y se persiste un valor representativo (el primero de cada
  lista). Las plantillas configurables siguen aceptando `{tema}`/`{estilo}` como alias de la lista.
- Contraseña en la cuenta del adulto (US-48): puerto de dominio `PasswordHasher` y su adaptador
  `BcryptPasswordHasher` (sobre `bcryptjs`, JS puro), campo `passwordHash` en la entidad `Guardian`
  y en `prisma/schema.prisma` con su migración. `RegisterGuardian` deriva y guarda el hash en el
  alta. Nuevo campo `password` validado por Zod (mínimo 8 caracteres en el alta) en `POST /guardians`
  y `POST /guardians/login`.
- `LoginGuardian` deja de ser identificación ligera por email y **verifica la contraseña** contra el
  `passwordHash` del `Guardian` (US-48); credencial inválida devuelve un `401` genérico
  (`InvalidCredentialsError`) que no distingue email inexistente de contraseña errónea.

### Security

- La contraseña del adulto se almacena solo como hash (bcrypt/argon2) y **nunca** se persiste, se
  devuelve ni se registra en logs/`AuditLog` (US-48). Revierte la postura "sin contraseña" (C-10).

## [0.19.0] - 2026-06-26

### Added

- `.gitattributes` con `merge=union` para los `CHANGELOG.md` (raíz y por paquete): los apéndices
  concurrentes bajo `## [Unreleased]` se auto-fusionan al mergear en paralelo, sin marcadores de
  conflicto. Nueva skill de repo `versionar` (fuente única del versionado diferido) y doc
  `Docs/trabajo-en-paralelo.md` con el protocolo de worktrees y las recetas de conflicto.

### Changed

- **Versionado diferido al merge** (proceso): la rama de feature ya no sube `version`; solo acumula
  entradas bajo `## [Unreleased]`. El número SemVer y el fechado del CHANGELOG se asignan al integrar
  en `develop` (post-merge), serializando la operación y eliminando la colisión de versión entre
  features en paralelo. `CLAUDE.md` y la skill `cerrar-feature` ahora delegan el versionado en la
  skill `versionar`.

## [0.18.0] - 2026-06-26

### Added

- Dependencia `@fastify/jwt` (v10) y módulo `auth.ts`: autenticación de la sesión del
  guardián con JWT (US-45). El login emite un **access token** corto y un **refresh
  token** largo (secreto único, distinguidos por el claim `type`); decorador
  `authenticate` (hook `onRequest`) que protege las rutas de datos. (US-45)
- Ruta `POST /guardians/refresh`: renueva el access token a partir de un refresh token
  válido (200) o responde 401 si es inválido/expirado o no es de tipo refresh. (US-45)
- Configuración de autenticación en `config.ts` (`auth`): `JWT_SECRET`, `JWT_ACCESS_TTL`
  (def. `15m`) y `JWT_REFRESH_TTL` (def. `7d`), con defaults solo de desarrollo; cableadas
  en `.env.example` y `docker-compose.yml`. (US-45)

### Changed

- `POST /guardians/login` y `POST /guardians` (auto-login tras el alta) ahora devuelven,
  además del `Guardian`, `accessToken` y `refreshToken` para iniciar la sesión
  autenticada. (US-45)

### Deprecated

### Removed

### Fixed

### Security

- Las rutas que operan sobre datos del guardián y del perfil
  (`GET /guardians/:id/profiles`, `POST /profiles`, `POST /stories`,
  `POST /stories/:id/read`, `GET /stories/:id/narration`, `POST /activities/recommend`,
  `POST /activities/:id/complete`, `GET /profiles/:id/history`) exigen un access token
  válido y responden **401** sin él. Públicas: `GET /health`, `POST /guardians`,
  `POST /guardians/login`, `POST /guardians/refresh`. El secreto JWT va en variables de
  entorno, nunca en BD. (US-45)

## [0.17.0] - 2026-06-25

### Added

- Dependencia `zod` (v4) para validación declarativa en capas application/infrastructure
  (no en `/domain`, que conserva cero dependencias externas). (US-44)
- Dependencia `fastify-type-provider-zod` (v7) para validar la entrada HTTP de las rutas con
  Zod e inferir el tipo del cuerpo desde el esquema (single source of truth). (US-44)

### Changed

- Validación de fronteras no fiables migrada de chequeos `typeof` imperativos a esquemas Zod,
  conservando el comportamiento de **sanear, no solo rechazar**: salida del LLM
  (`parseResponse.ts`) y settings JSON (`cloudSettings.ts`, `storyParams.ts`). (US-44)
- Rutas Fastify (`/guardians`, `/guardians/login`, `/profiles`, `/stories`,
  `/activities/recommend`, `/activities/:id/complete`) migradas de JSON Schema escrito a mano a
  esquemas Zod vía `ZodTypeProvider`: elimina la duplicación entre el esquema y el tipo del body
  (ya no se declara `app.post<{ Body }>`). Contrato de validación preservado (400 +
  `{ error: { tipo, mensaje } }`); `.strict()` replica `additionalProperties: false`. (US-44)

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
