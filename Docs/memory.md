# Memoria del proyecto

Contexto y **decisiones tomadas** que no se deducen del código ni del git log.
Para el estado de avance ver [phases.md](phases.md); para errores y trampas
concretas ver [lecciones-aprendidas.md](lecciones-aprendidas.md).

> Convención: cada decisión lleva fecha y, si aplica, el porqué. No duplicar lo
> que ya está en `CLAUDE.md` o en el plan; aquí solo lo que se decidió en el camino.

---

## Stack elegido (Fase 0 · 2026-06-10)

- **Gestor de paquetes:** pnpm 11 con workspaces (no turborepo). Razón: suficiente
  para 2 paquetes; menos configuración (YAGNI).
- **Framework backend:** Fastify 5. Razón: ligero, `app.inject()` hace los tests de
  rutas triviales sin abrir puerto.
- **ORM:** Prisma 6 (cliente generado a `src/generated/prisma`, fuera de git).
- **Logs:** pino (con `pino-pretty` solo en desarrollo).
- **Node:** ≥ 24 (imagen `node:24-alpine` en Docker).

## Decisiones de arquitectura

- **`AI_PROVIDER=mock` es el valor por defecto** (2026-06-10). Razón crítica: un
  evaluador sin GPU debe poder hacer `docker compose up` y que todo funcione sin
  descargar `gemma:2b`. El modo `local` es opt-in.
- **Esquema Prisma vacío en Fase 0** (solo `datasource` + `generator`). Los modelos
  se derivan del dominio en Fase 1 y se materializan con migraciones en Fase 3, para
  no acoplar la persistencia antes de tener el dominio.
- **El `app` (Expo) es un placeholder hasta Fase 4.** No se configura antes para no
  arrastrar tooling móvil que aún no se usa.

## Diseño del MVP (2026-06-10)

Llegó el export de Stitch ("Aprendizaje Mágico") con 6 pantallas + design system.
Es la **fuente de verdad de la UI**; análisis e índice en [Design/README.md](Design/README.md).

- **ChildProfile lleva más campos de los previstos.** El plan solo nombraba VO de
  `edad`/`idioma`, pero la pantalla de crear perfil pide también `avatar` (preset) e
  `intereses[]` (`animales | aventuras | música | espacio`). Decisión (2026-06-10):
  **ambos entran ya en Fase 1**; son escalares simples, sin value-object (YAGNI).
- **Bilingüe ES/EN confirmado**, con Español (Latinoamérica) por defecto.
- **Firma de `generateStory` precisada por el diseño:** entrada `{ perfil, tema, estilo }`
  con `tema ∈ {animales, espacio, magia}` y `estilo ∈ {aventura, divertido, educativo}`;
  salida `{ título, cuerpo }`. Aplica a la interfaz `AIProvider` de Fase 2.
- **El `code.html` de Stitch es maqueta, no producción** (Tailwind CDN + Material
  Symbols). Se usa como referencia visual/tokens; la app Expo (Fase 4) no lo copia.

## Decisiones tras el análisis de historias de usuario (2026-06-10)

Resueltas las inconsistencias detectadas al cruzar plan + diseño + ADRs (ver
[historias-usuario/](historias-usuario/README.md)):

- **I-1:** se añaden `GenerateStory` y `ListProfiles` a los casos de uso oficiales
  (faltaban; el núcleo y el multi-niño los exigen).
- **I-2:** **vocabulario de temática único** `animales | espacio | magia | aventuras |
música`, compartido por `intereses` (perfil) y `tema` (cuento); los intereses
  pre-seleccionan el tema.
- **I-3:** las **actividades se generan con IA** según el perfil (no catálogo fijo);
  `recommendActivities` las produce vía `AIProvider`. Re-enfoca [ADR 0004](ADR/0004-base-de-datos-vectorial-chroma.md):
  Chroma pasa a evaluarse como memoria semántica (dedup/similitud de lo generado).
- **I-4:** el cuento se genera **en el idioma del perfil**.
- **I-5:** rango de **edad 2-6** (lo que ofrece la UI); el "2-5" del brand queda obsoleto.
- **I-6:** el **progreso se modela como estado** de `Story`/`Activity` (sin entidad
  `Progress` aparte; YAGNI).
- **I-7:** nombre visible de la app: **"Aprendizaje Mágico"** (el paquete sigue siendo
  `magyblob`).

## Cumplimiento y datos de menores (2026-06-10)

La app va dirigida a niños de 2-6 → **todos menores de 14 (España) y de 13 (COPPA)**:
el consentimiento del adulto es **siempre** obligatorio. Detalle y fuentes en
[cumplimiento-menores.md](cumplimiento-menores.md). Decisiones:

- **Entidad `Guardian` (adulto responsable):** todo `ChildProfile` cuelga de un
  `Guardian` (nombre, apellidos, email, parentesco, teléfono opcional) con registro de
  consentimiento. Caso de uso `RegisterGuardian` previo a `CreateChildProfile`.
- **Tracking de primera parte:** `InteractionEvent` (uso) y `AuditLog` (acciones
  sensibles del adulto). **Prohibido** SDKs de analítica/publicidad de terceros e
  identificadores de dispositivo — lo exigen Apple Kids y Google Play Families.
- **Minimización:** del adulto solo lo necesario; eventos sin PII, niño pseudónimo por
  `profileId`. Borrado en cascada (derecho de supresión). Conservación a definir.
- **Verificación robusta de edad del adulto:** fuera del alcance del TFM; se usa puerta
  parental + email y se declara como limitación.
