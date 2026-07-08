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
>
> **Revertida después por US-48** (lote de Mejoras, rama `feature/52-password-login`): el alta guarda
> un **hash de la contraseña** y el login la **verifica**. La parte de contraseña deja de ser
> limitación; persiste solo la verificación robusta de **edad**.

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

## FASE 6 — Calidad y robustez ★ HITO 2 ✅

- [x] **Pruebas de integración, E2E y CI (US-32, rama `feature/34-integracion-e2e-ci`).** Integración
      de los 8 `Prisma*Repository` contra **Postgres real** con Testcontainers (25 tests); **E2E de
      backend** por HTTP real + Postgres real en mock (3 tests); **E2E de app** con Playwright sobre
      Expo web contra el backend real en mock (1 test); **CI** en GitHub Actions (gate + integración +
      E2E). Estrategia y guía TDD en [estrategia-pruebas.md](estrategia-pruebas.md). Verificado en
      local: gate verde, integración 25/25 y E2E (backend 3/3, app 1/1).
- [x] Test por cada caso de uso y cada endpoint (significativo) — **auditoría 2026-06-25**: 10/10 casos
      de uso y 10/10 endpoints con test (solo `GET /health` trivial sin test). Sin huecos.
- [x] Estados de carga/error y timeouts de IA en la app (US-43, app v0.20.0 / raíz v0.27.0, rama
      `feature/44-robustez-red-app`). Timeout con `AbortController` en `http.ts` (15 s / 30 s
      generación → `ApiError('timeout')`) y en la narración (15 s, degrada a voz nativa); botón
      «Reintentar» en el Historial. Cierra el agujero del DoD. Tests del timeout en `http.test.ts`.
- [x] **Sesión autenticada con JWT (US-45, rama `feature/48-jwt-sesion`).** `@fastify/jwt` v10 con
      secreto único + claim `type` (access corto ~15m / refresh largo ~7d, stateless); el alta y el
      login emiten la sesión, `POST /guardians/refresh` la renueva y un decorador `authenticate`
      (`onRequest`) protege las rutas de datos (401 sin token; públicas: health, alta, login,
      refresh). La app persiste los tokens en el store (migración v2), adjunta `Authorization:
Bearer`, renueva ante 401 y cierra sesión si el refresh falla. Sin contraseña (identificación
      ligera intacta); JWT no añade terceros ni red externa (no afecta C-2/C-5). `pnpm check` verde
      (203 backend + 98 app); `http.ts`/`auth.ts` 100% cobertura.
- [x] Revisión de acoplamiento, nombres y separación de capas — **auditoría 2026-06-25**: backend sin
      violaciones (ESLint de capas activo, `/domain` sin dependencias externas), vocabulario ES/EN
      coherente. La app usa Clean Arch _ligera_ (el store importa infra a propósito; mejora opcional).
- [x] Repaso del checklist de cumplimiento para menores — **auditoría 2026-06-25**: parental gate,
      borrado en cascada, minimización y Sentry (C-12, `setActiveChildName` cableado) ✅; desviaciones
      cloud/ElevenLabs/Sentry documentadas. **C-9** (conservación) **documentada** (rama
      `feature/47-politica-retencion-c9`): retención `InteractionEvent` 90 d / `AuditLog` 365 d, purga
      automática diferida a Fase 7. **C-7** (política de privacidad) es entregable de **Fase 7** por
      diseño — ver [cumplimiento-menores.md](cumplimiento-menores.md).
- **DoD:** suite completa en verde ✅; app no rompe ante fallos de IA o red ✅ (US-43); checklist de
  cumplimiento revisado ✅ (C-7 → Fase 7). **HITO 2 cerrado.**

---

## FASE 7 — Documentación y defensa 🔄

En curso. El plan detallado de la entrega (los 5 entregables del formulario) vive en
[planes/fase-7-entrega-tfm.md](planes/fase-7-entrega-tfm.md); ahí está el gap analysis y el estado
tarea a tarea. Verificación plan↔app **2026-07-08**: producto en **v1.16.1** (backend v1.13.0),
repo público, Render vivo, releases hasta v1.16.0.

- [ ] Prueba del repo en limpio en otra carpeta/máquina (DoD; verificación manual pendiente).
- [x] README profesional + guías instalación/ejecución/pruebas (descripción, stack, estructura por
      capas, instalación Docker/dev build, modos de IA, API, despliegue).
- [x] 3-4 ADRs: Clean Architecture, 3 modos de IA, Gemma 2B por defecto, Vector DB
      (adelantados a Fase 0; ver [ADR/](ADR/) — repasar en la defensa).
- [x] Diagrama de arquitectura (Mermaid en el README: Clean Arch + monorepo + capa IA + despliegue).
- [ ] Guion de demo y respuestas a preguntas del tribunal.

**Feature `feature/106-entrega-tfm-usuario-prueba-diagrama` (2026-07-08):**

- [x] ✅ **Usuario de prueba (US-105).** Seed idempotente `prisma/seed-usuario-prueba.ts` (script
      `seed:test-user`): guardián `usuariotest@mail.com` / «Sutanito Test» (contraseña bcrypt, email
      verificado, consentimiento) + perfil «Fulanito» 3 años (animales+magia). Credenciales
      documentadas en el README (subsección «Acceso de prueba (evaluador)»). ⏳ **Falta ejecutarlo
      contra Neon** (paso manual del usuario con `DATABASE_URL` de prod) + smoke B3 sobre el APK.
- [x] ✅ **Diagrama de arquitectura + estructura (D1/C3).** Sección «Arquitectura» del README con el
      diagrama Mermaid y «Estructura del monorepo» ampliada por capas.

**Pendiente de la fase** (ver el plan): B1-respaldo (adjuntar APK a la Release), C1 (bloque único de
entrega con slides/vídeo), E (slides), F (vídeo), G (defensa), y las verificaciones manuales A1/B3.

- **DoD:** clonar → `docker compose up` → app corriendo, sin pasos ocultos.

---

## FASE DE MEJORAS — Pulido visual y de experiencia ⬜

Mejoras posteriores al núcleo funcional: reemplazar los _placeholders_ (emojis) por
recursos gráficos propios, reforzar la personalización por niño y completar interacciones
de cuentos/actividades. Se ejecutará por **features secuenciales** (plan en `planes/` cuando
se abra). Algunas parten de algo ya existente (se indica).

**Recursos visuales (imágenes propias en vez de emojis):**

- [x] ✅ **Avatares con imagen (US-103, 2026-07-07).** Set de 12 imágenes propias empaquetadas (256×256)
      en lugar de emojis, sin romper el `avatar` guardado en el perfil (fallback al defecto para ids
      antiguos). Sin descargas en runtime (cumplimiento). Ver la subsección del lote más abajo.
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

- [x] ✅ **Git hooks de calidad con Husky + lint-staged** (US-36, backend v0.16.0 / raíz v0.20.0, rama
      `feature/39-husky-git-hooks` desde `develop`, worktree). Se automatiza el gate en local:
      `pre-commit` corre `lint-staged` (ESLint `--fix --no-warn-ignored` en backend + Prettier sobre lo
      _staged_) y `pre-push` corre `pnpm check`. Integración/E2E **no** van en hooks (Docker → CI).
      Husky v9 sin shebang ni `chmod` (eliminados en v9.1). `husky`/`lint-staged` como devDependency
      raíz; activación vía `prepare`. Verificado: commit con error de lint se bloquea, `--no-verify`
      salta, pre-push ejecuta el gate. `pnpm check` verde (192 backend + 58 app).

