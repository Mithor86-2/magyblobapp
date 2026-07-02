# Plan — Feature 84: Libro por páginas (IA) + giro 3D + Historial con pestañas (US-74)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Tres ajustes UX que continúan la lectura tipo libro (US-73) y el historial. Se implementan **en
paralelo** (ficheros disjuntos) sobre una sola rama `feature/84-libro-3d-historial`. Decisiones con el
usuario: la "página" = párrafo separado por línea en blanco (sin marcadores en los datos, sin cambio de
esquema); giro 3D con `Animated` de RN sobre fondo blanco; Historial = **destacados arriba + toggle
abajo**.

## Historias cubiertas

- US-74 — Libro por páginas (IA) + giro 3D + Historial con pestañas ([épica F](../historias-usuario/epic-f-plataforma.md#us-74))

## Tareas

### A1 — La IA entrega la historia por páginas (mínimo 4)

- [ ] ❌ Prompt: instruir ≥4 páginas (párrafo por página, `\n\n`) en `prompt.story.system`
      ([app-settings.json](../../packages/backend/prisma/app-settings.json)) + `INSTRUCCION_SEGURIDAD`
      ([prompts.ts](../../packages/backend/src/infrastructure/ai/prompts.ts)); **bump de `version`** de la clave.
- [ ] ❌ `MockProvider` cuerpo en ≥4 párrafos (`\n\n`).
- [ ] ❌ `paginarCuento` respeta cortes de la IA + `minPaginas = 4` (subdivide si <4); vacío→`['']`.
- [ ] ❌ Tests: `paginarCuento` (≥4, respeta `\n\n`, vacío) + MockProvider (≥4 párrafos).

### A2 — Giro 3D + fondo blanco

- [ ] ❌ `BookPages` flip 3D en dos fases (`rotateY`+`perspective`, dirección por sentido), fondo
      blanco tipo papel (texto oscuro, sombra/borde), indicador y ‹/› intactos.
- [ ] ❌ Test `BookPages` (render página 1, ‹/› cambian, indicador; flip no rompe render).

### A3 — Historial con pestañas Cuentos/Actividades + destacados

- [ ] ❌ `HistoryScreen`: franja "Lo último" (último cuento + última actividad por fecha desc) + toggle
      Cuentos/Actividades (default Cuentos) mostrando la lista del tipo activo; búsqueda/filtros por pestaña.
- [ ] ❌ i18n ES/EN: `history.tabStories`, `history.tabActivities`, `history.latest`, `history.lastStory`,
      `history.lastActivity`.
- [ ] ❌ Test `HistoryScreen` (toggle conmuta listas; destacados muestran el último de cada tipo).

### Cierre

- [ ] ❌ E2E `actividades-historial.spec` actualizados (toggle + destacados) y validados en local.
- [ ] ❌ Docs (este plan, US-74 + trazabilidad, CHANGELOG `[Unreleased]`).
- [ ] ❌ Gate + coverage + integración verdes; PR → CI 3 jobs; pruebas usuario → cierre sin release.

## Verificación (DoD)

1. `pnpm check` + `pnpm coverage` + `test:integration` verdes.
2. CI verde en los 3 jobs (PR a `develop`).
3. Pruebas con el usuario en dev.

## Despliegue (A1)

Al cambiar `prompt.story.system` hay que **sincronizar `app-settings.json` a la BD** (dev y prod) con el
proceso documentado (US-70). Se recuerdan los comandos al cerrar.

## Pruebas en dev

`cd packages/app` con backend arriba → `npx expo run:android`:

- Generar cuento → lector con **≥4 páginas**; pasar página con **giro 3D** sobre hoja blanca.
- Historial → arriba "Lo último" (último cuento + última actividad); **toggle** Cuentos/Actividades
  cambia la lista; el buscador aplica a la pestaña activa.
