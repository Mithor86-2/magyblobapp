# Changelog

Todos los cambios destacables del paquete `@magyblob/app` se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Pruebas **user-centric** de componentes de UI (US-30): se ejercita cada componente como una persona
  usuaria (queries por rol/etiqueta/texto y simulación de pulsaciones), siguiendo la _Query Priority_
  de Testing Library. Cobertura de **11 componentes** (`BubblyButton`, `ParentalGate`, `TextField`,
  `SelectableChip`, `StarRating`, `AvatarPicker`, `AuthorBadge`, `ActivityCard`, `NarrationControls`,
  `Screen`, `DialogProvider`) en **41 tests**. Se monta el arnés de render bajo Vitest aliasando
  `react-native` a `react-native-web` junto con `@testing-library/react` y `jsdom` (todo
  `devDependencies`: sin red ni SDK de tercero en runtime). El entorno por defecto sigue siendo `node`
  (el test del adaptador HTTP no cambia); cada test de componente declara `@vitest-environment jsdom`.
  El wrapper `Icon` no se prueba directamente (`lucide-react-native` no es importable bajo Vitest) y
  se sustituye por un doble donde hace falta.

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.9.0] - 2026-06-19

Iconografía funcional con lucide-react-native (US-29).

### Added

- Iconografía funcional con **lucide-react-native** (US-29): wrapper central `Icon` que mapea nombres
  semánticos a iconos SVG vectoriales y consume los tokens de tema (tamaño/color); tokens `iconSize`
  (`sm|md|lg`). Iconos empaquetados en build-time (sin red en runtime ni SDK de tercero activo).
  `BubblyButton` admite ahora un icono opcional y botones solo-icono (con `accessibilityLabel`).

### Changed

- Sustituidos los **emojis funcionales** por iconos de Lucide: pestañas (Inicio/Actividades/Cuentos/
  Historial), controles de narración (play/pausa/stop), valoración en estrellas, flecha "Leer cuento",
  acceso a la zona de adultos, categorías de actividad (arte/música/lógica) y badges de "Autor"
  (proveedor de IA). Los **avatares de animales** (y el avatar por defecto) siguen siendo emoji.

## [0.8.0] - 2026-06-18

Narración de cuentos en voz alta (US-22) con ElevenLabs y fallback a voz nativa.

### Added

- Narración de cuentos en voz alta (US-22): botón "▶ Escuchar / ⏸ Pausar / ⏹" en el generador de
  cuentos y en el lector del Historial. Reproduce el audio de ElevenLabs servido por el backend
  (`expo-audio`, cacheado en disco con `expo-file-system`) y **degrada a la voz nativa** del
  dispositivo (`expo-speech`) si la síntesis falla, sin error visible para el niño. Hook
  `useNarration` (con limpieza del audio/voz al salir de la pantalla) y `NarrationControls`.
- Gateway `stories.narrationUrl(storyId)` (URL del audio del cuento).
- Saneo del texto en el fallback de voz nativa (`sanitizeForSpeech`): no narra emojis.

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.7.0] - 2026-06-18

Funcionalidad y personalización: releer cuento y botón "Realizado" (US-27/US-10).

### Added

- Releer un cuento desde el Historial (US-27): pantalla de lectura `StoryReader` (título + cuerpo +
  Autor) a la que se llega tocando un cuento; al abrirla se marca como **leído**.
- Botón **"Realizado"** en las actividades (US-10 ampliada): entrada explícita que pide la
  valoración (1-3 estrellas) y registra la actividad como completada.

### Changed

- En el Historial, la tarjeta de cuento es pulsable y abre la vista de lectura ("Leer cuento →") en
  lugar del botón "Marcar como leído".

## [0.6.0] - 2026-06-12

Autor del contenido (US-25): muestra el proveedor de IA que lo generó.

### Added

- "Autor" del contenido (US-25): componente `AuthorBadge` que muestra qué proveedor de IA generó
  realmente cada cuento y actividad (🎭 simulada · 🖥️ IA local · ☁️ IA en la nube), al final del
  cuento (generador), en cada `ActivityCard` (Actividades) y en el Historial. Tipos espejo con el
  campo `proveedor`.

