# PLAN DE EJECUCIÓN POR FASES — Proyecto Máster

Estrategia: vertical slice primero. Un flujo completo (crear perfil → generar
cuento) funcionando de punta a punta antes de ensanchar. Nada se cierra sin
pasar el Definition of Done: `tsc --noEmit` limpio, ESLint/Prettier sin errores,
tests verdes, levanta con `docker compose up`.

---

## FASE 0 — Andamiaje y reproducibilidad

Objetivo: repo que arranca en limpio sin pasos ocultos.

- [ ] Monorepo (pnpm workspaces o turborepo) con paquetes backend y app.
- [ ] docker-compose.yml: backend, PostgreSQL 16, Ollama.
- [ ] .env.example completo + scripts de arranque.
- [ ] ESLint + Prettier + Vitest configurados y funcionando.
- [ ] `ollama pull gemma:2b` documentado en el arranque.
- Done: `docker compose up` levanta todo en una máquina limpia.

---

## FASE 1 — Núcleo del dominio y aplicación

Objetivo: lógica de negocio pura, sin frameworks ni IO.

- [ ] Entidades: ChildProfile, Story, Activity.
- [ ] Value-objects solo donde aporten (edad [2-6], idioma [ES/EN]); no inventar otros (YAGNI).
- [ ] Vocabulario de temática único y compartido (animales | espacio | magia |
      aventuras | música): los intereses del perfil pre-seleccionan el tema del cuento.
- [ ] Interfaces de repositorio en /domain.
- [ ] Casos de uso CreateChildProfile y ListProfiles (multi-niño) + sus tests.
- [ ] GenerateStory como caso de uso (su AIProvider se implementa en Fase 2).
- [ ] DTOs de entrada/salida de los casos de uso.
- Done: tests de los casos de uso en verde, cero dependencias externas en /domain.

---

## FASE 2 — Capa de IA (el corazón del proyecto)

Objetivo: tres modos detrás de una sola interfaz.

- [ ] Interfaz común AIProvider: generateStory({perfil, tema, estilo}) en el idioma
      del perfil; recommendActivities (genera actividades con IA según el perfil).
- [ ] MockProvider primero (rápido, testeable sin Ollama).
- [ ] OllamaProvider contra gemma:2b.
- [ ] Selección de modo por variable de entorno (mock | local).
- [ ] Fallback automático a mock si el proveedor activo no responde.
- Done: test del MockProvider verde + smoke test manual del OllamaProvider.

---

## FASE 3 — Persistencia y API HTTP

Objetivo: conectar dominio con DB y exponerlo.

- [ ] Repos PostgreSQL (Prisma u ORM elegido) implementando interfaces del dominio.
- [ ] Migraciones + seeds de datos.
- [ ] Controllers + routes para perfil y generación de cuento.
- [ ] Manejo de errores centralizado.
- [ ] Logs estructurados (pino).
- Done: test de integración de POST /stories en verde.

---

## FASE 4 — Slice vertical en la app móvil ★ HITO 1

Objetivo: demostrar el flujo completo funcionando.

- [ ] Expo + Zustand configurados.
- [ ] Pantalla Crear perfil conectada al backend.
- [ ] Pantalla Generador de cuentos con IA local real.
- Done: demo en vivo — crear perfil → ver cuento generado. Si algo falla aquí,
  se arregla antes de avanzar; lo demás es ensanchar, no rehacer.

---

## FASE 5 — Resto de funcionalidad

Objetivo: completar el dominio y la app.

- [ ] Casos de uso RecommendActivities (genera con IA), SaveProgress, GetHistory
      (cada uno con test). El progreso se modela como estado de Story/Activity (sin
      entidad extra; YAGNI).
- [ ] Pantallas Inicio, Actividades recomendadas, Historial.
- ~~CloudProvider opcional~~ y ~~Chroma~~: **retirados del alcance** (2026-06-12). Se mantienen
  los modos de IA `mock`/`local` (privacidad por diseño) y un **dedup simple por título**
  para no repetir actividades; ni la IA en la nube ni la base vectorial aportan lo suficiente
  para el MVP (YAGNI).
- Done: todas las pantallas y casos de uso operativos y testeados.

---

## FASE 6 — Calidad y robustez ★ HITO 2

Objetivo: app estable y completamente probada.

- [ ] Test por cada caso de uso y cada endpoint (significativo, no de relleno).
- [ ] Estados de carga/error y timeouts de IA en la app.
- [ ] Revisión de acoplamiento, nombres y separación de capas.
- Done: suite completa en verde; app no rompe ante fallos de IA o red.

---

## FASE 7 — Documentación y defensa

Objetivo: que un evaluador lo ejecute y entienda sin ayuda.

- [ ] Prueba del repo en limpio en otra carpeta/máquina (reproducibilidad real).
- [ ] README profesional + guías instalación/ejecución/pruebas.
- [ ] 3-4 ADRs: Clean Architecture, 3 modos de IA, Gemma 2B por defecto, Vector DB.
- [ ] Diagrama de arquitectura (capas + flujo de datos + modos de IA).
- [ ] Guion de demo y respuestas a preguntas previsibles del tribunal.
- Done: clonar → `docker compose up` → app corriendo, sin pasos ocultos.

---

## Riesgos y mitigaciones

- Ollama pesado: Gemma 2B por defecto + MockProvider como red de seguridad
  (evaluador sin GPU corre todo en modo mock).
- Sobre-ingeniería: regla de conflicto del prompt — menos abstracción donde no aporta.
- Alcance: el HITO 1 garantiza entregable mínimo viable aunque el tiempo se comprima.

## Uso con el prompt maestro

Una sesión por fase. Pide al agente trabajar solo la fase actual y detenerse
en su Definition of Done antes de continuar a la siguiente.
