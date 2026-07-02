# Plan — Feature 83: Lectura tipo libro + pulido UX (US-73)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Cuatro ajustes sobre el lote UX ya integrado en `develop` (modal de búsqueda del Historial,
`ProgressBar`/resumen de logros en Inicio, botón "Marcar como leído", componente `Appear`). Objetivo:
que **generar** un cuento lleve directo a **leerlo** como un **libro paginado**; rematar el modal de
búsqueda con un cierre claro; y motivar al niño mostrando sus **trofeos**. Solo `packages/app`.

**Decisiones (con el usuario):**

- **Efecto libro (A2):** paginado del cuento con **animación de giro con la API `Animated` de RN**
  (swipe horizontal + botones ‹ ›, indicador "página X/N", transición rotateY/opacidad/desplazamiento).
  Sin librerías nuevas ni rebuild; no es un rizado 3D fotorrealista.
- **Generar → lector (A1):** al generar se navega al `StoryReader` y se **quita la vista inline** del
  generador (queda como formulario). Una sola pantalla de lectura.

## Historias cubiertas

- US-73 — Lectura tipo libro + pulido UX ([épica F](../historias-usuario/epic-f-plataforma.md#us-73))

## Tareas

- [x] ✅ A1 — "Generar cuento" navega al `StoryReader`; eliminada la vista inline del generador.
- [x] ✅ A2 — Paginador puro `paginarCuento` (párrafos → frases, robusto ante 1 línea/vacío) +
      componente `BookPages` (swipe, ‹/›, indicador n/total, animación `Animated`) en el lector.
- [x] ✅ A3 — Botón "X" (icono `close`) arriba a la derecha del modal de búsqueda del Historial.
- [x] ✅ A4 — Fila de 🏆 pequeños (uno por logro conseguido, tope + "+N", mensaje de ánimo si 0) en Inicio.
- [x] ✅ Tests unit/componente: `paginarCuento` (6), `BookPages` (5), X del modal, fila de trofeos.
- [x] ✅ E2E actualizados: `onboarding` (generar → lector) y `actividades-historial` (volver del lector
      al flujo de pestañas tras generar).
- [x] ✅ i18n ES/EN: `reader.page`, `reader.prevPage`, `reader.nextPage`, `home.noAchievementsYet`.
- [x] ✅ Docs: US-73 en épica F + trazabilidad README; `## [Unreleased]` del CHANGELOG del app.
- [ ] 🔄 Gate + coverage + integración verdes; PR → CI (3 jobs) verde.
- [ ] ❌ Pruebas con el usuario en dev → confirmación → cierre con `cerrar-feature`.

## Verificación (DoD)

1. `pnpm check` + `pnpm coverage` verdes (backend + app).
2. `pnpm --filter @magyblob/backend test:integration` verde (Docker).
3. CI verde en los 3 jobs (PR a `develop`).
4. **Pruebas con el usuario en dev** (pasos abajo).

## Pruebas en dev

`cd packages/app` con el backend arriba (`10.0.2.2:3000` en emulador Android) → `npx expo run:android`:

- Generar cuento → **abre el lector**; pasar páginas con swipe y con ‹ / › (indicador "Página X/N").
- Escuchar narración → "Marcar como leído".
- Historial → abrir "Buscar" → **X** cierra el modal.
- Inicio → **trofeos** 🏆 bajo la barra de progreso de logros.
