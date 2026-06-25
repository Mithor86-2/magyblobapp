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

## FASE 5.5 — Sesión del guardián y multi-perfil ✅

Cerrada el 2026-06-12 · rama `feature/5-5-sesion-guardian` · backend v0.4.0 / app v0.4.0.
Añade una **sesión de guardián** completa (login ligero por email, selección de perfil activo,
zona de adultos tras puerta parental, cierre de sesión), separando la zona de adultos de la
infantil. Plan en [planes/fase-5-5.md](planes/fase-5-5.md). Cubre **US-19** (login del adulto) y
**US-02** (listar/seleccionar perfiles). Refuerza el cumplimiento (C-1/C-6).

> Limitación reconocida (coherente con [cumplimiento-menores.md](cumplimiento-menores.md)): el
> "login" es una **identificación ligera por email** (sin contraseña ni verificación robusta de
> edad), que queda fuera del alcance del TFM y se declara como tal.

- [x] **F1 — Identificar al guardián (backend).** Caso de uso `LoginGuardian` (por email vía
      `GuardianRepository.findByEmail`) + ruta `POST /guardians/login` (validación por `pattern`) +
      `AuditLog accion=login` en la frontera HTTP. El email se **normaliza** (recorte + minúsculas)
      en la entidad `Guardian`, y alta y login normalizan la clave de búsqueda. Tests de caso de uso
      e integración (200/404/400).
- [x] **F2 — Sesión y selección de perfil (app).** Store persiste el `guardian` completo y el
      `currentProfile` activo (antes solo `guardianId`); migración de persistencia a v1. Gateways
      `guardians.login` y `profiles.list`. Pantallas **Bienvenida**, **Login** y **Seleccionar
      perfil** (carga/error/reintento); onboarding por stack Bienvenida → (alta/login) → selección
      → pestañas.
- [x] **F3 — Área parental y cierre de sesión (app).** Puerta parental extraída a componente
      reutilizable `ParentalGate`. Zona de adultos (`ParentalScreen`) accesible desde Inicio, tras
      la puerta parental, con **cambiar de perfil** (`clearProfile`) y **cerrar sesión** (`logout`).
- [x] **Extra:** salida a registro desde Login para un adulto sin cuenta (enlace + acción en el
      aviso), para no dejar sin salida el onboarding.
- **DoD:** ✅ `pnpm check` verde (99 backend + 11 app) · ✅ bundle (`expo export`) · ✅ verificado
  e2e contra PostgreSQL (alta → login por email recuperando sesión → selección de perfil → cerrar
  sesión; `AuditLog login` persistido).
- **Diferido a la Fase de mejoras:** modal propio en lugar de `Alert` del sistema; header con
  botón "atrás"; indicador de **Autor (proveedor de IA: mock/local/cloud)** en cuentos y actividades.

---

## FASE 6 — Calidad y robustez ★ HITO 2 🟡 (en curso)

- [x] **Pruebas de integración, E2E y CI (US-32, rama `feature/34-integracion-e2e-ci`).** Integración
      de los 8 `Prisma*Repository` contra **Postgres real** con Testcontainers (25 tests); **E2E de
      backend** por HTTP real + Postgres real en mock (3 tests); **E2E de app** con Playwright sobre
      Expo web contra el backend real en mock (1 test); **CI** en GitHub Actions (gate + integración +
      E2E). Estrategia y guía TDD en [estrategia-pruebas.md](estrategia-pruebas.md). Verificado en
      local: gate verde, integración 25/25 y E2E (backend 3/3, app 1/1).
- [ ] Test por cada caso de uso y cada endpoint (significativo) — base cubierta; repaso de huecos
      pendiente.
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

- [x] ✅ **Personalización por niño en cuentos y actividades** (US-26, rama
      `feature/funcionalidad-personalizacion`). Los prompts usan `nombre`/`edad`/`intereses` y afinan
      el **tono por tramo de edad**. Además, parámetros configurables en `AppSetting`
      (`prompt.story.params`): longitud, rima y **formato elegido al azar** por cuento
      (`cuento·fábula·poema·adivinanza`) para más dinámica. Solo backend; verificado en `mock`/`local`.
- [x] ✅ **Releer cuento desde el Historial** (US-27, misma rama). Al tocar un cuento se abre la vista
      de lectura (`StoryReaderScreen`: título+cuerpo+Autor) y se marca `leído` al abrirla.
- [x] ✅ **Reglas narrativas del cuento / prompt maestro** (US-28, backend v0.8.0, rama
      `feature/28-reglas-prompt-cuento`). El system prompt de `generateStory` (en código, **por
      idioma** ES/EN) añade estructura (presentación · situación · amigo que ayuda · resolución ·
      enseñanza final), tono tierno, onomatopeyas suaves y final feliz y tranquilo. Amplía US-26 sin
      tocar el contrato HTTP; solo `local`/`cloud`. Verificado con cuentos reales: en `cloud` (Groq
      70B) cumple y respeta el idioma; en `local` (modelos 2-3B) sale en español (limitación asumida).