## [0.5.0] - 2026-06-12

Fase de mejoras — UX y navegación (US-23/US-24).

### Added

- Modal propio reutilizable para avisos y confirmaciones (US-23): `DialogProvider` + `useDialog()`
  (`alert()` / `confirm()`) con el estilo de la app (tokens de tema), en lugar de las `Alert.alert`
  nativas del sistema. Botón con nueva variante **danger** para acciones destructivas.
- Cabecera de navegación con botón "atrás" en las pantallas del stack (US-24): Crear cuenta,
  Iniciar sesión, Elegir perfil, Crear perfil y Zona de adultos. Estilada con los tokens de tema
  (fondo crema, tinte coral, tipografía Quicksand).

### Changed

- Todas las pantallas y la puerta parental usan el modal propio (`useDialog`) en lugar de
  `Alert.alert`: Consent, Login (aviso + confirmación "Crear cuenta"), Zona de adultos (confirmación
  destructiva de cerrar sesión), Crear perfil, Actividades y `ParentalGate`. Cero alertas del sistema.
- Bienvenida y las pestañas (zona infantil) se mantienen sin cabecera. Se eliminaron títulos
  duplicados (hero in-screen que coincidía con el título de cabecera) y el botón "Volver" de la
  zona de adultos (lo cubre el "atrás" de la cabecera).

## [0.4.0] - 2026-06-12

Fase 5.5 (US-19/US-02): sesión del guardián, login por email y multi-perfil.

### Added

- Sesión del guardián y multi-perfil (Fase 5.5, US-19/US-02): pantalla **Bienvenida** (crear cuenta
  o iniciar sesión), pantalla **Iniciar sesión** (login ligero por email contra
  `POST /guardians/login`) y pantalla **Seleccionar perfil** (lista los hijos del guardián vía
  `GET /guardians/:id/profiles` y fija el perfil activo; invita a crear el primero si no hay).
- Gateways `guardians.login` y `profiles.list` en el adaptador HTTP (con sus tests de contrato).
- **Zona de personas adultas** accesible desde Inicio y protegida por la puerta parental, con
  **cambiar de perfil** (vuelve a la selección) y **cerrar sesión** (vuelve al onboarding). La
  puerta parental se extrae a un componente reutilizable `ParentalGate` (usado por el alta y la
  zona de adultos).

### Changed

- El store persiste ahora la **sesión completa**: el `guardian` (antes solo `guardianId`) y el
  `currentProfile` activo, además de la `consentVersion`. Un adulto que vuelve recupera su sesión
  y su perfil; nuevas acciones `clearProfile` y `logout`. Migración de persistencia a v1 (el
  estado anterior se descarta y el adulto se identifica una vez).
- Onboarding por **stack** Bienvenida → (alta/login) → Seleccionar perfil → pestañas; el alta del
  adulto lleva a la selección de perfil en lugar de directamente a crear perfil.

### Fixed

- En **Iniciar sesión**, un adulto sin cuenta ya no se queda sin salida: hay un enlace permanente
  "¿No tienes cuenta? Crear una" y el aviso de email no encontrado ofrece ir directo al alta.

## [0.3.1] - 2026-06-12

### Changed

- Puerta parental **aleatoria**: suma de dos números al azar con opciones barajadas en cada
  apertura (y regeneración tras un fallo), en lugar de una operación fija memorizable.

## [0.3.0] - 2026-06-12

Feature 2 de la Fase 5 (US-07/08/10): historial y progreso. Pestañas a 4.

### Added

- Navegación a **4 pestañas** (Inicio · Actividades · Cuentos · Historial).
- Pantalla **Inicio**: bienvenida con el nombre del niño + accesos a Cuentos/Actividades.
- Pantalla **Historial**: cuentos con estado `nuevo|leído` y acción "Marcar como leído"
  (US-07/08), y actividades hechas con su valoración en estrellas; recarga al recibir foco.
- Completar actividades con **valoración (1-3 estrellas)** desde la tarjeta (US-10) vía
  componente `StarRating`.
- `domain`: tipo `History` y gateways `history.get`, `stories.markRead`, `activities.complete`;
  implementación HTTP correspondiente.

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
