# Coordinación — Lote de ajustes 3 de `ideas.txt` (8 ajustes)

8 ajustes de UI/UX detectados en pruebas en dev (captura del Dashboard en Android). Se ejecutan
sobre **una rama** `feature/87-ajustes-ideas-3` desde `develop`, con **commits por feature** en el
orden de olas, gate verde y luego integración **sin release** (con confirmación antes del `finish`).
Los ficheros de la Ola 1 son **disjuntos** (parallel-safe); F5 es transversal y va la última.

Historias nuevas: **US-83…US-88** (épica F, plataforma). Versionado **diferido** (se asigna al
integrar en `develop`, skill `versionar`); en la rama solo se acumula bajo `## [Unreleased]`.

Decisiones confirmadas con el usuario:

- **#1 page-curl** → adoptar **`react-native-page-flipper`** (curl real iOS/Android/Web; su
  `renderPage` admite nodos → sirve para texto). **Supera** US-79 (Skia descartado / aproximación
  reanimated). Se documenta la validación de librerías.
- **#6 colores** → **4º color** en la paleta; cada acción con color fijo entre pantallas; borde
  inferior ("sombra") = tono oscuro **del propio** color del botón.

Compliance: las libs nuevas son UI puras (gradientes/gestos) → C-2/C-5 sin cambios.

Leyenda: ✅ hecho · 🔄 en curso · ⬜ pendiente

## Olas

- **Ola 1 (ficheros disjuntos):** F1, F2, F3, F4, F6.
- **Ola 2 (transversal, última):** F5.

## Features

| Feature                              | Ajustes | US    | Plan                                                                 |
| ------------------------------------ | ------- | ----- | -------------------------------------------------------------------- |
| F1 — Lector como libro + curl real   | #1, #5  | US-83 | [feature-87-lector-libro-curl.md](feature-87-lector-libro-curl.md)   |
| F2 — Historial: bajar buscador       | #2      | US-84 | [feature-88-historial-buscador.md](feature-88-historial-buscador.md) |
| F3 — Cerrar sesión → Dashboard       | #3      | US-85 | [feature-89-logout-dashboard.md](feature-89-logout-dashboard.md)     |
| F4 — Cabeceras con rebote            | #4      | US-86 | [feature-90-cabeceras-rebote.md](feature-90-cabeceras-rebote.md)     |
| F5 — Color botones + sombra por tono | #6      | US-87 | [feature-91-color-botones.md](feature-91-color-botones.md)           |
| F6 — Pestañas: activo + Android      | #7, #8  | US-88 | [feature-92-tabs-android.md](feature-92-tabs-android.md)             |

## Cierre

Gate `pnpm check` verde (backend + app) + `expo export` OK → actualizar `phases.md`, `memory.md`,
`lecciones-aprendidas.md`, historias US-83…US-88 + trazabilidad, CHANGELOG (`## [Unreleased]`).
**Sin release.** No hacer `finish`/merge sin confirmación del usuario tras sus pruebas en dev.
Pasos de prueba: dev build de la app (libs nativas) + backend de `develop` en mock.