- Sinergia con [ADR 0003](ADR/0003-gemma-2b-llm-local-por-defecto.md): el LLM local
  refuerza "los datos no salen de la máquina" (privacy by design).

## Configuración en BD: AppSetting (2026-06-10)

Tabla clave-valor (`id`, `key`, `value`) para config **ajustable sin redeploy**:
plantillas de prompt (cuento/actividades), ids de modelo de IA y parámetros de
generación (`maxTokens`, `temperature`, `activity.count`). Detalle en
[modelo-datos.md](modelo-datos.md).

- **Separación env vs BD:** el **entorno** (`.env`) fija arranque y **secretos**
  (`AI_PROVIDER`, `DATABASE_URL`, `ANTHROPIC_API_KEY`...); `AppSetting` guarda solo
  tunables **no sensibles**. Los secretos **nunca** van en la tabla.
- **Valores por defecto en código:** si una clave no está en `AppSetting`, se usa el
  default del código (así la Fase 2 funciona antes de que exista la tabla, que llega en
  Fase 3).
- **Prompts seguros:** las plantillas imponen contenido apto para niños (guardarraíl),
  ligado a [cumplimiento-menores.md](cumplimiento-menores.md).

## Capa de IA (Fase 2 · 2026-06-10)

Tres modos detrás de la interfaz `AIProvider`, implementados en `src/infrastructure/ai/`.

- **`MockProvider` cumple tres papeles a la vez** y por eso es código de producción,
  no un doble de test: (1) modo por defecto sin GPU, (2) red de seguridad del fallback,
  (3) base de los tests rápidos. El `FakeAIProvider` de `test/support/doubles.ts` se
  mantiene aparte (más escueto) para los tests de aplicación de Fase 1.
- **Fallback como decorador (`FallbackProvider`), no como `if` en cada caso de uso.**
  Envuelve al proveedor activo y cae a mock ante cualquier fallo (caído/timeout/JSON
  inválido), registrando `warn`. La aplicación no sabe que existe el fallback.
- **Salida estructurada vía `format` (esquema JSON) de Ollama**, no parseo de texto
  libre. `gemma:2b` es pequeño y poco fiable con formato; el esquema lo fuerza. Se usa
  `POST /api/generate` sin streaming + `AbortSignal.timeout` (`AI_TIMEOUT_MS`, 60 s).
- **`createAIProvider(config, logger)` centraliza la selección por env.** `mock`→Mock;
  `local`→Ollama envuelto en Fallback; `cloud`→avisa y usa mock (CloudProvider es Fase 5,
  no se adelanta — regla "una sesión por fase").
- **Prompts bilingües con valores por defecto en código** (`prompts.ts`), cada uno con
  instrucción de seguridad para menores. La firma se mantiene cuando en Fase 3 los textos
  salgan de `AppSetting` (solo cambia el origen, no el llamador).
- **Smoke test manual del Ollama** (`pnpm ai:smoke`): script directo contra Ollama vivo
  (sin fallback, para que los fallos se vean). No es test automatizado: el DoD lo define
  como manual porque depende del modelo descargado.

## Persistencia y API HTTP (Fase 3 · 2026-06-10)

- **Inyección de dependencias en `buildServer(config, deps?)`.** Los tests pasan repos
  en memoria + `MockProvider` y ejercitan el HTTP con `app.inject` **sin tocar la DB**;
  en producción, si no se inyectan `deps`, se construyen con `buildProductionDeps`
  (repos Prisma) **importado de forma diferida** (`await import`) para que Prisma no
  entre en el grafo de módulos de los tests. El test de integración del DoD es, por
  tanto, rápido y sin Postgres.
- **Audit/eventos se escriben en la frontera HTTP, no en los casos de uso.** Decisión
  para no acoplar la aplicación (ya cerrada y testeada en Fase 1) a una preocupación
  transversal de cumplimiento. La ruta llama al caso de uso y luego registra
  `AuditLog`/`InteractionEvent`. Si esto creciera, se reconsideraría moverlo a un
  decorador de caso de uso.
- **Errores de dominio tipados para HTTP:** `NotFoundError` (404) y `ConflictError`
  (409) extienden `DomainError` (400). Los tests de Fase 1 siguen verdes porque ambos
  son `DomainError`. El error handler central devuelve `{ error: { tipo, mensaje } }`.
- **Vocabularios como `String`/`String[]` en Prisma, no enums de la DB.** El dominio ya
  valida los vocabularios cerrados (string unions ASCII); duplicarlos como enums de
  Postgres añadiría fricción de mapeo y migraciones por cada cambio. `intereses` es
  `String[]` (array nativo), sin tabla puente (YAGNI).
- **`AppSetting` se consume en caliente:** el `OllamaProvider` lee `prompt.story.*`,
  `prompt.activity.*` y `story.temperature` por llamada, con **fallback al default en
  código** si la clave falta. Por eso la app funciona aunque no se haya corrido el seed.
  Las plantillas usan placeholders `{nombre}`, `{edad}`, `{tema}`… sustituidos en `prompts.ts`.
- **Cliente Prisma con salida custom (`src/generated`) y su coste:** `tsc` no copia los
  `.js` generados, así que `build` hace `cp -r src/generated dist/generated`; en Docker
  el cliente se **regenera dentro de la imagen** (engine linux/musl) y el del host se
  excluye con `.dockerignore`. `prisma` pasó a dependencia de producción para poder
  `migrate deploy` al arrancar el contenedor (requisito "sin pasos ocultos").

## Slice vertical en la app móvil (Fase 4 · 2026-06-11)

App `@magyblob/app` con Expo SDK 56 (lo que da `create-expo-app@latest`, no el 54 previsto)

