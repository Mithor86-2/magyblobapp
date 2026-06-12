# Control de Fases

Estado vivo del proyecto. Se actualiza al cerrar (o avanzar) cada fase. El detalle
del alcance vive en [plan-ejecucion-master.md](plan-ejecucion-master.md); aquí se
lleva el **qué está hecho y qué falta**.

**Definition of Done (todas las fases):** `pnpm check` verde
(typecheck + lint + format + tests) **y** `docker compose up` levanta la pila en limpio.

**Diseño del MVP:** las pantallas y el modelo de datos derivado están en
[Design/README.md](Design/README.md) (export de Stitch). Es la fuente de verdad de la UI.

**Historias de usuario y criterios de aceptación:** en
[historias-usuario/](historias-usuario/README.md) (un documento por épica; incluye
inconsistencias detectadas).

**Modelo de datos:** diagrama ER + value-objects + enums en
[modelo-datos.md](modelo-datos.md).

**Cumplimiento (app de menores):** reglas de tiendas y legales + checklist en
[cumplimiento-menores.md](cumplimiento-menores.md).

Leyenda: ✅ hecho · 🔄 en curso · ⬜ pendiente

---

## FASE 0 — Andamiaje y reproducibilidad ✅

Cerrada el 2026-06-10 · rama `feature/0-andamiaje`.

- [x] Monorepo pnpm workspaces (`packages/backend`, `packages/app`).
- [x] `docker-compose.yml`: backend + PostgreSQL 16 + Ollama (con healthchecks). _(El
      servicio Chroma se provisionó aquí y se retiró el 2026-06-12 al descartarse — ADR 0004.)_
- [x] `.env.example` completo + `scripts/setup-ollama.sh`.
- [x] ESLint + Prettier + Vitest configurados y funcionando.
- [x] `ollama pull gemma:2b` documentado (`pnpm ollama:setup` + README).
- [x] Backend Fastify con `/health` + test (`app.inject`).
- **DoD:** ✅ `pnpm check` verde · ✅ `docker compose up` levanta todo · `/health` → 200.

---

## FASE 1 — Núcleo del dominio y aplicación ✅

Cerrada el 2026-06-10 · rama `feature/1-dominio`. Campos según el diseño (ver
[Design/README.md](Design/README.md)) y [modelo-datos.md](modelo-datos.md).

- [x] `Guardian` (adulto responsable): `nombre`, `apellidos`, `email`, `parentesco`,
      `telefono?` + consentimiento (`consentimientoDado/En/Ver`). Todo niño cuelga de uno.
- [x] `ChildProfile`: `guardianId`(FK), `nombre`, `edad`(VO), `idioma`(VO), `avatar`, `intereses[]`.
- [x] `Story`: entrada `{perfil, tema, estilo}` → salida `{título, cuerpo}` + metadatos
      (estado `nuevo|leído`, fecha). El cuento se genera en `perfil.idioma`.
- [x] `Activity` (generada con IA): `categoría`, `título`, `descripción`, `duración`,
      `nivel`; progreso como estado (`completadaEn`, valoración) — sin entidad extra.
- [x] Vocabulario único de temática (`animales | espacio | magia | aventuras | música`)
      compartido por `intereses` y `tema`; los intereses pre-seleccionan el tema.
- [x] Value-objects solo para `edad` (rango 2–6) e `idioma` (ES/EN); el resto escalares (YAGNI).
- [x] Interfaces de repositorio en `/domain` (+ interfaz `AIProvider`).
- [x] Casos de uso `RegisterGuardian` (con consentimiento), `CreateChildProfile` y
      `ListProfiles` + tests; `GenerateStory` (su `AIProvider` se implementa en Fase 2).
- [x] DTOs de entrada/salida de los casos de uso.
- **DoD:** ✅ 29 tests verdes (`pnpm check`) · ✅ cero dependencias externas en `/domain`
  (frontera de capas reforzada en ESLint).

---

## FASE 2 — Capa de IA (el corazón) ✅

Cerrada el 2026-06-10 · rama `feature/2-capa-ia`. Implementaciones en
`src/infrastructure/ai/` (la interfaz `AIProvider` ya vivía en `/domain` desde Fase 1).