- [x] ✅ **Monitorización de errores/crashes con Sentry** (US-40, app v0.15.0 / raíz v0.22.0, rama
      `feature/42-sentry-monitorizacion-errores` desde `develop`). Integra `@sentry/react-native` en la
      app Expo como **desviación de cumplimiento asumida (TFM, C-12)**: Sentry envía a un tercero
      (sentry.io), rompiendo C-2/C-5. Clave de la mitigación: **init condicional al DSN** —sin
      `EXPO_PUBLIC_SENTRY_DSN` no se inicializa y no sale nada (modo por defecto, desarrollo y E2E
      conformes)—, `sendDefaultPii: false`, un `beforeSend` que elimina `user`/`request`/`server_name`/
      nombre de dispositivo y **redacta correos**, **sin Session Replay** ni `setUser`, y sin tracing.
      Lógica pura testeable en `infrastructure/sentry.ts` (8 tests, 100% CORE); efecto aislado en
      `sentry.bootstrap.ts` (no carga bajo Vitest). Se arregla el gate de pnpm (`'@sentry/cli': true` en
      `allowBuilds`). El prebuild nativo que disparó el wizard (`ios/`, `expo run:*`,
      `expo-build-properties`) falló en `EXConstants` (pnpm) y se **revirtió**: US-40 queda solo a nivel
      JS (Expo Go/web). Solo app; `pnpm check` verde (192 backend + 66 app).

- [x] ✅ **E2E nativo de la app con Maestro, ejecutado en simulador** (US-38, app v0.16.0 / raíz v0.23.0,
      rama `feature/38-e2e-nativo-maestro` desde `develop`, worktree). Complementa (no sustituye) al E2E
      web de Playwright: añade el flow nativo del happy path (`packages/app/.maestro/onboarding.yaml`,
      bienvenida → puerta parental → alta → perfil → cuento → **narración nativa** → actividades →
      historial) + `testID` aditivos + ADR 0005 (Maestro vs Detox) + esqueleto de CI en job separado
      (`e2e-native.yml`, fuera del gate de PR). **Ejecutado y verde en iOS Simulator** (iPhone 17 Pro,
      iOS 26.4, **Expo Go**, Maestro 2.6.1), incluida la narración (`expo-speech`, no requiere dev
      build). Verificarlo destapó **7 correcciones** del flow (puerta parental por texto —el `testID` de
      un `<Text>` no se expone en iOS—, cierre de teclado por toque, `scrollUntilVisible`+`centerElement`,
      `extendedWaitUntil`, pestañas por regex, asserts de subcadena por regex, sin `clearState` en Expo
      Go) y un ajuste de entorno (backend en mock real, cloud off). **Paridad Android verde** (2026-06-25,
      Pixel_9_Pro/Android 16, Expo Go, 56 pasos): flow hermano `onboarding.android.yaml` (difieren
      `appId`, red `10.0.2.2`, etiquetas de pestañas, sin Unicode en input). Solo app + docs;
      `pnpm check` verde.

- [x] ✅ **Sentry: adaptaciones compatibles (extensión US-40)** (app v0.17.0 / raíz v0.24.0, rama
      `feature/43-sentry-release-debug-test` desde `develop`). A raíz de revisar una lección de
      referencia (PDF de `@sentry/react`+Vite) se adaptó lo compatible con la app de menores y se
      descartó lo que rompe cumplimiento (Session Replay, `setUser` del niño, performance tracing,
      feedback widget). Cambios: **política de PII revisada** —proteger al niño, permitir al adulto— el
      `beforeSend` ahora **redacta el nombre del niño** del perfil activo (`[child]`, registrado desde el
      store vía `setActiveChildName`) y **deja de redactar el email del adulto**; `release`
      (`magyblob-app@<versión>` vía `expo-constants`, `app.json` alineado) y `debug` en desarrollo; y un
      **disparador de prueba dev-only** en la zona parental (`__DEV__`). `sentry.ts` pasa a 12 tests
      (100% CORE). Solo app; `pnpm check` verde (192 backend + 70 app).

- [x] ✅ **Observabilidad de errores: ErrorBoundary + breadcrumbs (US-41/US-42)** (app v0.19.0 / raíz
      v0.26.0, rama `feature/44-observabilidad-errores` desde `develop`). Extiende Sentry (US-40).
      **US-41:** `AppErrorBoundary` sobre `Sentry.ErrorBoundary` con _fallback UI_ propia
      (`ErrorFallback`) en español —sin `error.message` ni _stack_—, colocado global y **por zona**
      (cuentos/actividades/lectura) para degradar sin pantalla en blanco; **sin** `showDialog`/feedback
      (C-12). **US-42:** breadcrumbs del recorrido con un helper `telemetry` puro (sink inyectado,
      no-op sin DSN) instrumentando capa HTTP (`api`), navegación (`onStateChange`) y acciones de
      negocio (`ui`), solo enums/ids/contadores; `sentry.ts` endurecido (`maxBreadcrumbs`,
      `beforeBreadcrumb` y `scrubEvent` redactan el nombre del niño también en `breadcrumbs[].data`).
      Solo app; `pnpm check` verde (192 backend + 83 app); `http.ts`/`sentry.ts`/`telemetry.ts` 100%.

- [x] ✅ **Validación de fronteras de datos con Zod (US-44)** (backend v0.17.0 / app v0.21.0 / raíz
      v0.28.0, rama `feature/46-validacion-zod` desde `develop`). **Fase 1:** el saneo imperativo
      (`typeof`/rangos) de las fronteras no fiables pasa a esquemas Zod conservando el comportamiento de
      **sanear, no solo rechazar** — salida del LLM (`parseResponse.ts`) y settings JSON
      (`cloudSettings.ts`, `storyParams.ts`); en la app, el adaptador HTTP valida las respuestas del
      backend (`infrastructure/schemas.ts`) y produce `ApiError` tipo `malformed` en vez del cast
      `as TResponse`. **Fase 2:** las 4 rutas Fastify migran de JSON Schema escrito a mano a Zod vía
      `fastify-type-provider-zod` (`ZodTypeProvider`), infiriendo el tipo del body del esquema;
      `.strict()` replica `additionalProperties:false` y el contrato de error (400 +
      `{error:{tipo,mensaje}}`) queda intacto. **Invariante de capas respetado:** `zod` y el
      type-provider quedan **fuera de `/domain`** (value-objects sin tocar) y los DTOs de `application`
      no se derivan de esquemas de infraestructura. Cumplimiento C-2/C-5 sin cambios (librerías puras).
      `pnpm check` verde (192 backend + 87 app).

- [x] ✅ **Flujo de trabajo en paralelo sin conflictos** (devex/proceso, backend v0.19.0 / raíz
      v0.30.0, rama `feature/49-flujo-paralelo` desde `develop`). Elimina los conflictos que aparecían
      **al mergear features en paralelo** (Lecciones A y D). **Versionado diferido:** la rama de feature
      ya no toca `version`; el número SemVer y el fechado del CHANGELOG se asignan **al integrar en
      `develop`** (post-merge), donde la operación queda serializada → desaparece la colisión de versión.
      La política de versionado/CHANGELOG se traslada a una **skill propia `versionar`** (fuente única);
      `CLAUDE.md` y `cerrar-feature` la **referencian**, no la duplican. `.gitattributes` con
      `merge=union` para los CHANGELOG (apéndices concurrentes se auto-fusionan sin conflicto) y receta
      `pnpm install` para el `pnpm-lock`. Protocolo consolidado en `Docs/trabajo-en-paralelo.md`.
      Verificado: merge union de dos ramas sin conflicto (ambos bullets) y `pnpm check` verde
      (203 backend + 98 app).

### Lote de mejoras en paralelo — Ola 1 (integrada en `develop` el 2026-06-26)

Cuatro features ejecutadas a la vez, una por worktree desde `develop` (plan de coordinación en
[planes/coordinacion-mejoras-paralelo.md](planes/coordinacion-mejoras-paralelo.md)). Integradas en
bloque con **versionado diferido**: **backend v0.20.0 / app v0.23.0 / raíz v0.31.0**; gate verde tras
la integración (238 backend + 114 app). Pendiente del lote: pruebas con el usuario al final + la Ola 2
(F-E dashboard anónimo, F-F producción guiada).

