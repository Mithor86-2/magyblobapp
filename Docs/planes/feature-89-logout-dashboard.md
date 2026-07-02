# Plan — Feature 89: Cerrar sesión vuelve al Dashboard (US-85, ajuste #3)

Rama: `feature/87-ajustes-ideas-3` (lote). Fichero propio: `ParentalScreen.tsx`.

## Objetivo

Al cerrar sesión deben reaparecer "Prueba un cuento / Prueba unas actividades" (viven en el
`DashboardScreen`, inicio sin sesión). Hoy `onCerrarSesion` hace `reset → 'Welcome'`, que no las
tiene.

## Tareas

- [x] ✅ `ParentalScreen.tsx`: `navigation.reset` del logout apunta a **`Dashboard`** (coherente con
      `resolveInitialRoute`: sin `guardian` → `Dashboard`).
- [x] ✅ Test nuevo `ParentalScreen.test.tsx`: al confirmar el logout se llama `logout()` del store y
      `navigation.reset` con `routes: [{ name: 'Dashboard' }]`.
