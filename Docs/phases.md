# Control de Fases

Estado vivo del proyecto. Se actualiza al cerrar (o avanzar) cada fase. El detalle
del alcance vive en [plan-ejecucion-master.md](plan-ejecucion-master.md); aquí se
lleva el **qué está hecho y qué falta**.

**Definition of Done (todas las fases):** `pnpm check` verde
(typecheck + lint + format + tests) **y** `docker compose up` levanta la pila en limpio.

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

- [ ] Entidades: `ChildProfile`, `Story`, `Activity`.
- [ ] Value-objects solo donde aporten (`edad`, `idioma`); no inventar otros (YAGNI).
- [ ] Interfaces de repositorio en `/domain`.
- [ ] Caso de uso `CreateChildProfile` + su test.
- [ ] DTOs de entrada/salida de los casos de uso.
- **DoD:** tests de casos de uso en verde, cero dependencias externas en `/domain`.

---

## FASE 2 — Capa de IA (el corazón) ⬜

- [ ] Interfaz común `AIProvider` (`generateStory`, `recommendActivities`).
- [ ] `MockProvider` primero (rápido, testeable sin Ollama).
- [ ] `OllamaProvider` contra `gemma:2b`.
- [ ] Selección de modo por env (`mock | local | cloud`).
- [ ] Fallback automático a mock si el proveedor activo no responde.
- **DoD:** test del `MockProvider` verde + smoke test manual del `OllamaProvider`.

---

## FASE 3 — Persistencia y API HTTP ⬜

- [ ] Repos PostgreSQL (Prisma) implementando interfaces del dominio.
- [ ] Migraciones + seeds.
- [ ] Controllers + routes para perfil y generación de cuento.
- [ ] Manejo de errores centralizado.
- [ ] Logs estructurados (pino).
- **DoD:** test de integración de `POST /stories` en verde.

---

## FASE 4 — Slice vertical en la app móvil ★ HITO 1 ⬜

- [ ] Expo + Zustand configurados.
- [ ] Pantalla Crear perfil conectada al backend.
- [ ] Pantalla Generador de cuentos con IA local real.
- **DoD:** demo en vivo — crear perfil → ver cuento generado.

---

## FASE 5 — Resto de funcionalidad ⬜

- [ ] Casos de uso `RecommendActivities`, `SaveProgress`, `GetHistory` (cada uno con test).
- [ ] Pantallas Inicio, Actividades recomendadas, Historial.
- [ ] `CloudProvider` opcional (uno basta: Claude u OpenAI), solo si hay clave.
- [ ] Chroma: integrar si aporta; si no, documentar por qué se omite.
- **DoD:** todas las pantallas y casos de uso operativos y testeados.

---

## FASE 6 — Calidad y robustez ★ HITO 2 ⬜

- [ ] Test por cada caso de uso y cada endpoint (significativo).
- [ ] Estados de carga/error y timeouts de IA en la app.
- [ ] Revisión de acoplamiento, nombres y separación de capas.
- **DoD:** suite completa en verde; app no rompe ante fallos de IA o red.

---

## FASE 7 — Documentación y defensa ⬜

- [ ] Prueba del repo en limpio en otra carpeta/máquina.
- [ ] README profesional + guías instalación/ejecución/pruebas.
- [ ] 3-4 ADRs: Clean Architecture, 3 modos de IA, Gemma 2B por defecto, Vector DB.
- [ ] Diagrama de arquitectura.
- [ ] Guion de demo y respuestas a preguntas del tribunal.
- **DoD:** clonar → `docker compose up` → app corriendo, sin pasos ocultos.