- [x] Interfaz común `AIProvider` (de Fase 1): `generateStory` en el idioma del perfil;
      `recommendActivities`.
- [x] `MockProvider`: determinista, sin red — modo por defecto (evaluador sin GPU),
      red de seguridad del fallback y base de tests.
- [x] `OllamaProvider` contra `gemma:2b` vía `POST /api/generate` (sin streaming,
      `format` con esquema JSON para salida estructurada fiable, timeout con `AbortSignal`).
- [x] Selección de modo por env en `createAIProvider` (`mock | local`). _(Hubo un tercer
      modo `cloud` que avisaba y caía a mock; se retiró del alcance el 2026-06-12 — ADR 0002.)_
- [x] `FallbackProvider` envuelve al proveedor activo y cae a `MockProvider` ante
      cualquier fallo (caído/timeout/JSON inválido), registrando un `warn`.
- [x] Prompts (`prompts.ts`) como plantillas bilingües con valores por defecto en
      código + instrucción de seguridad para menores; en Fase 3 pasan a `AppSetting`.
- **DoD:** ✅ 45 tests verdes (`pnpm check`: Mock/Ollama/Fallback/factoría) ·
  ✅ smoke test del `OllamaProvider` (`pnpm ai:smoke`) ejecutado contra `gemma:2b` real
  (Docker): cuento en el idioma del perfil + 3 actividades con categorías válidas, salida
  estructurada parseada OK. La calidad del texto es la propia de un modelo de 2B.

---

## FASE 3 — Persistencia y API HTTP ✅

Cerrada el 2026-06-10 · rama `feature/3-persistencia-api`.

- [x] Repos PostgreSQL (Prisma) de `Guardian`, `ChildProfile` y `Story` con mappers
      fila↔entidad; repos de `InteractionEvent`, `AuditLog` y `Settings`.
- [x] Migración inicial (`prisma/migrations/…_init`) + seed de `AppSetting` (idempotente).
- [x] Tablas `InteractionEvent` (evento `cuento_generado`) y `AuditLog`
      (`consentimiento` en alta de adulto, `crear` en alta de perfil), escritas en la
      frontera HTTP (no se acopla la aplicación a la trazabilidad transversal).
- [x] Tabla `AppSetting` (clave-valor) + seed de prompts, ids de modelo y parámetros;
      el `OllamaProvider` lee plantilla/temperatura en caliente con fallback a código.
      Secretos siguen en env, nunca en DB.
- [x] Rutas: `POST /guardians`, `GET /guardians/:id/profiles`, `POST /profiles`,
      `POST /stories` con validación de esquema (vocabularios cerrados) en la entrada.
- [x] Manejo de errores centralizado (`DomainError`→400, `NotFoundError`→404,
      `ConflictError`→409, validación→400, resto→500) con cuerpo uniforme.
- [x] Logs estructurados (pino) ya de Fase 0; errores 5xx se registran.
- [x] Inyección de dependencias: `buildServer(config, deps?)`; tests con repos en
      memoria vía `app.inject` (sin DB), producción con `buildProductionDeps` (Prisma)
      cargado por import dinámico.
- **DoD:** ✅ test de integración de `POST /stories` en verde (flujo completo por HTTP) ·
  ✅ 58 tests (`pnpm check`) · ✅ `docker compose up` levanta la pila, aplica migraciones
  al arrancar (`migrate deploy`) y el flujo alta→perfil→cuento responde 201 · ✅ validado
  además contra PostgreSQL real en local (repos Prisma, audit y eventos persistidos).

---

## FASE 4 — Slice vertical en la app móvil ★ HITO 1 ✅

Cerrada el 2026-06-11 · rama `feature/4-app-slice`. App `@magyblob/app` v0.1.0.
Referencia visual: pantallas _Crear perfil_ y _Generador de cuentos_ +
design system (Quicksand, paleta coral/menta, tap targets ≥64px) en
[Design/README.md](Design/README.md).

- [x] Expo SDK 56 + React Navigation v7 (native-stack) + Zustand configurados;
      `metro.config.js` puentea la resolución de paquetes del monorepo pnpm.
- [x] Onboarding mínimo del adulto (decisión de fase): pantalla **Consent** con puerta
      parental + alta de `Guardian` y consentimiento (`POST /guardians`); el `guardianId`
      se persiste (AsyncStorage). Cumple C-1/C-6 de [cumplimiento-menores.md](cumplimiento-menores.md).