- [x] ✅ **Narrar cuento en voz alta** (US-22, backend v0.7.0 / app v0.8.0, rama
      `feature/22-narracion-cuentos-elevenlabs`).
      Botón "▶ Escuchar/⏸/⏹" en el Generador y en la vista de lectura del Historial. Motor principal
      **ElevenLabs** (`eleven_multilingual_v2`, voz por idioma) servido por el **backend como proxy**
      (`GET /stories/:id/narration` → `audio/mpeg`); el MP3 se **persiste/cachea** (`StoryNarration`,
      migración Prisma) y se sintetiza una sola vez por cuento. La app reproduce con `expo-audio` y
      **degrada a la voz nativa** del dispositivo (`expo-speech`) si ElevenLabs falla, sin error
      visible. **Desviación de cumplimiento asumida (TFM):** narrar envía el texto del cuento (con el
      nombre del niño) a un tercero → rompe C-2/C-5 e incompatible con Apple Kids; documentado en
      `cumplimiento-menores.md` (C-11) y US-22. `pnpm check` verde (118 backend + 12 app) + bundle.
- [x] ✅ **Botón "Realizado" en actividades** (US-10 ampliada, misma rama). En `ActivityCard`, botón
      explícito que revela la valoración (1-3) y al elegirla llama a `complete`; el atajo de tocar
      las estrellas se conserva.

**UX y navegación (diferido de la Fase 5.5):**

- [x] ✅ **Modal propio en vez de `Alert` del sistema** (US-23, app v0.5.0, rama
      `feature/mejoras-ux-navegacion`). `DialogProvider`/`useDialog` (`alert`/`confirm`) con `<Modal>`
      temático; variante `danger` en `BubblyButton`. Cero `Alert.alert` del sistema en `src/`.
- [x] ✅ **Header con botón "atrás"** (US-24, misma rama). Cabecera temática del stack con "atrás" en
      Crear cuenta · Iniciar sesión · Elegir perfil · Crear perfil · Zona de adultos; Bienvenida y
      las pestañas (zona infantil) sin cabecera; sin títulos duplicados.
- [x] ✅ **Autor (proveedor de IA) en cuentos y actividades** (US-25, backend v0.5.0 / app v0.6.0,
      rama `feature/autor-proveedor-ia`). La capa de IA propaga el proveedor **efectivo** (`mock` |
      `local` | `cloud`, incluido el fallback a mock) y se **persiste** en `Story`/`Activity`
      (migración Prisma); el contrato HTTP lo devuelve. En la app, `AuthorBadge` ("Autor:" + icono
      🎭/🖥️/☁️) en el generador, en cada `ActivityCard` y en el Historial. Verificado e2e:
      timeout de Ollama ⇒ "Simulada"; modelo caliente ⇒ "IA local".
- [x] ✅ **Iconografía consistente con lucide-react-native** (US-29, app v0.9.0, rama
      `feature/29-iconos-lucide` desde `develop`). Wrapper central `Icon` (nombres semánticos →
      iconos SVG de Lucide, consume tokens de tema; tokens `iconSize`); `BubblyButton` admite icono y
      botón solo-icono. Sustituidos los **emojis funcionales** (pestañas, narración play/pausa/stop,
      estrellas, flecha "Leer cuento", zona de adultos, categorías de actividad y badges de "Autor").
      Los **avatares de animales** (y el `✨` por defecto) siguen en emoji por calidez. Cumple las
      reglas de menores (iconos empaquetados en build-time, sin red en runtime ni SDK de tercero).
      Solo app; `pnpm check` verde (122 backend + 12 app).
- [x] ✅ **Pruebas user-centric de componentes** (US-30, app v0.10.0, rama
      `feature/30-tests-componentes` desde `develop`). Se introduce el arnés de render bajo Vitest
      aliasando `react-native` → `react-native-web` (+ `@testing-library/react` + `jsdom`, todo
      `devDependencies`) y se prueban **11 componentes** (`BubblyButton`, `ParentalGate`, `TextField`,
      `SelectableChip`, `StarRating`, `AvatarPicker`, `AuthorBadge`, `ActivityCard`,
      `NarrationControls`, `Screen`, `DialogProvider`) por rol/etiqueta/texto y simulación de
      pulsaciones (Query Priority de Testing Library). `Icon` queda fuera (lucide-react-native no
      importa bajo Vitest; se mockea). Entorno `node` por defecto (test de `http` intacto); cada test
      de componente usa `@vitest-environment jsdom`. Solo app; `pnpm check` verde (126 backend + 41 app).
- [x] ✅ **E2E web multinavegador y reporting** (US-37, app v0.13.0, rama
      `feature/37-e2e-web-multinavegador` desde `develop`). Amplía el E2E de la app (Playwright sobre
      el export web de Expo, US-32) a **tres `projects`**: `chromium` (baseline), `mobile-chrome`
      (Pixel 5, viewport móvil _portrait_, mismo motor Chromium) y `mobile-safari` (iPhone 13, motor
      **WebKit** = el de iOS). **Reporting rico**: HTML (`playwright-report`) + JSON
      (`test-results/results.json`) + line, y ante fallo se conservan captura/vídeo/traza
      (`*-on-failure`); `retries: 1` solo en CI. `e2e:install` instala `chromium webkit` y el
      `.gitignore` ignora los artefactos. Suite aparte (no toca el arranque reproducible); solo app,
      dependencias de desarrollo. Gate `pnpm check` verde (139 backend + 41 app); la ejecución real de
      los tres proyectos requiere Docker + binarios y la verifica el usuario.
