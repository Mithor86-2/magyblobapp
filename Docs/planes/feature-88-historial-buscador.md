# Plan — Feature 88: Historial, bajar el buscador (US-84, ajuste #2)

Rama: `feature/87-ajustes-ideas-3` (lote). Fichero propio: `HistoryScreen.tsx`.

## Objetivo

El campo de búsqueda queda **tras la sección "Lo último"** y **encima del toggle
[Cuentos | Actividades]** (hoy está justo bajo el subtítulo).

## Tareas

- [x] ✅ Mover el bloque `TextField` de búsqueda + su `toolbar` (Filtros/Limpiar) para renderizarse
      **después** del bloque `destacados` ("Lo último") y **antes** del `segmented`.
- [x] ✅ Mantener búsqueda en vivo + filtros del modal + estados de carga/error donde tienen sentido.
- [x] ✅ Test `HistoryScreen.test.tsx`: el buscador aparece tras "Lo último" y antes del toggle; el
      filtrado en vivo sigue operativo.