- [x] Pantalla **Crear perfil** conectada al backend (`POST /profiles`): nombre, edad (2-6),
      idioma (ES/EN), avatar e intereses (multi-selección).
- [x] Pantalla **Generador de cuentos** (`POST /stories`) con estados de carga/error/reintento;
      la app es **agnóstica del proveedor** (la "IA local real" la aporta el backend con
      `AI_PROVIDER=local`, Ollama `gemma:2b`).
- [x] Cliente HTTP único (`src/api/`) + test (Vitest) del contrato de cable.
- **DoD:** ✅ `pnpm check` verde (typecheck app+backend, lint, formato, **63 tests**: app 5 +
  backend 58) · ✅ bundle de la app validado con `expo export` (Metro resuelve el monorepo, sin
  `nodeLinker: hoisted`) · ✅ **demo en vivo verificada** (`AI_PROVIDER=local`, Ollama `gemma:2b`):
  el flujo completo dejó rastro en PostgreSQL — `guardians` (consentimiento `Ver=1.0`),
  `audit_logs` (`consentimiento` + `crear`), `child_profiles` (avatar `zorro`, intereses
  `{animales, musica}`), `stories` ("Joaquin y los animales", en español) e `interaction_events`
  (`cuento_generado`). Cuento generado por el modelo local real (prosa propia de un 2B).
- **Post-cierre (2026-06-11, app v0.1.1, rama `feature/app-clean-arch`):** refactor del app a
  **Clean Architecture ligera** (`domain` / `infrastructure` / `presentation` + composition
  root), sin cambio de comportamiento; gate verde y bundle validado. Detalle en [memory.md](memory.md).

---

## FASE 5 — Resto de funcionalidad ✅

Cerrada el 2026-06-12. Se ejecutó por **features secuenciales** (plan en
[planes/fase-5.md](planes/fase-5.md)). **CloudProvider y Chroma se retiraron del alcance**
(2026-06-12): el proyecto se queda con los modos de IA `mock`/`local` (privacidad por diseño,
sin clave en la nube) y con el **dedup simple por título** para no repetir actividades (Chroma
no gana su sitio — YAGNI).

- [x] **F1 Actividades end-to-end** (2026-06-11, US-09 · backend v0.1.0 / app v0.2.0 ·
      rama `feature/5-actividades`): caso de uso `RecommendActivities` (con dedup simple por
      título) + `ActivityRepository` (Prisma) + ruta `POST /activities/recommend`; en la app,
      **tab navigator** (pestañas Cuentos y Actividades) + pantalla **Actividades** con
      `ActivityCard`. Verificado: `pnpm check` (73 tests), `expo export`, y e2e contra
      PostgreSQL real (3 actividades persistidas + dedup devuelve `[]` en la 2ª llamada).
- [x] **F2 Historial + Progreso** (2026-06-12, US-07/08/10 · backend v0.2.0 / app v0.3.0 ·
      rama `feature/5-historial-progreso`): casos de uso `GetHistory`, `MarkStoryRead` y
      `CompleteActivity` (+ rutas `GET /profiles/:id/history`, `POST /stories/:id/read`,
      `POST /activities/:id/complete`); en la app, **4 pestañas** (Inicio·Actividades·Cuentos·
      Historial), pantallas **Inicio** e **Historial**, y valoración con estrellas (`StarRating`).
      Verificado: `pnpm check` (87 tests), `expo export`, y e2e contra PostgreSQL (cuento→leído,
      actividad→completada con estrellas, validación 400, historial coherente).
- ~~F3 CloudProvider · F4 Chroma~~ — **retiradas del alcance** (ver nota arriba).
- **DoD:** ✅ casos de uso (`RecommendActivities`, `GetHistory`, `MarkStoryRead`,
  `CompleteActivity`) y pantallas (Inicio · Actividades · Cuentos · Historial) operativos y
  testeados; `pnpm check` verde (88 tests) y verificado e2e contra PostgreSQL.

---

## FEATURE 14 — Proveedor cloud (US-14, reactivada) ✅