- [x] ✅ **Configuración validada con Zod (US-46, F-A, rama `feature/50-config-zod`).** `loadConfig`
      se reescribe sobre un esquema Zod que normaliza/coacciona cada variable y, en
      `NODE_ENV=production`, **exige `DATABASE_URL`** fallando al arrancar con mensaje claro
      (`ConfigError` + `z.prettifyError`; `index.ts` aborta con `exit 1`). El secreto JWT inseguro sigue
      degradando con **WARNING** (no fatal) para **preservar `docker compose up`**. `config.test.ts`
      pasa de 3 a 19 casos. Plan en [planes/feature-50-config-zod.md](planes/feature-50-config-zod.md).
- [x] ✅ **Cuentos mejorados: multi-tema/estilo + prompt (US-47, F-B, rama
      `feature/51-cuentos-multitema-prompt`).** `POST /stories` acepta **listas** `temas`/`estilos`
      (Zod `z.array(...).min(1)`, sin duplicados); `buildStoryPrompt` interpola la lista legible ES/EN
      conservando US-26/US-28. Límite del cuento subido en el seed (`150-200` → `200-350` palabras). App:
      chips de selección múltiple en `StoryGeneratorScreen`. **Sin migración Prisma** (se persiste el
      primero de cada lista como valor representativo). Plan en
      [planes/feature-51-cuentos-multitema-prompt.md](planes/feature-51-cuentos-multitema-prompt.md).
- [x] ✅ **Selección de perfil al arrancar (US-49, amplía US-02, F-D, rama
      `feature/53-seleccion-perfil-arranque`).** Función pura `resolveInitialRoute` decide la ruta inicial
      (sin sesión → `Welcome`; perfil activo → `Main`; 1 perfil → auto-selección + `Main`; varios/0 →
      `SelectProfile`), con tests de los caminos. El store guarda `profiles` (fuente única, persistencia
      v2→v3). Solo app. Plan en
      [planes/feature-53-seleccion-perfil-arranque.md](planes/feature-53-seleccion-perfil-arranque.md).
- [x] ✅ **Contraseña en el alta y login real (US-48, F-C del lote en paralelo, rama
      `feature/52-password-login` desde `develop`).** Revierte la "identificación ligera por email sin
      contraseña" de la Fase 5.5: puerto de dominio `PasswordHasher` con adaptador `BcryptPasswordHasher`
      (sobre `bcryptjs`, JS puro → no rompe `docker compose up` ni el gate), campo `passwordHash` en la
      entidad `Guardian` y en `prisma/schema.prisma` (migración `add_password_hash_to_guardian`).
      `RegisterGuardian` **hashea** y guarda solo el hash; `LoginGuardian` **verifica** la contraseña y
      devuelve un **401 genérico** (`InvalidCredentialsError`) que no distingue email inexistente de
      contraseña errónea. Rutas con `password` validado por Zod (mín. 8 en el alta). App: campo
      contraseña (`secureTextEntry`) en `ConsentScreen` y `LoginScreen`; el login muestra error genérico
      ante 401. Cumplimiento: refuerza **C-1/C-10** (la contraseña va como hash, nunca en claro ni en
      logs). _Versión diferida (se asigna al integrar en `develop`)._ Pendiente: pruebas con el usuario y
      `finish` tras confirmación. Plan en [planes/feature-52-password-login.md](planes/feature-52-password-login.md).

### Lote de mejoras en paralelo — Ola 2 (integrada en `develop` el 2026-06-26)

Dos features sobre la Ola 1 ya integrada (F-E depende de F-B+F-D; F-F de F-A). Integradas con
versionado diferido: **backend v0.21.0 / app v0.24.0 / raíz v0.32.0**; gate verde (254 backend +
120 app). Pendiente del lote: **pruebas manuales del usuario** (acordadas para el final del plan).

- [x] ✅ **Dashboard/Home sin sesión, uso libre efímero (US-50, F-E, rama `feature/54-dashboard-anonimo`).**
      Casos de uso `GenerateStoryAnonymous`/`RecommendActivitiesAnonymous` que **no persisten nada** y no
      piden `profileId` ni nombre de niño (solo edad/idioma/temas-estilos o categoría/cantidad); rutas
      **públicas** `POST /stories/anonymous` y `POST /activities/recommend/anonymous` validadas con Zod,
      con **rate-limit en memoria** (3 cuentos + 3 actividades por cliente → 429, sin dependencia nueva).
      App: pantalla `Dashboard` como inicio sin sesión (`resolveInitialRoute`: sin sesión → `Dashboard`)
      con contador efímero en cliente. Cumplimiento: **C-14** (efímero, conforme con C-1: no crea dato de
      menor sin consentimiento). Sin tocar el modelo de datos. Plan en
      [planes/feature-54-dashboard-anonimo.md](planes/feature-54-dashboard-anonimo.md).
- [x] ✅ **Ambiente de producción guiado (US-51, F-F, rama `feature/55-produccion-guiada`).** `render.yaml`
      (Blueprint IaC: Docker, contexto raíz, `branch: main`, health `/health`, Frankfurt, free; secretos
      `sync: false`), guía `Docs/despliegue.md` (Neon PG16 + Render + Groq; migraciones automáticas en el
      arranque; cold start del plan free), `EXPO_PUBLIC_API_URL` parametrizable en el app. Ollama no va a
      producción; la IA real se obtiene con Groq (excepción de cumplimiento documentada, C-5). Solo
      infra/docs: no cambia el runtime ni `docker compose up`. Plan en
      [planes/feature-55-produccion-guiada.md](planes/feature-55-produccion-guiada.md).

### Lote de mejoras nº2 — Ola 1 (integrada en `develop` el 2026-06-26)

Cuatro features en paralelo (plan en [planes/coordinacion-mejoras-paralelo-2.md](planes/coordinacion-mejoras-paralelo-2.md)).
Integradas con versionado diferido: **backend v1.1.0 / app v1.1.0 / raíz v1.1.0**; gate verde
(backend + app 129). Pendiente del lote: cola secuencial F6 cabeceras → F5 i18n → F7 portadas, y
pruebas manuales del usuario al final.

- [x] ✅ **Robustez prod + alta/login (US-53, F1, rama `feature/57-robustez-alta-login`).** Timeouts de la
      app más holgados (15→30 s, generación 30→90 s, narración 15→30 s) + **reintento con backoff** y
      **ping de warm-up** a `/health` para el cold start de Render; `KeyboardAvoidingView` en `Screen`;
      email validado con `z.string().email()` (400 temprano; 409 duplicado intacto); contraseña ≥8 con
      letra y número (front+back).
- [x] ✅ **Contenido IA: títulos + instrucciones + temas (US-54, F2, rama `feature/58-contenido-ia-titulos-instrucciones`).**
      El prompt pide **variar el título** (mock con variación determinista); campo `Activity.instrucciones`
      (migración) con paso a paso en el prompt, mostrado en `ActivityCard`; botón "Realizado" con color de
      acento; `StoryGeneratorScreen` ofrece **todos** los temas (arregla magia/música ocultos).
- [x] ✅ **Voz ES/EN (US-55, F3, rama `feature/59-voz-es-en`).** Documentadas las voces premade por idioma
      y endpoint `GET /settings/tts/voices` (sin exponer la key); fallback a voz nativa intacto.
- [x] ✅ **Estándares de diseño Android/iOS (US-56, F4, rama `feature/60-estandares-diseno`).** `android_ripple` + **`expo-haptics`** (impacto suave) en `BubblyButton`/`SelectableChip`; back iOS `default`; contraste
      AA auditado (sin cambios necesarios). Sobre componentes/theme, sin tocar el cuerpo de las pantallas.

### Lote de mejoras nº2 — Cola secuencial F6→F5→F7 (integrada en `develop` el 2026-06-27)

Tres features que compartían ficheros de pantalla/IA, integradas en orden. Release conjunto con
versionado diferido: **backend v1.2.0 / app v1.2.0 / raíz v1.2.0**; gate verde (backend 287 + app 151).

