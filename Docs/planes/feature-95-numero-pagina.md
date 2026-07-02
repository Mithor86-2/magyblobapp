# Plan — Feature 95: Número de página impreso en cada hoja (US-91, ajuste #3)

Rama: `feature/87-ajustes-ideas-3` (lote 4). Fichero: `BookPages.tsx`.

## Objetivo

Cada hoja del libro muestra su número de página impreso (abajo, como un libro real), además del
indicador "Página n de total" que ya existe bajo los controles.

## Tareas

- ⬜ `BookPages`: añadir un `<Text>` pequeño con `indice + 1` en la parte inferior de la hoja (color
  oscuro fijo sobre el papel blanco; no distrae). Se conserva el indicador de los controles.
- ⬜ Tests: `BookPages.test.tsx` — cada hoja muestra su número impreso (la 2ª muestra "2", etc.).