Cerrada el 2026-06-12 · rama `feature/14-proveedor-cloud` · backend v0.3.0. **Reabre** la retirada
del CloudProvider de la Fase 5: a petición del usuario se reintroduce el modo `cloud`, pero como
**opt-in OFF por defecto y conmutable en caliente desde BD** (no rompe el default `mock`/`local`).
Plan en [planes/14-proveedor-cloud.md](planes/14-proveedor-cloud.md); decisión en
[ADR 0002](ADR/0002-tres-modos-de-ia.md) y [memory.md](memory.md).

- [x] `CloudProvider` compatible OpenAI (`/chat/completions`, `response_format: json_object`,
      `AbortSignal`) que sirve a cualquier proveedor del dialecto (Groq, Gemini, OpenRouter,
      Cerebras) vía registro de presets (`cloudPresets.ts`). Reutiliza prompts y el parseo/saneo
      compartido `parseResponse.ts`.
- [x] Selección **por BD** (`AppSetting` clave `ai.cloud` = `{activo,target,model}`, validada en
      `cloudSettings.ts`); `HotSwapAIProvider` la resuelve **por petición** (cambio en caliente sin
      reiniciar) con fallback a mock. Cloud **no** se activa por `AI_PROVIDER` (privacidad por
      defecto); las API keys van en env (`config.cloudApiKeys`), nunca en BD.
- [x] `docker-compose.yml` pasa `<TARGET>_API_KEY` al backend (vacías por defecto); seed de
      `ai.cloud` desactivado; `.env.example` documentado.
- [x] Cumplimiento: C-5 pasa a "✔ por defecto / Cond. en `cloud`"; documentados datos minimizados,
      riesgo de entrenamiento de free tiers e incompatibilidad con Apple Kids.
- **DoD:** ✅ `pnpm check` verde (92 tests: `CloudProvider`, `cloudSettings`, factoría hot-swap) ·
  ✅ smoke `pnpm ai:smoke:cloud` contra **Groq** real · ✅ **e2e por la pila**: `POST /stories` con
  `ai.cloud` activa → prosa de Groq; desactivada en BD **sin reiniciar** → cae al base → hot-swap
  demostrado.
- **Diferido a sub-feature posterior:** UI admin (tras puerta parental) para cambiar `ai.cloud` sin
  SQL + `AuditLog` del cambio.

---

## FASE 5.5 — Sesión del guardián y multi-perfil ⬜

Hoy la app solo persiste `guardianId` tras el consentimiento: no hay forma de que un
guardián que vuelve (o en otro dispositivo) recupere su cuenta, ni de elegir entre varios
hijos, ni de cerrar sesión. Esta fase añade una **sesión de guardián** completa, separando la
zona de adultos (tras puerta parental) de la zona infantil. Se ejecuta por **features
secuenciales** (plan en `planes/fase-5-5.md` cuando se abra). Refuerza el cumplimiento
(C-1/C-6): identificación del adulto + puerta parental.

> Limitación reconocida (coherente con [cumplimiento-menores.md](cumplimiento-menores.md)): el
> "login" es una **identificación ligera por email** (sin contraseña ni verificación robusta de
> edad), que queda fuera del alcance del TFM y se declara como tal.

**F1 — Identificar al guardián (backend).**

- [ ] Caso de uso `LoginGuardian` (identifica por email vía `GuardianRepository.findByEmail`,
      ya existente) + DTO; `NotFoundError` si no hay cuenta con ese email.
- [ ] Ruta `POST /guardians/login` (o `GET /guardians?email=`) con validación de esquema +
      test de caso de uso (dobles in-memory) y test de integración de la ruta.

**F2 — Sesión y selección de perfil activo (app).**

- [ ] Store: ampliar la sesión persistida — guardar el `guardian` (no solo el id) y el
      `activeProfileId`; `currentProfile` deja de ser solo de sesión.
- [ ] Gateway/uso de `GET /guardians/:id/profiles` (ListProfiles, ya en backend) para listar
      los hijos del guardián.
- [ ] Pantalla **Seleccionar perfil** (lista de hijos + "crear nuevo"); fija el `currentProfile`.
      Corresponde al "Ver perfiles" del diseño de Inicio.
- [ ] Onboarding revisado: sin sesión → Consent (alta) **o** "Ya tengo cuenta" → login por email;
      con sesión → selección de perfil → pestañas.