- [x] ✅ **Cabeceras ilustradas por pantalla (US-58, F6, rama `feature/62-cabeceras-pantalla`).** `Screen`
      acepta `headerImageName` (`welcome|home|dashboard|cuentos|actividades`) y pinta la imagen de
      `assets/images/headers/` (require estáticos), respetando scroll, footer y `KeyboardAvoidingView`. Las
      5 imágenes optimizadas de ~2 MB a ~200-345 KB.
- [x] ✅ **i18n del app ES/EN (US-57, F5, rama `feature/61-i18n-app`).** `i18next` + `react-i18next` +
      `expo-localization`; ~120 claves de UI extraídas a diccionarios `es`/`en` (default `es`, textos
      idénticos bajo claves → tests intactos); `appLanguage` persistido en `useAppStore` con selector en la
      zona de adultos, independiente del idioma del perfil.
- [x] ✅ **Portadas de imagen (US-59, F7, rama `feature/63-portadas-imagen`).** La app **siempre** muestra
      portada: la generada por backend (`Story.portada`/`Activity.imagen`, migración) si existe, o el
      **respaldo local por tema** (`assets/images/story/`, 7 imágenes optimizadas 5.5 MB→171 KB). Adaptador
      **Gemini/Imagen** best-effort (sin clave o ante fallo → `null`, sin romper la creación); el prompt
      redacta el nombre del niño (cumplimiento **C-15**). Pendiente: validar con `GEMINI_API_KEY` real.
- [x] ✅ **Ajustes post-lote (US-60 + fixes US-57/58, rama `feature/64-ajustes-prompts-doc`, v1.2.1).**
      Cabeceras con imagen **completa** (`contain`); i18n **sin `expo-localization`** (idioma elegido por el
      usuario, default `es`); script on-demand `pnpm prompts:dump` que vuelca a `Docs/muestra-prompts.md`
      los prompts de cuentos/actividades/portadas con resultados reales de **Groq + Gemini** (fuera del gate).
- [x] ✅ **Ajustes finos (fixes US-58/US-59, rama `feature/65-ajustes-cabecera-portadas`, v1.2.2).**
      Cabecera con imagen completa en banda de **alto proporcional** (~22% pantalla, acotado 170–200,
      `contain` centrado) en vez del cuadrado; **portadas solo en cuentos** (se quita la imagen de
      `ActivityCard` y el backend deja de generar `Activity.imagen`; los respaldos locales son por tema).

### Ajustes: contenido, trazabilidad e historial (US-61/US-62, integrado el 2026-06-27, v1.3.0)

Dos features en paralelo (A backend, B app; plan en
[planes/coordinacion-ajustes-historial.md](planes/coordinacion-ajustes-historial.md)). Release unificado
**v1.3.0** (raíz/backend/app); gate verde (backend 299 + app 168).

- [x] ✅ **Backend: prompts 3–6 pasos + persistencia + fecha (US-61, rama `feature/71-prompts-pasos-persistencia`).**
      El prompt de actividades pide **3–6 pasos**; se **persiste el prompt usado** (system+user) por
      cuento/actividad — `GeneratedStory`/`GeneratedActivity` lo devuelven, columna `prompt` TEXT nullable
      en `stories`/`activities` (migración), solo BD (no en DTO); `creadoEn` añadido a
      `StoryOutput`/`ActivityOutput`.
- [x] ✅ **App: fecha de generación + filtros del Historial (US-62, rama `feature/72-historial-fecha-filtros`).**
      Muestra `creadoEn` formateado/localizado en Historial, lectura y `ActivityCard`; **filtros en cliente**
      por tema/estilo (cuentos) y categoría (actividades), con "Todos" por defecto.

### Favoritos y búsqueda en el historial (US-63/US-64, integrado el 2026-06-28, v1.4.0)

Dos features en paralelo (A backend, B app; plan en
[planes/coordinacion-favoritos-busqueda.md](planes/coordinacion-favoritos-busqueda.md)). Release unificado
**v1.4.0** (raíz/backend/app); gate verde (backend 311 + app 187+).

- [x] ✅ **Backend: favoritos (US-63, rama `feature/73-favoritos`).** Campo `favorito` (bool, default false)
      en `Story`/`Activity` + migración; casos de uso idempotentes `SetStoryFavorite`/`SetActivityFavorite`
      y rutas `POST /stories/:id/favorite` y `POST /activities/:id/favorite` (body `{favorito}`); `favorito`
      en `StoryOutput`/`ActivityOutput`.
- [x] ✅ **App: favoritos UI + búsqueda (US-64, rama `feature/74-favoritos-busqueda-app`).** Botón **estrella**
      (toggle optimista) en lectura, ítems del historial y `ActivityCard`; **filtro "Solo favoritos"** y
      **campo de búsqueda** de texto (normalizada, en título/cuerpo/descripción/instrucciones/tema/estilo/
      categoría) en `HistoryScreen`/`historyFilters.ts`, combinados con los filtros de US-62.

- **DoD:** assets integrados sin romper el contrato de datos; cuentos/actividades notablemente
  personalizados por perfil; releer desde Historial, narración por voz (US-22) y botón "Realizado"
  operativos; `pnpm check` verde + bundle + pruebas con el usuario.

### Estándar de documentación del código (US-65, integrado el 2026-06-28, v1.4.1)

Feature `feature/76-doc-estandar-jsdoc` (docs + tooling; sin cambio funcional → **patch v1.4.1**).
Formaliza y hace **verificable** la convención de documentación que el proyecto ya seguía. La skill
[`documentar`](../.claude/skills/documentar/SKILL.md) es la **fuente única** del estándar; `CLAUDE.md`
la referencia.

- [x] ✅ **Enforce (backend):** `eslint-plugin-jsdoc` + regla `jsdoc/require-jsdoc` (`publicOnly`,
      clases y funciones exportadas de `packages/backend/src/**`) integrada en `pnpm check`. Solo
      `require-jsdoc` (no el preset), acorde a la convención de prosa española (sin TSDoc formal).
- [x] ✅ **Huecos cerrados:** 14 funciones exportadas del backend (mappers, type-guards, parseResponse,
      prompts, storyParams) + cabeceras de módulo en 4 rutas; 4 pantallas del app documentadas a mano
      (el app no tiene ESLint en el gate → estándar por convención, follow-up de tooling).
- [x] ✅ **Docs:** skill `documentar`, enlaces desde `CLAUDE.md`, decisión en `memory.md`.
- **DoD:** `pnpm check` verde (backend 311 + app 187); estándar aplicado y enforced en backend.

### Tema claro/oscuro + barras de sistema (US-66, integrado el 2026-07-01, v1.5.0)

Feature `feature/77-tema-dark-light` (solo app; nueva funcionalidad de UI → **minor v1.5.0**). La app
pasa de _light-only_ a **tema reactivo** claro/oscuro con selección **Sistema + toggle manual**.

- [x] ✅ **Tokens light/dark:** `tokens.ts` divide `colors` en `lightColors`/`darkColors` (misma forma,
      `ColorTokens`), paleta oscura cálida con contraste AA; `themes` + `makeSoftShadow`.
- [x] ✅ **Reactivo:** `ThemeProvider` + `useTheme()` + `useThemedStyles(makeStyles)` (memoiza por
      esquema) + función pura `resolveScheme(preference, systemScheme)`; contexto por defecto = claro
      (los tests sin provider siguen verdes). **25 componentes/pantallas** migrados a estilos temáticos.
- [x] ✅ **Preferencia:** `themePreference` (`system|light|dark`, default `system`) en `useAppStore`
      (persistida, no se borra en logout; persistencia v4→v5) + selector Automático/Claro/Oscuro en la
      Zona de adultos (i18n ES/EN).
- [x] ✅ **Barras del SO:** `expo-system-ui` (fondo raíz) + `expo-navigation-bar` (estilo de botones
      Android), `StatusBar`, `NavigationContainer`, tab bar y cabeceras coherentes con el tema;
      `app.json` `userInterfaceStyle: automatic`. Todo local (sin red ni SDK de terceros).
