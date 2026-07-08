# Plan — Feature 102: Loader a pantalla completa (US-102)

Rama: `feature/102-loader-pantalla-completa` (desde `develop`).

## Objetivo

Los flujos con espera muestran un **loader a pantalla completa** (modal) con indicador y **texto**
correspondiente, en vez del feedback inline actual: **generar cuento**, **generar actividad**,
**crear cuenta** y **crear perfil**.

## Estado actual

- Generar cuento / actividad: bloque inline (`statusBox` + `ActivityIndicator` + texto + `useSlowHint`).
- Crear cuenta (`ConsentScreen`) / crear perfil (`CreateProfileScreen`): solo el spinner del botón.
- No existe componente de loader reutilizable; el patrón de `Modal` a pantalla completa es el del
  `DialogProvider`.

## Diseño

- Nuevo componente **`FullScreenLoader`** (`Modal` transparente a pantalla completa, `animationType`
  `fade`, `accessibilityViewIsModal`): fondo que cubre la pantalla + `ActivityIndicator` grande +
  **mensaje**; muestra `common.slowHint`/`common.slowHintServer` cuando `useSlowHint` marca lento.
  API declarativa: `<FullScreenLoader visible={...} message={...} />`.

## Fases y tareas

### Fase 1 — Componente + flujos

- ✅ `FullScreenLoader.tsx` (nuevo) + test.
- ✅ `StoryGeneratorScreen`: sustituye el `statusBox` inline por `FullScreenLoader` (`storyGenerator.creating`).
- ✅ `ActivitiesScreen`: idem (`activities.preparing`).
- ✅ `ConsentScreen`: `FullScreenLoader` con `submitting` + nueva clave `consent.creating`.
- ✅ `CreateProfileScreen`: `FullScreenLoader` con `submitting` + nueva clave `createProfile.creating`.
- ✅ i18n es/en: `consent.creating`, `createProfile.creating`.

### Fase 2 — Cierre

- 🔄 `pnpm check` verde ✅; docs (US-102, CHANGELOG app) ✅; pasos de prueba local y confirmación antes del `finish` (pendiente).

## Tests (DoD)

- `FullScreenLoader`: muestra mensaje + indicador con `visible`; oculto si no.
- Los tests de las 4 pantallas siguen verdes (ajuste del texto de carga si aplica).