- [x] ✅ **E2E web de actividades e historial** (US-39, app v0.14.0 / raíz v0.21.0, rama
      `feature/40-e2e-actividades-historial` desde `develop`). Amplía la cobertura E2E de la app
      (Playwright sobre el export web de Expo, US-32/US-37) más allá del onboarding: reutilizando el
      helper que lleva a perfil + cuento generado, recorre la pestaña **Actividades** (generar
      actividades recomendadas y marcar una como "Realizado" con valoración → "¡Hecha!", US-09/US-10) y
      la pestaña **Historial** (el cuento generado aparece en "Cuentos mágicos", US-08). Contra el
      backend real en modo `mock` (contenido determinista), localizando por rol/etiqueta accesible. Se
      mantiene como **US aparte** de la multinavegador (US-37): aquella amplía _dónde_ corre el E2E
      (motores/viewports), ésta amplía _qué_ flujos cubre. Suite aparte (no toca el arranque
      reproducible); solo app, dependencias de desarrollo. Gate `pnpm check` verde; la ejecución real
      (`test:e2e`) requiere Docker + binarios y la verifica el usuario.

**Calidad y tooling:**

- [x] ✅ **Análisis estático de calidad con SonarJS** (US-31, backend v0.9.0 / raíz v0.13.0, rama
      `feature/31-sonarjs` desde `develop`). Se añade `eslint-plugin-sonarjs` (devDependency raíz) y se
      habilita su config `recommended` en la flat config de ESLint → **268 reglas `sonarjs/*` activas**
      (complejidad cognitiva, expresiones idénticas, ramas colapsables…) dentro del gate `pnpm lint`.
      Sin _typed linting_ (`recommended` no lo exige; las reglas de tipos no aplican pero no rompen el
      lint). 18 incidencias saneadas: refactors (regex de combinadores en `sanitizeForSpeech`,
      `toHaveLength` en un test), una supresión en línea justificada (regex de email,
      `super-linear-regex`) y tres reglas desactivadas con justificación escrita (`todo-tag`,
      `void-use`, `no-nested-conditional`), más `no-clear-text-protocols` off solo en tests. Frontera
      de capas intacta. Solo backend; `pnpm check` verde (126 backend + 41 app).

- [x] ✅ **Observer para telemetría y auditoría** (US-17, backend v0.10.0 / raíz v0.14.0, rama
      `feature/33-observer-event-bus` desde `develop`). Auditados los patrones del repo: Strategy,
      Factory y Decorator (capa AI) ya estaban; Command está implícito en los casos de uso. Único
      patrón que pagaba su coste → **Observer**: la emisión de `InteractionEvent`/`AuditLog` estaba
      duplicada en 6 handlers HTTP. Se introduce un bus en proceso (`EventBus` + `DomainEvent` en
      `domain/events`; `InMemoryEventBus` + `wireDomainEvents` en `infrastructure/events`) cableado en
      el composition root; las rutas hacen `deps.bus.publish(...)`. Sin cambio de comportamiento ni de
      esquema (mismos eventos persistidos); el bus notifica en serie y propaga errores. +9 tests (bus +
      suscriptores). De paso, `.claude/**` a los ignores de ESLint y `.claude/worktrees/` a `.gitignore`
      (los worktrees paralelos no contaminan el gate). `pnpm check` verde (144 backend + 41 app).

- [x] ✅ **Cobertura estratégica por riesgo de negocio (Strategic Coverage 100/80/0)** (US-35, rama
      `feature/35-strategic-coverage` desde `develop`). La cobertura se gobierna por riesgo de negocio,
      no por un % global: umbrales **por _glob_** en `vitest.config.ts` (provider `v8`) — **100%** en el
      tier CORE (saneo de salida del LLM `parseResponse`, `FallbackProvider`/`createAIProvider`/
      `MockProvider`, casos de uso, value-objects, entidades; app: `http`, `sanitizeForSpeech`,
      `useAppStore`) y **80%** de baseline IMPORTANT; el tier INFRASTRUCTURE y lo cubierto por otras
      suites (repos Prisma, ElevenLabs, `useNarration` nativo, pantallas → E2E) se **excluyen** de la
      medición (documentado, no truncado silencioso). Se cierra el hueco CORE detectado (`parseResponse`
      sin test) + invariantes de entidades + ramas sueltas. Nuevo `pnpm coverage`, que el job **gate**
      del CI hace cumplir (el `pnpm check` local sigue rápido). `pnpm check` + `pnpm coverage` verdes
      (192 backend + 58 app).

- **DoD:** assets integrados sin romper el contrato de datos; cuentos/actividades notablemente
  personalizados por perfil; releer desde Historial, narración por voz (US-22) y botón "Realizado"
  operativos; `pnpm check` verde + bundle + pruebas con el usuario.