- [x] ✅ **Arranque:** al añadir módulos nativos, **Expo Go deja de servir**; la app se lanza con dev
      build (`cd packages/app && npx expo run:android`/`run:ios`). README (raíz y app), estrategia de
      pruebas, CHANGELOG y lecciones actualizados con instrucciones de dev y prod.
- **DoD:** ✅ `pnpm check` verde (app 194 + backend 311) · ✅ `expo export` · ✅ verificado en emulador
  Android por el usuario (selector de tema operativo).

#### Refinamiento de paleta oscura → "cielo nocturno" (Feature 79, US-66)

Feature `feature/79-tema-dark-design-nocturno` (solo app; cambio de color del tema oscuro). La feature 77
dejó `darkColors` en un cocoa cálido provisional; con el documento de diseño
[Docs/Design/stitch_magyblob/DESIGN_Dark.md](Design/stitch_magyblob/DESIGN_Dark.md) se re-mapea al diseño
aprobado.

- [x] ✅ **`darkColors` = "cielo nocturno" (índigo cósmico):** superficies índigo (`#111125`), coral
      (acción), púrpura suave (secundario), aqua (terciario), texto lila claro. Un solo objeto tocado
      (contrato `ColorTokens` intacto); ni `StyleSheet` ni `ThemeProvider` cambian. Quicksand y tokens
      invariantes (radios/espaciado) se mantienen; el tema claro no cambia.
- **DoD:** ✅ `pnpm check` verde (app 194 tests) · ✅ verificado en simulador Android por el usuario.

### Actividades más significativas: ≥6 pasos y trato por parentesco (US-67, integrado el 2026-07-01)

Feature `feature/78-actividades-6-pasos` (solo backend). Actividades más significativas para 2-6 años
y con las instrucciones dirigidas al adulto por su parentesco. Integrada en `develop` **sin release**
(entradas en `## [Unreleased]` del CHANGELOG del backend, a versionar más adelante).

- [x] ✅ **Prompt (ES/EN):** de "3-6 pasos" a **al menos 6 pasos** numerados, detallados y concretos,
      con **objetivo de aprendizaje** y **materiales sencillos de casa**; `MockProvider` emite ≥6.
- [x] ✅ **Seed alineado:** `prompt.activity.template` coincide con el default de código (estaba
      desactualizado y ni pedía pasos).
- [x] ✅ **Trato por parentesco:** las instrucciones se dirigen al adulto por su parentesco (mamá/papá/
      abuela o abuelo/tutor) en vez de "el adulto"; sin sesión (anónimo) → "la persona adulta".
      `RecommendActivities` resuelve el parentesco vía `GuardianRepository`.
- **DoD:** ✅ `pnpm check` verde (backend 317 + app 194) · ✅ verificado por el usuario en la app
  (Groq): actividades con ≥6 pasos y trato por parentesco.

### Logros del niño (US-68) + Cuento con enseñanza (US-69) — integrado el 2026-07-01, sin release

Feature `feature/80-logros-ensenanza` (backend + app). Lote de dos mejoras de cara al usuario,
implementadas juntas en una rama (plan en
[planes/coordinacion-logros-ensenanza.md](planes/coordinacion-logros-ensenanza.md),
[planes/feature-68-logros.md](planes/feature-68-logros.md),
[planes/feature-69-cuento-ensenanza.md](planes/feature-69-cuento-ensenanza.md)). Integrada en
`develop` **sin release** (entradas en `## [Unreleased]` del CHANGELOG de backend y app, a versionar
más adelante).

- [x] ✅ **Cuento a la carta: enseñanza opcional (US-69).** Vocabulario `ENSENANZAS`
      (`amistad | emociones | valentia | honestidad`); `POST /stories` acepta `ensenanza?` (Zod), el
      prompt la refuerza (ES/EN, `MockProvider` determinista), se persiste en `Story.ensenanza`
      (`String?`, migración) y se devuelve en el DTO. App: chip único opcional en el generador y
      **filtro por enseñanza** en el Historial; i18n ES/EN.
- [x] ✅ **Logros / recompensas del niño (US-68).** Catálogo en el dominio (`domain/logros.ts`:
      cuentos leídos 1/5/10/25, actividades 1/5/10/25, racha 3/7, un logro por tema), entidad
      `Achievement` + repo Prisma (tabla `achievements`, migración, cascada por perfil) y caso de uso
      `GetAchievements` (read-model calculado que **reconcilia** persistiendo los desbloqueos de forma
      idempotente). Ruta `GET /profiles/:id/achievements`. App: pantalla **Mis logros** (rejilla de
      medallas con progreso/estado) accesible desde Inicio; gateway, esquema Zod e i18n ES/EN.
      _Decisión de diseño:_ reconciliación en la lectura (endpoint GET idempotente) en vez del EventBus,
      para mínima superficie; el estado mostrado es correcto aunque falle la persistencia (sale del cálculo).
- **DoD:** ✅ `pnpm check` verde (**backend 357 + app 203**); integrado en `develop` sin release ·
  ⏳ pruebas con el usuario (manual: cuento con enseñanza + filtro en Historial + pantalla Mis logros).

### Lote de ajustes UX + robustez cold-start (US-71, integrado el 2026-07-01, sin release)

Feature `feature/81-ajustes-ux-render`. Seis ajustes de cara al usuario (plan en
[planes/ajustes-ux-render.md](planes/ajustes-ux-render.md)). Solo app (más un test de regresión
backend). Integrado en `develop` **sin release** (entradas en `## [Unreleased]` del CHANGELOG del app).

- [x] ✅ **A1 · Robustez cold-start de Render.** Render free suspende la instancia por inactividad
      (primer request 50 s+): warm-up con reintentos y timeout largo (`WARMUP_TIMEOUT_MS` 70 s),
      timeouts tolerantes (base 30→60 s, generación 90→120 s) y aviso escalado "esto tarda más de lo
      usual…" vía hook `useSlowHint` en Generador/Actividades/Dashboard.
- [x] ✅ **A2 · Marcar leído explícito.** Se quita el auto-marcado al abrir el lector; se marca con el
      botón "Marcar como leído" o al **terminar la narración** (`onFinished` en `useNarration`).
- [x] ✅ **A3 · Actividades en logros/historial + buscador.** Test de regresión confirma que una
      actividad completada aparece en el historial y desbloquea su logro (el backend ya era correcto).
      Historial reorganizado: búsqueda y todos los filtros en un **modal** ("Buscar" con contador de
      filtros activos + "Limpiar"); **título del cuento completo**.
- [x] ✅ **A4 · Resumen de logros en Home.** Tarjeta con "conseguidos/total" + `ProgressBar` que lleva a
      Mis logros (carga al enfocar, degrada en silencio).
- [x] ✅ **A6 · Botón fijo a la zona de adultos.** `AdultsButton` en el `headerAction` del `Screen`
      (fijo arriba a la derecha) en las 4 pestañas; se retira el enlace inferior de Inicio.
- [x] ✅ **A5 · Animaciones de entrada.** Wrapper `Appear` (`Animated` integrado; anima translateY+scale,
      no opacidad) en imágenes de cabecera, footer (botón principal), `ActivityCard`, medallas de logros
      y tarjetas de cuento.
- **DoD:** ✅ `pnpm check` verde (**backend 357 + app 216**) · ⏳ pruebas en dev por el usuario.

### Lote de ajustes de `ideas.txt` (US-75…US-82, rama `feature/85-ajustes-ideas`, sin release)

Ocho ajustes de producto de `ideas.txt` (numerados 1, 3–9) sobre la app madura, ejecutados en una
rama como lote (precedente US-71). Plan de coordinación en
[planes/coordinacion-ajustes-ideas.md](planes/coordinacion-ajustes-ideas.md). Integrado en `develop`
**sin release** (entradas en `## [Unreleased]` de los CHANGELOG de backend y app, a versionar más
adelante).

