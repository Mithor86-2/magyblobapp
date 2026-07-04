# Plan — Feature 94: Inicio en 2 columnas + iconos en las acciones

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Rama: `feature/94-inicio-2-columnas-iconos`.

## Contexto

- ✅ La app ya tiene iconografía funcional con `lucide-react-native` vía el wrapper `Icon` (US-29):
  mapa de nombres semánticos en [../../packages/app/src/presentation/components/Icon.tsx](../../packages/app/src/presentation/components/Icon.tsx).
- ✅ `BubblyButton` ya admite `icon?: IconName` (lo pinta delante del texto, layout en fila).
- ❌ Los 4 botones de Inicio se apilan en **una sola columna** y **sin icono**
  ([../../packages/app/src/presentation/screens/HomeScreen.tsx](../../packages/app/src/presentation/screens/HomeScreen.tsx)).
- ❌ No hay icono semántico para "logros" en el mapa `Icon`.
- ❌ Los botones de acción equivalentes (Generar cuento / Generar actividades) no llevan icono.

**Decisiones con el usuario:**

- Alcance = **Inicio + botones equivalentes** de otras pantallas (coherencia en toda la app).
- Icono de "Crear un cuento" = **libro (BookOpen)**, el mismo de la pestaña Cuentos (coherencia con la
  barra inferior), no la varita.
- En 2 columnas el texto (fuente 22) no cabe junto al icono en una línea → los tiles usan un **layout
  vertical** (icono grande arriba, etiqueta debajo, hasta 2 líneas).

## Historias cubiertas

- US-94 — Inicio en 2 columnas + iconos en las acciones ([épica F](../historias-usuario/epic-f-plataforma.md#us-94)).

## Tareas

- [ ] ✅ Icono `achievements` (lucide `Trophy`) en el wrapper `Icon`.
- [ ] ✅ `BubblyButton`: prop `layout?: 'row' | 'stack'` (por defecto `row`); en `stack` apila icono
      grande sobre la etiqueta (hasta 2 líneas).
- [ ] ✅ Inicio: rejilla de 2 columnas con los 4 tiles + su icono (`story`, `activities`,
      `achievements`, `search`).
- [ ] ✅ Coherencia: icono en "Generar cuento" (Cuentos, Dashboard) y "Generar actividades"
      (Actividades, Dashboard).
- [ ] ✅ Tests: `BubblyButton` (layout `stack` sigue accesible por rol/nombre); `HomeScreen`
      (los 4 botones siguen localizándose y navegando).
- [ ] ✅ Docs: US-94 + trazabilidad, CHANGELOG del app, este plan al día.
- [ ] 🔄 Gate verde (`pnpm check` ✅ en verde) + **pruebas con el usuario** → cierre con `cerrar-feature`.
