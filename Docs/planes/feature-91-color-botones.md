# Plan — Feature 91: Color de botones + sombra por tono + 4º color (US-87, ajuste #6)

Rama: `feature/87-ajustes-ideas-3` (lote). **Ola 2** (transversal, la última). Ficheros: `tokens.ts`,
`BubblyButton.tsx` y varias pantallas.

## Objetivo

Los 4 botones de acción (Crear cuenta · Ya tengo cuenta · Búsqueda · Mis logros) tienen colores
**distintos** y **fijos entre pantallas**; el borde inferior ("sombra") de cada botón es un **tono
oscuro de su propio color** (hoy es siempre el borde coral).

## Mapa de color (fijo en todas las pantallas)

| Acción                                         | Variante             | Color         |
| ---------------------------------------------- | -------------------- | ------------- |
| Crear cuenta / generar cuento                  | `primary`            | coral         |
| Ya tengo cuenta / acción afirmativa secundaria | `tertiary`           | cielo/aqua    |
| Búsqueda / filtros / generar actividades       | `secondary`          | menta/púrpura |
| Mis logros                                     | `quaternary` (nuevo) | ámbar/dorado  |
| Cerrar sesión (destructivo)                    | `danger`             | rojo          |

## Tareas

- [x] ✅ `tokens.ts`: añadir 4º color `quaternary` + `onQuaternary` + `quaternaryBorder` a `ColorTokens`,
      `lightColors` y `darkColors`; añadir bordes por variante `secondaryBorder`, `tertiaryBorder`,
      `errorBorder` (tono oscuro de cada color). `primaryBorder` ya existe.
- [x] ✅ `BubblyButton.tsx`: mapa `variantBorder(colors)` paralelo a `variantBg`; `borderBottomColor`
      pasa a ser el del variante. Añadir variante `quaternary` (icono en `onQuaternary`).
- [x] ✅ Asignar variantes consistentes en: `DashboardScreen`, `HomeScreen`, `WelcomeScreen`,
      `LoginScreen`, `ParentalScreen`, `HistoryScreen`, `StoryGeneratorScreen`.
- [x] ✅ Tests: `BubblyButton.test.tsx` (cada variante pinta su bg + su borde; variante `quaternary`
      renderiza) y `ThemeProvider.test` (tokens nuevos presentes en ambas paletas).