- React Navigation v7 + Zustand. Decisiones:

* **React Navigation (native-stack manual), no Expo Router.** Decidido con el usuario: stack
  explícito y minimalista para 3 pantallas. Al ensanchar a las tabs del diseño (Fase 5) se
  añadirá un tab navigator.
* **Onboarding mínimo del adulto.** El backend exige `guardianId` y el cumplimiento exige
  consentimiento + puerta parental (C-1/C-6), pero el export de Stitch no trae alta de adulto.
  Solución: pantalla **Consent** (puerta parental tipo operación aritmética + alta de `Guardian`
  con consentimiento). El `guardianId` se persiste; el resto de pantallas son de sesión.
* **La app es agnóstica del proveedor de IA.** Solo llama a `POST /stories`; el modo (mock |
  local) lo decide el backend. La "IA local real" de la DoD se demuestra con
  `AI_PROVIDER=local` (`pnpm up:local`), sin acoplar la app.
* **Contrato de cable duplicado a propósito.** `src/api/types.ts` replica los DTO del backend en
  lugar de importarlos: cliente y servidor se comunican por la frontera JSON, no por código
  compartido (evita acoplar la app al backend).
* **Config por `EXPO_PUBLIC_API_URL`.** URL base del backend por env de Expo (se inlinea en el
  bundle → nunca secretos ahí). En dispositivo físico hay que poner la IP LAN, no `localhost`.
* **Avatares como emojis**, sin assets externos ni descargas en runtime (coherente con el
  cumplimiento: cero terceros).
* **Versionado/CHANGELOG (convención añadida a CLAUDE.md el 2026-06-11):** al cerrar feature se
  sube versión SemVer (raíz y paquete afectado) y se mueve lo de `[Unreleased]` a una sección
  versionada del `CHANGELOG.md` del paquete. Esta fase: raíz y app → **0.1.0**.

## Actividades — Fase 5 F1 (2026-06-11 · backend v0.1.0 / app v0.2.0)

Primera feature de la Fase 5 (US-09), ejecutada por slices:

- **Dedup simple en vez de Chroma.** `RecommendActivities` descarta las actividades cuyo título
  ya exista para el perfil (case-insensitive), comparando contra `ActivityRepository.findByProfile`.
  Es la alternativa adoptada a la base vectorial: cubre "no repetir" sin añadir infra. Chroma se
  descartó formalmente (ver "Alcance retirado" más abajo y [ADR 0004](ADR/0004-base-de-datos-vectorial-chroma.md)).
- **App: navegación a dos niveles.** Stack raíz (Consent → CreateProfile → Main) + **tab navigator**
  (`@react-navigation/bottom-tabs`) en `Main`. F1 trae 2 pestañas (Cuentos, Actividades); Inicio e
  Historial llegan en F2 (se evita andamiar pantallas placeholder). Indicador activo tipo "blob"
  con emoji (sin `@expo/vector-icons`, cero deps extra).
- **Versionado del backend arranca en 0.1.0.** Las Fases 0-3 son anteriores a la convención de
  CHANGELOG; el `CHANGELOG.md` del backend empieza a registrarse aquí.
- **Verificar e2e tras tocar el backend exige reconstruir su contenedor** (`docker compose up
--build backend`): el contenedor en marcha no tiene las rutas nuevas hasta rebuild.

## Historial y progreso — Fase 5 F2 (2026-06-12 · backend v0.2.0 / app v0.3.0)

US-07/08/10. Decisiones:

- **`SaveProgress` partido en dos casos de uso** (`MarkStoryRead`, `CompleteActivity`): el
  progreso es estado de `Story`/`Activity` (I-6) y cada operación toca una entidad distinta; un
  caso de uso "cajón" sería peor. `GetHistory` solo lee (reusa los `findByProfile`).
- **`PrismaStoryRepository.save` ahora hace upsert** para persistir el cambio a `leído` sin añadir
  un método al puerto; `update` solo toca `estado` (lo único mutable del cuento). `PrismaActivity`
  ya hacía upsert; se le añadió `findById` para completar.
- **Mappers compartidos** (`application/mappers.ts`: `toStoryOutput`/`toActivityOutput`) para no
  duplicar el mapeo entidad→DTO entre casos de uso de lectura.
- **App: 4 pestañas** (Inicio·Actividades·Cuentos·Historial); el Historial **recarga al recibir
  foco** (`useFocusEffect`) para reflejar lo leído/hecho al cambiar de pestaña. Valoración con
  `StarRating` (1-3) desde la tarjeta de actividad.
- **Evento `actividad_completada`** se escribe en la frontera HTTP (como los demás), no en el caso
  de uso.

## Clean Architecture en el app (2026-06-11 · app v0.1.1)

Tras cerrar Fase 4, el app se reorganizó por capas (decisión del usuario: alinear con el backend
sin sobre-ingeniería). **Clean ligera**, no estricta:

- **Capas:** `domain` (modelos, vocabularios, interfaces de gateway, `ApiError`),
  `infrastructure` (adaptador HTTP `createApiGateways` + `storage` de AsyncStorage) y
  `presentation` (pantallas, componentes, store, theme, navegación, labels). Un `composition.ts`
  en la raíz de `src/` actúa de **composition root**: es el único que importa infraestructura y
  expone `api` tipado como las interfaces de `domain`.
- **Inversión de dependencias:** las pantallas llaman a `api.guardians.register(...)` etc., donde
  `api` está tipado contra `domain/gateways`, no contra `fetch`. La presentación no conoce la
  implementación HTTP.
