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

## Pendientes de decidir (cuando toque)

- Chroma: ¿aporta para recomendación por similitud? Decidir en Fase 5; si no, dejar
  documentado por qué se omite (regla YAGNI > completitud del plan).
- CloudProvider: elegir **uno** (Claude u OpenAI). Solo se activa si hay clave. Para
  la ruta cloud usar los modelos Claude más recientes (ver skill `claude-api`).