**F3 — Área parental y cierre de sesión (app).**

- [ ] Zona de adultos protegida por la **puerta parental** (componente ya existente) para gestión
      de cuenta/perfiles, separada de la zona infantil.
- [ ] Acción **Cerrar sesión / cambiar guardián** (reset del store → vuelve al onboarding).

- **DoD:** un guardián puede registrarse, salir y volver a entrar por email recuperando su
  sesión; elegir entre sus hijos; acceder a la zona de adultos solo tras la puerta parental; y
  cerrar sesión. `pnpm check` verde + bundle (`expo export`) + e2e del login contra PostgreSQL.

---

## FASE 6 — Calidad y robustez ★ HITO 2 ⬜

- [ ] Test por cada caso de uso y cada endpoint (significativo).
- [ ] Estados de carga/error y timeouts de IA en la app.
- [ ] Revisión de acoplamiento, nombres y separación de capas.
- [ ] Repaso del checklist de cumplimiento para menores (parental gate, sin terceros,
      minimización, conservación) — ver [cumplimiento-menores.md](cumplimiento-menores.md).
- **DoD:** suite completa en verde; app no rompe ante fallos de IA o red.

---

## FASE 7 — Documentación y defensa ⬜

- [ ] Prueba del repo en limpio en otra carpeta/máquina.
- [ ] README profesional + guías instalación/ejecución/pruebas.
- [x] 3-4 ADRs: Clean Architecture, 3 modos de IA, Gemma 2B por defecto, Vector DB
      (adelantados a Fase 0; ver [ADR/](ADR/) — repasar en la defensa).
- [ ] Diagrama de arquitectura.
- [ ] Guion de demo y respuestas a preguntas del tribunal.
- **DoD:** clonar → `docker compose up` → app corriendo, sin pasos ocultos.

---

## FASE DE MEJORAS — Pulido visual y de experiencia ⬜

Mejoras posteriores al núcleo funcional: reemplazar los _placeholders_ (emojis) por
recursos gráficos propios, reforzar la personalización por niño y completar interacciones
de cuentos/actividades. Se ejecutará por **features secuenciales** (plan en `planes/` cuando
se abra). Algunas parten de algo ya existente (se indica).

**Recursos visuales (imágenes propias en vez de emojis):**

- [ ] **Avatares con imagen.** Crear un set de imágenes para los avatares e implementarlas en
      la app (hoy `AvatarPicker` usa emojis con `id` ASCII; sustituir por assets locales sin
      romper el `avatar` que se guarda en el perfil). Sin descargas en runtime (cumplimiento).
- [ ] **Imágenes de temas y estilos de cuento.** Ilustraciones para los temas
      (`animales · espacio · magia · aventuras · música`) y los estilos
      (`aventura · divertido · educativo`), usadas en el selector y en la cabecera del cuento.
- [ ] **Iconos del menú (pestañas).** Reemplazar los emojis de las 4 pestañas
      (Inicio · Actividades · Cuentos · Historial) por iconos propios, conservando el "blob"
      activo.

**Funcionalidad y personalización:**

- [ ] **Personalización por niño en cuentos y actividades.** Reforzar los prompts para usar de
      forma explícita `nombre`, `edad` e `intereses` del perfil (hoy el prompt ya recibe el
      perfil, pero conviene afinar tono/dificultad por edad y temática por intereses). Afecta a
      `prompts.ts` / `AppSetting`; verificar en `mock` y `local`.
- [ ] **Releer cuento desde el Historial.** Al tocar un cuento en el Historial, abrir una
      vista de lectura con su `título`+`cuerpo` (pantalla de detalle nueva) y marcarlo `leído`
      al abrirlo (US-07/08). Hoy el Historial solo lista y permite "marcar leído".
- [ ] **Botón "Realizado" en actividades.** Añadir un botón explícito para marcar una actividad
      como hecha, además de la valoración por estrellas (hoy se completa tocando directamente las
      estrellas). Flujo sugerido: "Realizado" → pide la valoración (1-3) → `complete`.

- **DoD:** assets integrados sin romper el contrato de datos; cuentos/actividades notablemente
  personalizados por perfil; releer desde Historial y botón "Realizado" operativos; `pnpm check`
  verde + bundle + pruebas con el usuario.