- **Sin capa `application`:** los casos de uso del cliente son una sola llamada HTTP, así que el
  gateway **es** la frontera (no se añaden clases de caso de uso → YAGNI). Si en Fase 5 aparece
  orquestación real en el cliente, se introducirá entonces.
- **Sin frontera ESLint nueva:** el ESLint raíz ya ignora `packages/app/**`; la disciplina de
  capas se mantiene por convención (a diferencia del backend, que sí la refuerza con
  `no-restricted-imports`).
- **Refactor sin cambio de comportamiento:** mismas llamadas HTTP y misma UI; gate verde (63
  tests) y `expo export` revalidado. SemVer **patch** (0.1.0 → 0.1.1).

## Alcance retirado: CloudProvider y Chroma (2026-06-12)

Se sacan del plan y, a petición del usuario, se **eliminan del repo por completo** ("sin rastro
de lo retirado"). Decisión del usuario:

- **CloudProvider (Claude/OpenAI):** no se implementa el modo `cloud`. El proyecto se queda con
  `mock`/`local` (privacidad por diseño: los datos del niño no salen de la máquina). **Eliminado
  del código:** `AI_PROVIDER` pasa a `mock | local` en `config.ts`; el caso `cloud` desaparece de
  `createAIProvider`; fuera las claves `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` y `ai.model.cloud` del
  `.env.example`/`modelo-datos.md`. ADR 0002 actualizada a "dos modos"; US-14 marcada descartada.
- **Chroma (base vectorial):** no se usa. El **dedup simple por título** en `RecommendActivities`
  cubre "no repetir" para el MVP. **Eliminado del repo:** servicio `chroma` y volumen `chromadata`
  fuera de `docker-compose.yml`, `CHROMA_URL` fuera; ADR 0004 marcada **Rechazada**.
- Si en el futuro hiciera falta similitud semántica, la vía preferente sería `pgvector` (sin
  contenedor aparte), no Chroma.

## Reintroducción del modo cloud (Feature 14 · 2026-06-12 · backend v0.3.0)

A petición del usuario se **reabre** la decisión anterior y se reintroduce el modo `cloud` (US-14,
reactivada), pero acotado para no romper la privacidad por diseño. Detalle en
[planes/14-proveedor-cloud.md](planes/14-proveedor-cloud.md) y [ADR 0002](ADR/0002-tres-modos-de-ia.md).

- **Adaptador único compatible con OpenAI**, no uno por proveedor. Groq, Gemini, OpenRouter y
  Cerebras exponen el mismo dialecto `/chat/completions`; un solo `CloudProvider` parametrizado los
  cubre todos cambiando `baseUrl + model + apiKey`. Registro de presets en `cloudPresets.ts`
  (solo info no secreta: `baseUrl` + nombre de la env con la key). YAGNI: una abstracción, no N.
- **Selección por BD (hot-swap), no por env.** La clave `ai.cloud` de `AppSetting`
  (`{activo,target,model}`, validada en `cloudSettings.ts`) decide el proveedor. Se eligió **una
  clave JSON** (atómica, sin estados inconsistentes) en vez de claves sueltas o tabla nueva
  (`AppSetting` ya existía para esto). El cambio se aplica **por petición**: `HotSwapAIProvider`
  (en `createAIProvider`) lee `ai.cloud` en cada generación y enruta a cloud o al base, así que
  cambiar el proveedor es un `UPDATE` sin reiniciar.
- **Decisión clave de cumplimiento: `cloud` NO se activa por `AI_PROVIDER`.** El env solo elige el
  base (`mock`/`local`); cloud requiere encenderlo explícitamente en BD **y** tener la key en env.
  Así "privacidad por defecto" se mantiene: nadie enciende la nube por una variable de entorno por
  accidente. C-5 de cumplimiento pasa de ✔ absoluto a "✔ por defecto / Cond. en cloud" (solo salen
  datos minimizados; los free tiers pueden entrenar con ellos; incompatible con Apple Kids).
- **Secretos solo en env.** La BD guarda selectores no secretos; la API key se lee de
  `process.env[preset.apiKeyEnv]` vía `config.cloudApiKeys`. `docker-compose.yml` pasa
  `GROQ/GEMINI/OPENROUTER/CEREBRAS_API_KEY` al backend (vacías por defecto).
- **Reutilización con Ollama:** se extrajo el parseo/saneo del LLM a `parseResponse.ts` y las claves
  de `AppSetting` a `AI_SETTING_KEYS` (`prompts.ts`), compartidos por ambos proveedores. El
  `CloudProvider` usa `response_format: {type:'json_object'}` (más portable que `json_schema` entre
  proveedores) y añade al prompt la forma JSON esperada. Fallback a mock vía el mismo `FallbackProvider`.
- **Smoke `pnpm ai:smoke:cloud`** (`scripts/smoke-cloud.ts`): CloudProvider directo contra el
  proveedor real (key en env), verificado contra Groq `llama-3.3-70b-versatile`.

## Sesión del guardián y multi-perfil (Fase 5.5 · 2026-06-12 · backend v0.4.0 / app v0.4.0)

Añade sesión de adulto completa (login, selección de perfil, zona de adultos, logout). Plan en
[planes/fase-5-5.md](planes/fase-5-5.md); cubre US-19 y US-02.

- **Login ligero por email, sin contraseña.** Decisión consciente: la autenticación robusta (factor
  de autenticación, tokens, verificación de edad) queda **fuera del alcance del TFM** y se declara
  así en US-19 y phases.md. `LoginGuardian` reutiliza `GuardianRepository.findByEmail` (ya existía);
  no se añadió entidad ni migración. Es coherente con cumplimiento-menores (la barrera real es la
  puerta parental, no el login).
- **Normalización de email en la entidad `Guardian`** (recorte + minúsculas), con alta y login
  normalizando la clave antes de `findByEmail`. Sin esto, "Ana@…" registrado no casaría con
  "ana@…" en el login. La ruta valida el email por **`pattern`** (misma regex que la entidad) porque
  ajv-formats no está cableado en Fastify; `format: 'email'` se ignoraría.
- **Sesión persistida = guardián completo + perfil activo.** El store pasa de guardar solo
  `guardianId` a guardar el `guardian` entero y el `currentProfile` (antes transitorio). Migración
  de persistencia a **v1**: el estado v0 no puede reconstruir el guardián desde solo el id, así que
  se descarta (el adulto se identifica una vez). Onboarding por stack: Bienvenida → (alta/login) →
  Seleccionar perfil → pestañas.
- **Puerta parental extraída a componente `ParentalGate`** (antes inline en Consent), reutilizada
  por el alta y por la zona de adultos. La zona de adultos vive en el stack raíz (sobre las tabs) y
  ofrece cambiar de perfil (`clearProfile`) y cerrar sesión (`logout`).
- **Diferido a la Fase de mejoras:** modal propio en vez de `Alert` del sistema; header con "atrás";
  indicador de Autor (proveedor de IA: mock/local/cloud) en cuentos y actividades.

## Fase de mejoras — UX y navegación (2026-06-12 · app v0.5.0)

Rama `feature/mejoras-ux-navegacion`; cubre US-23 y US-24. **Solo app.**

- **Avisos/confirmaciones con modal propio (US-23).** `DialogProvider` monta **un único `<Modal>`**
  en la raíz y expone `useDialog()` con API **imperativa** (`alert`/`confirm`). Se eligió imperativo
  (no estado por pantalla) porque las alertas se lanzan desde handlers; evita duplicar el `<Modal>`.
  Se añadió variante `danger` a `BubblyButton` para el confirmar destructivo. Cero `Alert.alert`.
- **Header del stack con "atrás" (US-24).** Se activó la cabecera temática en el stack
  (`stackScreenOptions`), **conservando las tabs sin cabecera** (`Main` y `Welcome` con
  `headerShown:false`). Para no duplicar, se quitó el hero in-screen donde coincidía con el título de
  cabecera (Login, Crear perfil, Zona de adultos) y el "Volver" del footer de la zona de adultos.
- **Pendiente del bloque:** Autor (proveedor de IA) en cuentos y actividades — va en su propia rama
  (toca backend + app).

## Autor — proveedor de IA efectivo (2026-06-12 · backend v0.5.0 / app v0.6.0)

Rama `feature/autor-proveedor-ia`; cubre US-25. Backend + app.

- **Proveedor efectivo, no el configurado.** Cada provider concreto **estampa su identidad**
  (`Mock`=`mock`, `Ollama`=`local`, `Cloud`=`cloud`) en `GeneratedStory`/`GeneratedActivity`; los
  envoltorios (`FallbackProvider`/`HotSwap`) lo **pasan tal cual**, así el proveedor que fluye es el
  que realmente generó. Si Ollama/cloud fallan y se cae al mock, se persiste `mock` — el Autor lo
  refleja con honestidad (no miente con el modo configurado).
- **`proveedor` por fila, persistido.** Campo en `Story` y `Activity` (vocabulario cerrado
  `PROVEEDORES_IA`), columna Prisma con default `mock` (migración `add_proveedor_to_story_activity`)
  y en `StoryOutput`/`ActivityOutput`. Decisión del usuario: persistir (no solo en la respuesta del
  momento) para que el **Historial** también muestre el Autor.
- **Gotcha demostrado en vivo:** con `AI_PROVIDER=local` pero el modelo **descargado de memoria**,
  la generación en frío en CPU superó el timeout (180s) → fallback a mock → "Autor: Simulada". No es
  bug: es US-25 funcionando. Pre-cargar el modelo (`keep_alive`) devuelve "IA local". Ver
  [lecciones-aprendidas.md](lecciones-aprendidas.md) (Ollama en Docker va por CPU).

## Funcionalidad y personalización (Fase de mejoras · 2026-06-18 · backend v0.6.0 / app v0.7.0)

Rama `feature/funcionalidad-personalizacion`; cubre US-26, US-27 y US-10 ampliada.

- **Personalización por niño (US-26):** los prompts usan `nombre`/`edad`/`intereses` y afinan el
  **tono por tramo de edad** (2-3 / 4 / 5-6). Solo prompts (no toca contrato ni datos).
- **Parámetros configurables del cuento (US-26/US-18):** clave `AppSetting` `prompt.story.params`
  (JSON `{palabrasMin,palabrasMax,rima,formatos}`), validada en `storyParams.ts`. Decisión con el
  usuario: **variación aleatoria** — en cada generación se elige un **formato al azar** de la lista
  (`cuento·fabula·poema·adivinanza`). El azar vive en el provider (`resolveStoryParams`, rng
  inyectable para tests); `buildStoryPrompt` queda determinista dado el formato resuelto. El
  `MockProvider` no usa prompts → la variación solo se ve en `local`/`cloud`. Default sembrado; si la
  clave falta/ inválida, comportamiento legacy.
- **Releer desde Historial (US-27):** pantalla `StoryReaderScreen` (stack raíz, navegada con
  `getParent` desde la pestaña), marca `leído` al montar (`stories.markRead`).
- **Botón "Realizado" (US-10 ampliada):** en `ActivityCard`, revela la valoración 1-3 y llama a
  `complete`; conserva el atajo de tocar estrellas.
- **Nota de proceso:** esta rama y la de narración (US-22) se desarrollaron en paralelo; al cerrar,
  US-22 quedó en su propia rama/stash. Ninguna estaba mergeada a `develop` aún.

## Narración de cuentos con ElevenLabs (Fase de mejoras · 2026-06-18 · US-22)

Rama `feature/22-narracion-cuentos-elevenlabs` (desde `develop`; `funcionalidad-personalizacion` ya
mergeada, integrada aquí por `git merge develop`).

- **Decisión con el usuario:** ElevenLabs como **motor principal** (no el opt-in OFF que contemplaba
  el plan original), con **fallback a voz nativa** (`expo-speech`) y **audio persistido**. Se asume
  conscientemente la **desviación de cumplimiento** (C-2/C-5, Apple Kids): narrar envía el texto del
  cuento —con el nombre del niño— a un tercero, y **no es minimizable**. Documentado en
  `cumplimiento-menores.md` (C-11) y US-22; válido en el marco del TFM, no para producción real.
- **Arquitectura (espejo del `AIProvider`):** puerto `TTSProvider` (dominio) + `ElevenLabsProvider`
  (infra). El backend es **proxy** (la `xi-api-key` —env `ELEVENT_LABS_API`, con typo heredado— no
  sale al cliente). Ruta `GET /stories/:id/narration` → `audio/mpeg`. **Caché** `StoryNarration`
  (1-1 con `Story`, `Bytes`): se sintetiza una vez por cuento. El **fallback es de cliente** (la voz
  nativa es del SO), a diferencia del `FallbackProvider` del LLM que es de servidor.
- **App:** hook `useNarration` (fetch del audio → `expo-file-system` a caché → `expo-audio`; si
  falla, `Speech.speak`; limpieza al desmontar) + `NarrationControls`, usado en el Generador y en
  `StoryReaderScreen`. Voces por idioma configurables (`ELEVENLABS_VOICE_ID_ES/_EN`).
- **Evento `cuento_narrado`** solo en cache-miss (primera síntesis), para no inflar el tracking con
  reescuchas.

## Reglas narrativas del cuento / prompt maestro (Fase de mejoras · 2026-06-18 · US-28)

Rama `feature/28-reglas-prompt-cuento` (desde `develop`). Amplía US-26.

- **Las reglas van en el `system` prompt, no en la plantilla por petición.** Son "cómo contar"
  (tono tierno, frases cortas, onomatopeyas suaves, sin miedo/violencia/peligro real, final feliz y
  tranquilo, y estructura de 5 pasos: presentación, situación, amigo que ayuda, resolución y
  enseñanza final). Así aplican siempre y **no interfieren** con la personalización del template
  (US-26). La longitud sigue gobernada por `prompt.story.params`.
- **El system del cuento vive SOLO en código, no en el seed (decisión final).** `INSTRUCCION_SEGURIDAD`
  es **por idioma** (ES/EN); el `prompt.story.system` del seed era un **único texto en español** que
  pisaba esa selección y hacía que se escribiera en español aunque el perfil fuera `en`. Se **quitó
  del seed** (y de la BD) → el system lo pone el código por idioma. La plantilla
  (`prompt.story.template`) sigue siendo configurable. El `MockProvider` no usa prompts → sin efecto
  en `mock`. (Precedencia: `AppSetting` pisa el default de código; por eso un override monolingüe es
  peligroso en una app bilingüe.)
- **Estructura condicionada por redacción:** "cuando escribas un cuento o una fábula…", para no
  forzarla en `poema`/`adivinanza`. Se retiró el "pequeño conflicto seguro" (decisión del usuario
  tras revisar 10 generaciones de prueba).
- **Bug de idioma corregido:** el placeholder `{idioma}` de la plantilla configurable se sustituía
  por el **código** (`en`/`es`) → "Escríbelo en en". Se añadió `{idiomaNombre}` (`español`/`inglés`).
- **Local = español (decisión del usuario).** Verificado generando cuentos reales: en `cloud`
  (Groq 70B) se cumplen las reglas y se respeta el idioma (EN correcto). En `local` con modelos
  pequeños (`gemma:2b`, `llama3.2:3b`) el texto sale **en español aunque el perfil sea `en`** —
  siguen el idioma dominante del prompt, no la instrucción. Se **asume**: el inglés y la calidad
  plena son cosa de `cloud`; en local nos quedamos con español. (gemma:2b además es incoherente;
  llama3.2:3b es coherente pero ignora el idioma y trunca.) Coherente con ADR 0003.
- **Para que `cloud`/`local` reflejen cambios de prompt en código hay que reconstruir el contenedor
  del backend** (`docker compose up -d --build backend`); el seed (DB) se aplica al reseedear, pero
  el código del prompt lo ejecuta el contenedor.

## Iconografía con lucide-react-native (Fase de mejoras · 2026-06-19 · US-29)

Rama `feature/29-iconos-lucide` (desde `develop`). Solo app.

- **Decisión con el usuario — alcance parcial:** se migran a iconos SVG de Lucide solo los iconos
  **funcionales** (navegación, controles, valoración, acciones, categorías, badges de "Autor"). Los
  **avatares de animales** (`AvatarPicker`) y el `✨` por defecto se mantienen como **emoji** a
  propósito: aportan color y calidez que los iconos de línea no igualan en una app de 2-6 años.
- **Wrapper `Icon` central:** las pantallas piden el icono por **nombre semántico** del dominio de la
  UI (`<Icon name="play" />`) y quedan desacopladas de la librería; el mapa nombre→componente vive
  solo en `components/Icon.tsx`. Consume los tokens de tema (`iconSize`, `colors`).
- **Cumplimiento:** Lucide empaqueta los datos SVG en el bundle en build-time → **no** añade red en
  runtime ni SDK de tercero activo; compatible con `cumplimiento-menores.md`. Peer dep
  `react-native-svg` instalada con `expo install` (fija la versión compatible con el SDK).

## Tests user-centric de componentes (Fase de mejoras · 2026-06-22 · US-30)

Rama `feature/30-tests-componentes` (desde `develop`). Solo app.

- **Decisión con el usuario — arnés RN-web en vez de RNTL "puro":** la vía idiomática
  (`@testing-library/react-native` + `react-test-renderer`) bajo Vitest exige transformar el Flow de
  `react-native` y mockear muchos módulos nativos → frágil de mantener verde en clon limpio. Se opta
  por aliasar `react-native` → `react-native-web` y renderizar con `@testing-library/react` sobre
  `jsdom` (todo `devDependencies`). RN-web traduce las props de accesibilidad a ARIA
  (`accessibilityRole`→`role`, `accessibilityLabel`→`aria-label`...), que es justo lo que consultan
  las queries de Testing Library y casa con un enfoque user-centric (rol → etiqueta → texto).
- **Entorno mixto sin tocar lo existente:** `vitest.config.ts` deja el entorno por defecto en `node`
  (para el test del adaptador HTTP) y cada test de componente declara `// @vitest-environment jsdom`.
- **Cobertura:** 11 componentes / 41 tests. `Icon` se deja **fuera del arnés** a propósito
  (`lucide-react-native` no importa bajo Vitest, ver lecciones-aprendidas); se mockea `./Icon` donde
  hace falta. Su contrato ya lo cubre US-29.
- **Sin impacto en runtime/cumplimiento:** las dependencias añadidas son solo de desarrollo; no se
  añade red ni SDK de tercero al bundle de la app.

## Análisis estático con SonarJS (Fase de mejoras · 2026-06-22 · US-31)

Rama `feature/31-sonarjs` (desde `develop`). Solo backend (el lint raíz ya ignora `packages/app`).

- **Decisión con el usuario — "SonarJS" = `eslint-plugin-sonarjs`, no SonarQube/SonarCloud:** se
  integra como plugin de ESLint (config `recommended` en la flat config), sin servicio externo ni CI
  nuevo. Privacidad/cumplimiento: es `devDependency`, sin runtime, red ni SDKs de terceros.
- **Sin _typed linting_ (decisión deliberada):** la config `recommended` no exige
  `parserOptions.project`; las ~50 reglas que requieren tipos simplemente no analizan (no lanzan
  error) y quedan 268 reglas activas que cubren el grueso de bugs/code smells. Se evita acoplar el
  lint al `tsconfig` y un segundo type-check en cada `pnpm lint` (YAGNI). Si en el futuro se quiere
  más cobertura, el paso es añadir `parserOptions.project` al bloque del backend.
- **Reglas relajadas a conciencia (con justificación en `eslint.config.mjs`):** `todo-tag` (los TODO
  son marcadores de planificación rastreados en `Docs/planes`), `void-use` (`void promesa` es el
  patrón elegido para promesa flotante: bootstrap y errorHandler de Fastify) y `no-nested-conditional`
  (el contenido bilingüe ES/EN se expresa como ternario anidado de forma consistente; aplanarlo
  tocaría la lógica de prompts, fuera de alcance de US-31). `no-clear-text-protocols` off **solo en
  tests** (URLs `http://` a servicios internos simulados). El email de `Guardian` lleva supresión en
  línea de `super-linear-regex` (regla de seguridad que se mantiene activa global): patrón anclado,
  un único `\.`, longitud acotada → sin ReDoS real.
- **Frontera de capas intacta:** SonarJS no relaja los `no-restricted-imports` de `/domain` y
  aplicación (invariante del proyecto).

## Observer para telemetría y auditoría (Feature 33 · 2026-06-23 · US-17)

Rama `feature/33-observer-event-bus` (desde `develop`). Petición: "optimizar aplicando patrones
(Strategy/Factory/Observer/Command) donde sea necesario".

- **Auditoría previa — la mayoría ya estaban:** Strategy (`AIProvider` + Mock/Ollama/Cloud), Factory
  (`createAIProvider`, `createApiGateways`) y Decorator (`FallbackProvider`/`HotSwapAIProvider`) ya
  implementados; Command está implícito en los casos de uso (`execute()`). **Decisión con el usuario:
  enfoque pragmático**, no aplicar patrones "por completitud" (respeta el YAGNI del proyecto). Se
  descartan por escrito: Command formal (sin undo/cola que lo justifique), Strategy/Template para el
  dedup de `RecommendActivities` (un bucle, una variante) y cualquier patrón en la app (Zustand ya es
  Observable; mapeos de 3-4 entradas → sobre-ingeniería).
- **Único patrón que paga su coste → Observer.** La emisión de `InteractionEvent` (telemetría) y
  `AuditLog` (auditoría) estaba **duplicada y mezclada en 6 handlers HTTP**. Se introduce un bus de
  eventos en proceso: puerto `EventBus` + unión discriminada `DomainEvent` en `domain/events`;
  `InMemoryEventBus` y `wireDomainEvents` (suscriptor de telemetría + suscriptor de auditoría) en
  `infrastructure/events`. Las rutas hacen `deps.bus.publish({ tipo, … })`; los suscriptores,
  registrados una vez en el composition root, construyen y persisten. Añadir métricas/cumplimiento
  futuro = añadir un `bus.subscribe(...)`, sin tocar rutas.
- **Sin cambio de comportamiento ni de esquema:** se persisten exactamente los mismos eventos. El bus
  notifica **en serie y propaga errores** (un fallo de `save` sigue dando 500, como antes).
- **`domain/events` no importa infraestructura** (invariante de capas intacto; `DomainEvent` reusa los
  vocabularios cerrados de `domain/vocabulary`).
- **Gotcha del gate (fuera de alcance, resuelto con el usuario):** `eslint .` escaneaba el worktree
  paralelo `feature/34` dentro de `.claude/worktrees/` y lo marcaba en rojo. Se añade `.claude/**` a
  los `ignores` de `eslint.config.mjs` y `.claude/worktrees/` a `.gitignore`: los worktrees integrados
  (regla de paralelismo) tienen su propio gate y no deben contaminar el de la rama actual.

## Integración, E2E y CI (Fase 6 · 2026-06-23 · backend v0.11.0 / app v0.11.0 · US-32)

Rama `feature/34-integracion-e2e-ci` (worktree desde `develop`, en paralelo a
`feature/33-observer-event-bus`). Cubre la parte de **testing/CI** de la Fase 6 (los otros puntos de
la fase —estados de carga/error en la app, revisión de acoplamiento, repaso de cumplimiento— quedan
pendientes).

- **Integración = Prisma contra Postgres real, con Testcontainers (decisión con el usuario):** en vez
  de solo formalizar los dobles in-memory, los 8 `Prisma*Repository` se ejercitan contra un
  `postgres:16-alpine` efímero aplicando el **historial real de migraciones** (`migrate deploy`, no
  `db push`) para validar el SQL real (defaults, cascadas, SetNull, JSON/Bytes). 25 tests.
- **E2E backend = servidor real en proceso + Postgres real, por HTTP (no docker compose):** se levanta
  `buildServer` (composición de producción, MockProvider) sobre una BD de Testcontainers y se golpea
  por `fetch` a un puerto efímero. Más fiable y rápido que construir/arrancar la imagen Docker; el
  `docker compose up` reproducible lo cubre US-06 + el job de CI.
- **E2E app = Playwright sobre Expo web contra backend real en mock (decisión: "verdaderamente E2E"):**
  se sirve el `expo export` web estático y se **proxean** las llamadas de API al backend (mismo origen
  → sin CORS). Backend del E2E en el **3100** (el 3000 lo ocupa el compose). Export con `--clear` para
  reinlinar `EXPO_PUBLIC_API_URL` (Metro cachea). Localización por rol/nombre accesible (US-30).
- **Suites con Docker fuera del gate diario:** `test:integration` y `test:e2e` viven en configs Vitest
  aparte; `pnpm test`/`pnpm check` no exigen Docker. En **CI** (GitHub Actions, 3 jobs: gate +
  integración/E2E backend + E2E app) se ejecutan los tres niveles en cada push/PR.
- **Cumplimiento:** todo en `AI_PROVIDER=mock` (sin red ni IA externa); Testcontainers y Playwright son
  `devDependencies`. La narración (ElevenLabs) queda fuera del E2E mock (límite: sin clave no se sirve).
- Detalle del cómo y gotchas: [planes/fase-6.md](planes/fase-6.md), [estrategia-pruebas.md](estrategia-pruebas.md),
  [lecciones-aprendidas.md](lecciones-aprendidas.md).

## E2E web multinavegador y reporting (Feature 37 · 2026-06-24 · app v0.12.0 · US-37)

Rama `feature/37-e2e-web-multinavegador` (worktree desde `develop`). Amplía el E2E de la app (US-32)
sin tocar runtime: solo la config y los scripts de la suite Playwright de `packages/app`.

- **Tres `projects` Playwright (no dos motores nuevos):** `chromium` (`Desktop Chrome`, baseline),
  `mobile-chrome` (`Pixel 5`) y `mobile-safari` (`iPhone 13`). `mobile-safari` aporta el motor
  **WebKit** = el de iOS (el valor real de cobertura). `mobile-chrome` **no es un motor nuevo**:
  reusa el mismo Blink/Chromium; aporta **viewport móvil _portrait_** (que el flujo no se rompa en
  pantallas estrechas), no un segundo navegador.
- **Reporting rico (HTML + JSON + line):** `html` → `playwright-report/`, `json` →
  `test-results/results.json`, más `line` en consola. Permite revisar el fallo fuera de la consola
  (CI) y consumir el JSON desde otra herramienta.
- **Captura/vídeo/traza `retain-on-failure`, no `on-first-retry`:** con `workers: 1` y `retries: 0`
  (local), `on-first-retry` **no captura nada** porque no hay reintento; `*-on-failure` sí conserva
  la evidencia del primer (y único) intento. `retries: 1` se activa **solo en CI**
  (`process.env.CI ? 1 : 0`).
- **`e2e:install` instala `chromium webkit`:** `mobile-safari` necesita el binario de WebKit; sin él
  ese project no arranca. Los artefactos (`playwright-report/`, `test-results/`) se ignoran en
  `.gitignore`.
- **Cumplimiento intacto:** suite aparte (no entra en `pnpm check` ni en el arranque reproducible),
  modo `mock`, dependencias solo de desarrollo. La ejecución real de los tres proyectos requiere
  Docker + binarios y la verifica el usuario (`pnpm --filter @magyblob/app test:e2e`).
- **Pendiente (cierre con el usuario):** estrategia de coste en CI (solo `chromium` en el gate de PR,
  `mobile-*` en nightly por `--project`) — documentación/CI, no implementada aún.