- [x] ✅ **Backend de contenido (US-75/76/77/78).** ≥3 frases por página en el system prompt (ES/EN) y
      el `MockProvider` + seed alineado (US-75); `POST /stories` acepta `usarNombre?` (protagonista
      genérico si `false`, menos PII) (US-76); `terminoCuidador` combina parentesco + nombre del adulto
      ("mamá Ana") pasando `guardian.nombre` desde `RecommendActivities` (US-77); **Continuar la
      historia**: caso de uso `ContinueStory` + `POST /stories/:id/continue`, `Story.continuacionDe`
      (migración), capítulo nuevo enlazado que hereda tema/estilo/enseñanza y reutiliza portada (US-78).
- [x] ✅ **Lector con page-curl por gesto (US-79).** `BookPages` reescrito con
      `react-native-gesture-handler` + `react-native-reanimated` (+ `react-native-worklets`): arrastre
      con giro 3D en el hilo de UI, ‹/› e indicador conservados, hoja de alto consistente; `App` en
      `GestureHandlerRootView`, `babel.config.js`; stubs de test y `expo export` web validado. Requiere
      dev build (como US-66).
- [x] ✅ **Nombre de sección en la cabecera (US-80).** `Screen` acepta `title`; las 4 pestañas muestran
      el nombre de sección (reutiliza `tabs.*`).
- [x] ✅ **Pasos de actividad plegables (US-81).** `ActivityCard` oculta los pasos tras "Ver pasos" /
      "Ocultar pasos".
- [x] ✅ **Búsqueda global (US-82).** Pantalla `SearchResults` (accesible desde Inicio) que lista cuentos
      y actividades coincidentes reutilizando `historyFilters`.
- [x] ✅ **App conectada (US-76/78).** Toggle "Usar el nombre de {niño}" en el generador (envía
      `usarNombre`) y botón "Continuar la historia" en el lector (gateway `continueStory`, abre el
      capítulo nuevo).
- **DoD:** ✅ `pnpm check` verde (**backend 401 + app 253**) · ⏳ pruebas en dev por el usuario (dev build).

### Lote de ajustes 2 de `ideas.txt` (correcciones de US-77/78/81/64/79, rama `feature/86-ajustes-ideas-2`, sin release)

Cinco correcciones detectadas en las pruebas en dev del lote anterior. Plan en
[planes/coordinacion-ajustes-ideas-2.md](planes/coordinacion-ajustes-ideas-2.md). Integrado en
`develop` **sin release** (entradas en `## [Unreleased]` de backend y app).

- [x] ✅ **Actividades con parentesco + nombre en IA real (US-77).** Seed `prompt.activity.system` v6:
      usar el trato + nombre tal cual ("mamá Ana", "abuela Ana"); el código ya lo componía.
- [x] ✅ **Título de continuación numerado (US-78).** `ContinueStory` usa `siguienteTitulo(origen.titulo)`
      ("Joaquín en el bosque" → "… 2" → "… 3") en vez del título inventado por la IA.
- [x] ✅ **Pasos visibles al generar actividades (US-81).** `ActivityCard` acepta `pasosVisiblesInicial`;
      `ActivitiesScreen` lo pasa `true`; Historial/Búsqueda siguen plegados.
- [x] ✅ **Buscador del Historial en vivo (US-64).** La búsqueda pasa a un campo en línea siempre visible
      (como Inicio) que filtra en vivo; el modal queda solo con filtros ("Filtros (N)"); se combinan.
- [x] ✅ **Efecto de pliegue del lector sin Skia (US-79).** `BookPages` añade sombra de pliegue + giro/
      escala más marcados siguiendo el arrastre (aproximación de page-curl; se descartó Skia).
- **DoD:** ✅ `pnpm check` verde (**backend 407 + app 255**) · ⏳ pruebas en dev por el usuario (dev build).

### Release v1.7.0 — publicada en `main` (2026-07-02)

Primera release tras los lotes de este ciclo. Se integró `develop` → `main` (PR #4, CI verde: gate +
integración/E2E backend + E2E app), se asignó la versión con **versionado diferido** (raíz/backend/app
`1.6.0 → 1.7.0`, CHANGELOG fechado) y se publicó el **tag `v1.7.0`** y la **GitHub Release** (latest).

Incluye: **US-75** (≥3 frases/página), **US-76** (usar nombre opcional), **US-77** (trato parentesco +
nombre, reforzado para IA real), **US-78** (continuar historia + título numerado), **US-79** (lector
con pase de página por gesto + pliegue, sin Skia), **US-80** (nombre de sección en cabecera), **US-81**
(pasos plegables, visibles al generar), **US-82** (búsqueda global) y el buscador del Historial en vivo.
Pendiente aparte: compilar y adjuntar la APK de v1.7.0 (build nativa).

### Lote de ajustes 3 de `ideas.txt` (US-83…US-88, rama `feature/87-ajustes-ideas-3`, sin release)

Ocho ajustes de UI/UX (captura del Dashboard en Android). Plan en
[planes/coordinacion-ajustes-ideas-3.md](planes/coordinacion-ajustes-ideas-3.md) (+ un plan por
feature). Ejecutado en **una rama**, commits por feature (Ola 1 = ficheros disjuntos; F5 transversal
al final). Solo app; integración prevista **sin release** (entradas en `## [Unreleased]` del app).
Decisiones: **#1** se intentó `react-native-page-flipper` pero se **descartó** (crashea con Reanimated
4/new arch) y se mantiene el pliegue con reanimated; **#6** añadir 4º color; **#7/#8** revertidos.

