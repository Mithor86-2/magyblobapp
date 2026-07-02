# Plan — Feature 91: Color de botones + sombra por tono + 4º color (US-87, ajuste #6)

Rama: `feature/87-ajustes-ideas-3` (lote). **Ola 2** (transversal, la última). Ficheros: `tokens.ts`,
`BubblyButton.tsx` y varias pantallas.

## Objetivo

Los 4 botones de acción (Crear cuenta · Ya tengo cuenta · Búsqueda · Mis logros) tienen colores
**distintos** y **fijos entre pantallas**; el borde inferior ("sombra") de cada botón es un **tono
oscuro de su propio color** (hoy es siempre el borde coral).

## Mapa de color (fijo entre pantallas; sin dos acciones del mismo color en una misma pantalla)

Regla (feedback de pruebas): en una misma pantalla no puede haber dos acciones distintas del mismo
color; cada acción mantiene su color en todas las pantallas; dos acciones comparten color solo si
**nunca** coinciden en la misma pantalla.

| Acción                              | Variante            | Color        |
| ----------------------------------- | ------------------- | ------------ |
| Cuento (generar / crear cuento)     | `primary`           | coral        |
| Actividades (ver / generar)         | `secondary`         | menta        |
| Crear cuenta                        | `quaternary`        | ámbar/dorado |
| Ya tengo cuenta                     | `accent` (tertiary) | cielo/aqua   |
| Mis logros                          | `quaternary`        | ámbar/dorado |
| Búsqueda (Inicio) / Filtros (Hist.) | `accent` (tertiary) | cielo/aqua   |
| Limpiar                             | `quaternary`        | ámbar/dorado |
| Reintentar                          | `secondary`         | menta        |
| Cerrar sesión (destructivo)         | `danger`            | rojo         |

Verificación de no-colisión por pantalla: **Dashboard** {coral, menta, ámbar, cielo} · **Inicio**
{coral, menta, ámbar, cielo} · **Bienvenida** {ámbar, cielo} · **Historial** {cielo (Filtros), ámbar
(Limpiar), menta (Reintentar)} · **Zona adultos** {coral (Cambiar perfil), rojo (Cerrar sesión)}.

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
