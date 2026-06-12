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
- [x] `docker-compose.yml`: backend + PostgreSQL 16 + Chroma + Ollama (con healthchecks).
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
- [x] Selección de modo por env en `createAIProvider` (`mock | local | cloud`);
      `cloud` avisa y cae a mock (CloudProvider real es Fase 5).
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

## FASE 5 — Resto de funcionalidad 🔄

Se ejecuta por **features secuenciales** (plan en [planes/fase-5.md](planes/fase-5.md)).

- [x] **F1 Actividades end-to-end** (2026-06-11, US-09 · backend v0.1.0 / app v0.2.0 ·
      rama `feature/5-actividades`): caso de uso `RecommendActivities` (con dedup simple por
      título) + `ActivityRepository` (Prisma) + ruta `POST /activities/recommend`; en la app,
      **tab navigator** (pestañas Cuentos y Actividades) + pantalla **Actividades** con
      `ActivityCard`. Verificado: `pnpm check` (73 tests), `expo export`, y e2e contra
      PostgreSQL real (3 actividades persistidas + dedup devuelve `[]` en la 2ª llamada).
- [ ] **F2 Historial + Progreso**: `GetHistory`, `SaveProgress` (US-10) + pantallas Inicio e
      Historial (tabs a 4).
- [ ] **F3** `CloudProvider` con Claude (solo si hay `ANTHROPIC_API_KEY`).
- [ ] **F4 Chroma**: documentar la omisión (dedup simple cubre el MVP — YAGNI).
- **DoD:** todas las pantallas y casos de uso operativos y testeados.

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