- [x] ✅ **F1 — Lector como libro: portada + historia + FIN (US-83, #1/#5).** `BookPages` admite
      `portada` (imagen + título) y `finLabel` ("FIN") además de la historia paginada; el pase de página
      mantiene el **pliegue con Reanimated** (giro + sombra, arrastre y ‹/›). _Se intentó
      `react-native-page-flipper` para un curl "real" pero **crashea con Reanimated 4 / New Architecture**
      (v1.0.1, sin mantenimiento); se descartó y se quitaron esas deps._ Requiere dev build.
- [x] ✅ **F2 — Buscador del Historial reubicado (US-84, #2).** Baja a tras "Lo último" y encima del
      toggle [Cuentos | Actividades]; búsqueda en vivo + filtros del modal intactos.
- [x] ✅ **F3 — Cerrar sesión vuelve al Dashboard (US-85, #3).** `ParentalScreen` resetea a `Dashboard`
      (con "Prueba un cuento / actividades"), no a `Welcome`.
- [x] ✅ **F4 — Cabeceras con rebote en loop (US-86, #4).** `BouncingHeaderImage` (translateY en bucle,
      reanimated `withRepeat`), usado desde `Screen`.
- [x] ✅ **F5 — Color de botón consistente + sombra por tono + 4º color (US-87, #6).** Variante
      `quaternary` (ámbar) + bordes por variante (tono oscuro del propio color); mapa fijo entre
      pantallas (crear=coral · ya tengo=cielo · búsqueda=menta · logros=ámbar · logout=rojo).
- [~] ↩️ **F6 — Pestañas (US-88, #7/#8): REVERTIDA.** Se implementó (fondo activo cubriendo el ítem +
  inset inferior), pero tras las pruebas del usuario se **revirtió al estado previo** (blob alrededor
  del icono y `tabBarStyle` original) a petición suya. Se elimina el helper `makeTabBarStyle`.
- **DoD:** ✅ `pnpm check` verde (**backend 407 + app 268**) + cobertura estratégica OK · ⏳ pruebas en
  dev por el usuario (dev build) y confirmación antes del `finish`.

### Lote de ajustes 4 de `ideas.txt` (US-89…US-91, misma rama `feature/87-ajustes-ideas-3`, sin release)

Tres mejoras visuales tras probar el lote 3 en dev. Plan en
[planes/coordinacion-ajustes-ideas-4.md](planes/coordinacion-ajustes-ideas-4.md). Se ejecuta en la
**misma rama** (el lote 3 sigue sin integrar), commits por feature; integración **sin release**.

- [x] ✅ **F1 — Chips por categoría: color + icono (US-89, #1).** `SelectableChip` con `icon` y `color`
      por categoría (temas=cielo, estilos=menta, enseñanza=ámbar, usar-nombre=coral); iconos lucide por
      opción (`chipIcons.ts` + `Icon`), reutilizados en Cuentos, Crear perfil (intereses) y Dashboard.
- [x] ✅ **F2 — Animación suave del avatar (US-90, #2).** `AnimatedAvatar` (giro leve + rebote en bucle,
      reanimated) en Inicio, cabecera de Cuentos y avatar seleccionado del `AvatarPicker`.
- [x] ✅ **F3 — Número de página impreso en cada hoja (US-91, #3).** `BookPages` imprime el número en
      cada hoja, además del indicador existente.
- **Extra:** stub de `lucide-react-native` para Vitest (permite que `Icon` cargue en tests sin mockearlo
  por fichero, necesario al usar `Icon` en `SelectableChip`).
- **DoD:** ✅ `pnpm check` verde (**backend 407 + app 270**) + cobertura OK · ⏳ pruebas en dev por el
  usuario (dev build) y confirmación antes del `finish`.

### Endurecimiento de seguridad del API público (2026-07-03, rama `feature/92-seguridad-api`, US-92, sin release)

Tras auditar en vivo el API en producción (Render): registro directo sin fricción, **sin** rate
limiting (12 logins fallidos → ningún 429), sin verificación de email. Plan en
[planes/seguridad-api-registro.md](planes/seguridad-api-registro.md). Cierre **sin push ni release**.

- [x] ✅ **Fase 1 — Rate limiting** (`@fastify/rate-limit`, `global:false`) en `/guardians`,
      `/guardians/login`, `/guardians/refresh` y `/guardians/challenge` → 429; `trustProxy` (env, por
      defecto en prod) para contar por IP real tras Cloudflare. Límites configurables por env.
- [x] ✅ **Fase 2 — Puerta parental server-side** (D1=opción b, sin terceros): `GET /guardians/challenge`
      emite un reto aritmético firmado (HMAC del secreto JWT + caducidad, stateless) que el alta exige.
      El app lo resuelve de forma transparente en el gateway (el `ParentalGate` cliente no cambia).
- [x] ✅ **Fase 3 — Cabeceras y CORS**: `@fastify/helmet` + `@fastify/cors` con allowlist (`CORS_ORIGINS`).
- [ ] ⏳ **Fase 0 (manual, usuario):** verificar `JWT_SECRET` en Render y borrar la cuenta de prueba.
- [ ] ⏳ **T3.3 en vivo:** verificar 429/cabeceras **tras desplegar**.
- **Fase 4** (revocación de sesión, H6) **diferida** a su propia feature.
- **DoD:** ✅ `pnpm check` verde (**backend 417 + app 274**) + cobertura OK · pruebas ofrecidas al
  usuario (unitarias/integración en verde + pasos manuales); cierre confirmado por el usuario.

### Verificación de email por OTP (2026-07-03, rama `feature/93-verificacion-email-otp`, US-93, sin release)

Materializa la mejora futura anotada en C-16/US-92 (verificación de titularidad del email / doble
opt-in). Plan en [planes/feature-93-verificacion-email-otp.md](planes/feature-93-verificacion-email-otp.md).
Decisiones con el usuario: **bloqueo duro** (sesión solo tras validar el código) y **sin SMTP →
auto-verificar** (arranque reproducible intacto).

- [x] ✅ **Backend.** `nodemailer` + `SmtpEmailService` (cableado solo si hay SMTP), `EmailService`/
      `CodeGenerator` (puertos), entidad + repo `EmailVerification` (código bcrypt, caducidad 10 min,
      máx. 5 intentos), migración `add_email_verification` (+ `Guardian.emailVerificado`, backfill a
      `true`). Casos de uso `VerifyEmail`/`ResendEmailVerification` + servicio `SendEmailVerification`;
      `RegisterGuardian` ramifica con/sin SMTP. Rutas `POST /guardians/verify-email` y
      `/guardians/resend-verification` (públicas, rate-limited); alta y login devuelven
      `requiereVerificacion` sin tokens si la cuenta no está verificada. Evento `email_verificado` →
      `AuditLog accion=verificar_email`. Config SMTP/OTP validada con Zod.
- [x] ✅ **App.** Pantalla **Verificar email** (código 6 dígitos + reenviar con cooldown + errores),
      `AuthOutcome` (unión sesión | pendiente) en gateway/http/schemas, ramificación en `ConsentScreen`
      y `LoginScreen`, ruta `VerifyEmail` en el stack, i18n ES/EN.
- [x] ✅ **Docs.** US-93 + trazabilidad, C-17 en cumplimiento, modelo-datos (entidad + `emailVerificado`),
      CHANGELOG (Unreleased) backend + app.
- **DoD:** ✅ `pnpm check` verde (**backend 442 + app 282**) + cobertura CORE OK. Integración Prisma del
  repo y E2E onboarding (modo sin SMTP) en sus suites Docker. Pendiente: **pruebas manuales del usuario**
  (con y sin SMTP) y `finish` tras confirmación.

### Inicio en 2 columnas + iconos en las acciones (2026-07-04, rama `feature/94-inicio-2-columnas-iconos`, US-94)

Extiende la iconografía funcional (US-29) a los botones de acción y reorganiza los accesos de Inicio.
Plan en [planes/feature-96-inicio-2-columnas-iconos.md](planes/feature-96-inicio-2-columnas-iconos.md).
Decisiones con el usuario: alcance = **Inicio + acciones equivalentes** del resto de la app; icono de
"Crear un cuento" = **libro** (coherente con la pestaña Cuentos, no la varita).

- [x] ✅ **App.** Los 4 accesos de Inicio pasan a **rejilla de 2 columnas** de _tiles_ (icono grande
      sobre etiqueta): cuento=libro, actividades=paleta, logros=trofeo, buscar=lupa. `BubblyButton`
      gana `layout: 'row' | 'stack'`; el wrapper `Icon` añade `achievements` (lucide `Trophy`). Mismo
      icono en la acción equivalente: "Generar cuento" (Cuentos/Dashboard) → libro; "Generar
      actividades" (Actividades/Dashboard) → paleta.
- [x] ✅ **Docs/tests.** US-94 + trazabilidad, CHANGELOG (Unreleased) del app; tests de los 4 botones
      de Inicio (navegación) y del layout `stack` de `BubblyButton`.
- **DoD:** ✅ `pnpm check` verde (**backend 452 + app 296**). Pendiente: pruebas manuales del usuario
  (visual de la rejilla) y `finish` tras confirmación.

### Lote de ajustes: warm-up visible, lector anónimo y corte de línea (2026-07-06, US-95/96/97)

Tres ajustes de `ideas.txt` ejecutados **en paralelo** (un worktree por feature desde `develop`),
integrados en la rama `integracion/ajustes-lectura-warmup` y verificados en verde. Plan en
[planes/coordinacion-ajustes-lectura-warmup.md](planes/coordinacion-ajustes-lectura-warmup.md).
Solo app; **versión diferida** (se asigna al integrar en `develop`). Pendiente: pruebas manuales del
usuario y merge a `develop` tras confirmación.

- [x] ✅ **F1 · US-95 — Warm-up visible al arrancar** (rama `feature/95-warmup-banner`). Banner
      superior **no bloqueante** ("Preparando el servidor…") mientras el backend despierta del cold
      start (ping a `/health`, [US-53](historias-usuario/epic-f-plataforma.md#us-53)); desaparece al
      responder o agotar reintentos. `warmUp` gana callback `onReady` (retrocompatible) + hook
      `useServerWarmup`. La app es navegable mientras tanto.
- [x] ✅ **F2 · US-96 — Cuento anónimo abre el lector con puerta de sesión** (rama
      `feature/96-lector-anonimo`). Sin sesión, generar el cuento en el Dashboard ahora **navega al
      lector** (como con sesión) en vez de pintarlo inline; las acciones que requieren cuenta
      (Escuchar, Marcar como leído, Favorito, Continuar) abren una **modal** "Inicia sesión para
      continuar" con botón **Crear cuenta** → alta (`Consent`). `StoryReader` admite `anonimo`.
- [x] ✅ **F3 · US-97 — La última línea del cuento no se recorta** (rama
      `feature/97-corte-ultima-linea`). Paginado 120→**60** palabras/página (cabe en el alto mínimo de
      hoja) y `BookPages` **encoge el texto para caber** (`adjustsFontSizeToFit`, alineado arriba
      reservando el número de página), de modo que ninguna página recorta contenido.
- **DoD:** ✅ `pnpm check` verde tras integrar (**backend 460 + app 300**); typecheck, ESLint y
  Prettier OK. Pendiente: pruebas manuales del usuario y merge a `develop` (con versionado diferido)
  tras confirmación.

### Incoherencia de datos de sesión → error + cerrar sesión (2026-07-06, US-98, rama `feature/98-incoherencia-datos-logout`)

Robustez de sesión (complementa el JWT US-45): cuando el `guardianId`/`profileId` de la sesión ya no
existe en la BD (BD reseteada, perfil borrado), el backend responde `404 NotFoundError`. En vez del
error crudo, la app muestra una modal **"Error de datos"** y **cierra sesión** para revalidar al volver
a entrar. **Solo app**; versión diferida. Plan en
[planes/feature-98-incoherencia-datos-logout.md](planes/feature-98-incoherencia-datos-logout.md).

- [x] ✅ **App.** `http.ts` marca las rutas ligadas a la sesión (`profiles.list`, `stories.generate`,
      `activities.recommend`, `history.get`, `achievements.get`) con `sessionBound`; un 404
      `NotFoundError` en ellas dispara `SessionStore.onDataInconsistency`. El store cierra sesión y
      levanta `sessionDataError`; `DataErrorHandler` (raíz, bajo `DialogProvider`) resetea a `Dashboard`
      y muestra la modal. Los 404 de contenido puntual (marcar leído/favorito/continuar/completar) no
      cierran sesión.
- [x] ✅ **Docs/tests.** US-98 + trazabilidad; CHANGELOG (Unreleased) del app; tests de `http` (avisa
      solo en ruta sessionBound + `NotFoundError`) y del store (`reportDataInconsistency`/`clearDataError`).
- **DoD:** ✅ `pnpm check` verde (**backend 460 + app 306**). Pendiente: pruebas manuales del usuario.

### Cascada de proveedores de IA + versión en Dashboard + autor por proveedor cloud (2026-07-07, US-99, rama `feature/99-cascada-proveedores-ia`)

Tres ajustes: (1) el modo cloud encadena **Gemini → Groq → mock**; (2) la pantalla sin sesión muestra
la versión; (3) el "Autor" distingue el proveedor cloud concreto. Backend + app; versión diferida.
Plan en [planes/feature-99-cascada-proveedores-ia.md](planes/feature-99-cascada-proveedores-ia.md).

- [x] ✅ **Cascada (backend).** `ai.cloud` admite `fallbacks[]`; el `resolver` de `createAIProvider`
      construye la cadena (primario + fallbacks, omitiendo pasos sin API key) anidando
      `FallbackProvider` y terminando en mock. Default: gemini (`gemini-2.5-flash`) → groq
      (`llama-3.3-70b-versatile`) → mock (`app-settings.json`, `version` bump para el sync).
- [x] ✅ **Autor por proveedor cloud (backend+app).** `PROVEEDORES_IA` se amplía con los targets
      cloud; el `CloudProvider` estampa su `target` (no el genérico `cloud`). El `AuthorBadge` añade la
      letra al final: G (Gemini) / GQ (Groq) / OR / CB, con el icono de nube.
- [x] ✅ **Versión en el Dashboard (app).** `VersionFooter` al pie de la pantalla sin sesión.
- [x] ✅ **Tests.** `cloudSettings` (fallbacks), `createAIProvider` (cascada: 429→siguiente, todos
      fallan→mock, omitir sin key, estampado del target), `AuthorBadge` (G/GQ), `DashboardScreen`
      (versión). `pnpm check` verde (**backend 470 + app 310**) + cobertura CORE 100%.
- **DoD:** ✅ gate + cobertura verdes. Pendiente: pruebas manuales del usuario (cascada real y badge).

### Avatares con imagen + actividad singular en historial (2026-07-07, app v1.15.0 / raíz v1.15.0)

Dos ajustes de la Fase de mejoras ejecutados **en paralelo** (una rama/worktree por feature desde
`develop`), integrados juntos con versionado diferido. Ambos **solo app**; backend sin cambios. Plan
en [planes/coordinacion-avatares-actividad-singular.md](planes/coordinacion-avatares-actividad-singular.md).

- [x] ✅ **Avatares con imagen (US-103, rama `feature/95-avatares-imagen`).** Sustituye los avatares
      emoji por un set de **12 imágenes propias** empaquetadas (256×256, optimizadas de ~14 MB a
      ~1,1 MB con `sips`; sin descargas en runtime → C-2/C-5). `AvatarPicker` expone `avatarSource(id)`
      (mapa `require` estático) con **fallback al avatar por defecto** para ids antiguos sin imagen
      (`gato`, `unicornio`…); `AnimatedAvatar` y `FullScreenLoader` renderizan `<Image>`. Actualizadas
      las pantallas que muestran el avatar (Inicio, elegir perfil, generador, crear perfil) y sus tests.
      Cierra el ítem "Avatares con imagen" del backlog de la Fase de mejoras.
- [x] ✅ **Generar una actividad + historial (US-09/US-10 ampliadas, rama
      `feature/96-actividad-singular-historial`).** El generador produce **una actividad por pulsación**
      (`cantidad: 1`), sin la categoría "Todas" (se elige una concreta; botón en singular "Generar
      actividad"/"Generar otra"). El **historial** muestra ahora también las actividades **pendientes** y
      permite **marcarlas como realizadas** —con valoración— desde ahí (el backend ya persistía toda
      actividad generada; el filtro "solo completadas" era de app). `ActivityCard` expone "Realizado" en
      modo `compact`.
- **DoD:** ✅ `pnpm check` verde tras integrar (**backend 483 + app 332**); typecheck, ESLint y Prettier
  OK. Pendiente: **pruebas manuales del usuario** en develop local.

### Ajustes visuales: selector de avatar + tarjeta y lector de cuento (2026-07-08, rama `feature/104-avatar-picker-grid`)

Lote de retoques de UI (**solo app**; backend sin cambios) sobre la rama `feature/104`. Plan en
[planes/feature-104-avatar-picker-grid.md](planes/feature-104-avatar-picker-grid.md).

- [x] ✅ **Selector de avatar en rejilla, redondo y sin fondo (US-104, amplía US-103).** `AvatarPicker`
      pasa a **4 columnas** (12 avatares en 3 filas de 4) cuyas celdas **ocupan el ancho del contenedor**
      (medido con `onLayout`); cada avatar es **redondo** (recorte circular) y **sin fondo**, con
      **anillo** del color primario al seleccionar.
- [x] ✅ **Título de la tarjeta de cuento del Historial en negrita.** `storyTitle` pasa de `bodyLg`
      (regular) a Quicksand bold, manteniendo el tamaño (la tarjeta de búsqueda ya era bold).
- [x] ✅ **Texto del cuento centrado verticalmente en el lector.** `BookPages`: el contenedor de texto
      pasa de alineado arriba a **centrado** (`justifyContent: 'center'`); el número de página sigue al
      pie y `adjustsFontSizeToFit` evita recortes.
- **DoD:** ✅ `pnpm check` verde (**backend 483 + app 332**). Pendiente: pruebas del usuario + versión
  al integrar en `develop`.
