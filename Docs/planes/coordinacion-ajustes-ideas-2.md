# Coordinación — Lote de ajustes 2 de `ideas.txt` (5 correcciones)

Correcciones detectadas en las pruebas en dev del lote anterior (US-75…US-82). Se ejecutan en **una
rama** `feature/86-ajustes-ideas-2` desde `develop`, con commits por ajuste, gate verde y luego
integración **sin release** (con confirmación antes del `finish`). Son refinamientos de historias
existentes (US-77, US-78, US-81, US-64/US-82, US-79); se actualizan sus criterios y se documenta el
lote en [phases.md](../phases.md).

Decisión confirmada: el **page-curl (#5)** se implementa **sin Skia** (se mejora la animación
reanimated actual para simular un pliegue), no con `@shopify/react-native-skia`.

Estado: ✅ hecho · 🔄 en curso · ✅ pendiente

## Tareas

### 1 · Backend — actividades con parentesco + nombre (refina US-77) ✅

- ✅ Subir seed `prompt.activity.system` a **v6** en
  [prisma/app-settings.json](../../packages/backend/prisma/app-settings.json): la IA debe usar el
  trato EXACTAMENTE como se le da, incluido el nombre ("mamá Ana", "abuela Ana"); ejemplo con nombre.
- ✅ Verificar el camino de código (ya compone el nombre: `RecommendActivities` pasa `guardian.nombre`,
  `terminoCuidador`/`buildActivitiesPrompt`/`MockProvider` lo usan; tests existentes lo cubren).

### 2 · Backend — título de la continuación = base + nº (refina US-78) ✅

- ✅ `ContinueStory` usa `siguienteTitulo(origen.titulo)` en vez del título de la IA
  ("Joaquín en el bosque" → "… 2" → "… 3"). Función pura exportada.
- ✅ Tests en `continue-story.test.ts` (sin número → "… 2"; con "… 2" → "… 3"; unidad de `siguienteTitulo`).

### 3 · App — pasos visibles al generar actividades (refina US-81) ✅

- ✅ `ActivityCard` gana `pasosVisiblesInicial?: boolean` (default `false`); `ActivitiesScreen` lo pasa
  `true` al renderizar lo recién generado. Historial/Búsqueda siguen plegados.
- ✅ Test: con el prop en `true` los pasos se ven sin pulsar "Ver pasos".

### 4 · App — buscador del Historial en vivo, con filtros (refina US-64/US-82) ✅

- ✅ Sacar la búsqueda a un `TextField` en línea (como `SearchResultsScreen`), en vivo sobre la pestaña
  activa; el modal se queda solo con los **filtros** (botón "Filtros (N)"). `filtrarCuentos`/
  `filtrarActividades` ya combinan búsqueda + filtros.
- ✅ Test: teclear filtra en vivo; los filtros del modal siguen aplicando junto con la búsqueda.

### 5 · App — mejorar el efecto de pliegue (refina US-79, sin Skia) ✅

- ✅ En `BookPages`, sobre la animación reanimated actual, añadir un **realce de pliegue** (capa de
  sombra/degradado rgba en el canto que gira, siguiendo `drag`) y afinar ángulo/curva para que parezca
  que la hoja se curva. Sin dependencias nuevas.
- ✅ Mantener verde el test de `BookPages` (navegación ‹/› + hoja blanca).

## Cierre

Gate `pnpm check` verde (backend + app) → actualizar `phases.md`, criterios de las US afectadas y
CHANGELOG (`## [Unreleased]`). **Sin release.** No hacer `finish`/merge sin confirmación del usuario
tras sus pruebas en dev. Pasos de prueba: dev build de la app + backend de `develop` (rebuild).
