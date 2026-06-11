# Control de Fases

Estado vivo del proyecto. Se actualiza al cerrar (o avanzar) cada fase. El detalle
del alcance vive en [plan-ejecucion-master.md](plan-ejecucion-master.md); aquí se
lleva el **qué está hecho y qué falta**.

**Definition of Done (todas las fases):** `pnpm check` verde
(typecheck + lint + format + tests) **y** `docker compose up` levanta la pila en limpio.

**Diseño del MVP:** las pantallas y el modelo de datos derivado están en
[Design/README.md](Design/README.md) (export de Stitch). Es la fuente de verdad de la UI.

**Historias de usuario y criterios de aceptación:** en
[historias-usuario.md](historias-usuario.md) (incluye inconsistencias detectadas).

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

## FASE 1 — Núcleo del dominio y aplicación ⬜

Campos del dominio según el diseño (ver [Design/README.md](Design/README.md)):

- [ ] `Guardian` (adulto responsable): `nombre`, `apellidos`, `email`, `parentesco`,
      `telefono?` + consentimiento (`consentimientoDado/En/Ver`). Todo niño cuelga de uno.
- [ ] `ChildProfile`: `guardianId`(FK), `nombre`, `edad`(VO), `idioma`(VO), `avatar`, `intereses[]`.
- [ ] `Story`: entrada `{perfil, tema, estilo}` → salida `{título, cuerpo}` + metadatos
      (estado `nuevo|leído`, fecha). El cuento se genera en `perfil.idioma`.
- [ ] `Activity` (generada con IA): `categoría`, `título`, `descripción`, `duración`,
      `nivel`; progreso como estado (`completadaEn`, valoración) — sin entidad extra.
- [ ] Vocabulario único de temática (`animales | espacio | magia | aventuras | música`)
      compartido por `intereses` y `tema`; los intereses pre-seleccionan el tema.
- [ ] Value-objects solo para `edad` (rango 2–6) e `idioma` (ES/EN); el resto escalares (YAGNI).
- [ ] Interfaces de repositorio en `/domain`.
- [ ] Casos de uso `RegisterGuardian` (con consentimiento), `CreateChildProfile` y
      `ListProfiles` + tests; `GenerateStory` (su `AIProvider` se implementa en Fase 2).
- [ ] DTOs de entrada/salida de los casos de uso.
- **DoD:** tests de casos de uso en verde, cero dependencias externas en `/domain`.

---

## FASE 2 — Capa de IA (el corazón) ⬜

- [ ] Interfaz común `AIProvider`: `generateStory({perfil, tema, estilo})` en el idioma
      del perfil; `recommendActivities` (genera actividades con IA según el perfil).
- [ ] `MockProvider` primero (rápido, testeable sin Ollama).
- [ ] `OllamaProvider` contra `gemma:2b`.
- [ ] Selección de modo por env (`mock | local | cloud`).
- [ ] Fallback automático a mock si el proveedor activo no responde.
- **DoD:** test del `MockProvider` verde + smoke test manual del `OllamaProvider`.

---

## FASE 3 — Persistencia y API HTTP ⬜

- [ ] Repos PostgreSQL (Prisma) implementando interfaces del dominio (incl. `Guardian`).
- [ ] Migraciones + seeds.
- [ ] Tablas `InteractionEvent` (tracking de primera parte) y `AuditLog` (acciones
      sensibles del adulto + consentimiento).
- [ ] Controllers + routes para alta de adulto, perfil y generación de cuento.
- [ ] Manejo de errores centralizado.
- [ ] Logs estructurados (pino).
- **DoD:** test de integración de `POST /stories` en verde.

---

## FASE 4 — Slice vertical en la app móvil ★ HITO 1 ⬜

Referencia visual: pantallas _Crear perfil_ y _Generador de cuentos_ +
design system (Quicksand, paleta coral/menta, tap targets ≥64px) en
[Design/README.md](Design/README.md).

- [ ] Expo + Zustand configurados.
- [ ] Pantalla Crear perfil conectada al backend.
- [ ] Pantalla Generador de cuentos con IA local real.
- **DoD:** demo en vivo — crear perfil → ver cuento generado.

---

## FASE 5 — Resto de funcionalidad ⬜

- [ ] Casos de uso `RecommendActivities` (genera con IA), `SaveProgress`, `GetHistory`
      (cada uno con test).
- [ ] Pantallas Inicio, Actividades recomendadas, Historial.
- [ ] `CloudProvider` opcional (uno basta: Claude u OpenAI), solo si hay clave.
- [ ] Chroma: evaluar como memoria semántica de actividades generadas (dedup/similitud);
      si no aporta, documentar por qué se omite.
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
