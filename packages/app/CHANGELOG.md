# Changelog

Todos los cambios destacables del paquete `@magyblob/app` se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.2.0] - 2026-06-11

Feature 1 de la Fase 5 (US-09): actividades recomendadas con IA y shell de pestañas.

### Added

- Navegación con **pestañas inferiores** (`@react-navigation/bottom-tabs`): tras crear el
  perfil se entra a un tab navigator. En esta entrega, pestañas **Cuentos** y **Actividades**
  (Inicio e Historial llegan en la siguiente feature).
- Pantalla **Actividades** (`presentation/screens/ActivitiesScreen.tsx`): genera actividades
  para el perfil (`POST /activities/recommend`), con filtro de categoría, estados de
  carga/error/reintento y tarjetas `ActivityCard` (color/emoji por categoría).
- `domain`: modelo `Activity`, vocabulario `CATEGORIAS` y `ActivityGateway`; implementación
  HTTP en `infrastructure/http.ts`.

## [0.1.1] - 2026-06-11

### Changed

- Reorganización a **Clean Architecture ligera** sin cambio de comportamiento: capas
  `domain` (modelos, vocabularios, interfaces de gateway, `ApiError`), `infrastructure`
  (adaptador HTTP `createApiGateways` + `storage` de AsyncStorage) y `presentation`
  (pantallas, componentes, store, theme, navegación), con un `composition.ts` como
  composition root. Las pantallas dependen de las interfaces de `domain`, no del `fetch`.

## [0.1.0] - 2026-06-11

Slice vertical del HITO 1 (Fase 4): la app deja de ser placeholder y recorre el flujo
completo **consentimiento → crear perfil → generar cuento** contra el backend real.

### Added

- Andamiaje Expo SDK 56 + React Navigation v7 (native-stack) + Zustand.
- Pantalla **Consent**: puerta parental + alta del adulto responsable (`POST /guardians`)
  con consentimiento; el `guardianId` se persiste (AsyncStorage).
- Pantalla **Crear perfil** (`POST /profiles`): nombre, edad (2-6), idioma (ES/EN),
  avatar y multi-selección de intereses.
- Pantalla **Generador de cuentos** (`POST /stories`): tema (pre-seleccionado desde los
  intereses) + estilo, con estados de carga, error y reintento.
- Cliente HTTP (`src/api/`) agnóstico del proveedor de IA + tipos del contrato de cable y
  test del cliente (Vitest).
- Design system "Aprendizaje Mágico" (`src/theme/tokens.ts`): paleta coral/menta,
  tipografía Quicksand, tap targets ≥64px.
- `metro.config.js` para resolución de paquetes en el monorepo pnpm.
