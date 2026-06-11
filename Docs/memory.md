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
[historias-usuario.md](historias-usuario.md)):

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

## Pendientes de decidir (cuando toque)

- Chroma: ¿aporta para recomendación por similitud? Decidir en Fase 5; si no, dejar
  documentado por qué se omite (regla YAGNI > completitud del plan).
- CloudProvider: elegir **uno** (Claude u OpenAI). Solo se activa si hay clave. Para
  la ruta cloud usar los modelos Claude más recientes (ver skill `claude-api`).
