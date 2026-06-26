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

## [0.21.0] - 2026-06-25

### Added

- Validación con Zod de las respuestas del backend en el adaptador HTTP
  (`infrastructure/schemas.ts`): cada gateway valida su respuesta y, si no cumple el
  contrato, produce un `ApiError` de tipo `malformed` en vez de propagar un objeto
  malformado por un cast `as`. Esquemas en `infrastructure` (no en `domain`). (US-44)

### Changed

- `infrastructure/http.ts`: `request` recibe el esquema Zod de la respuesta y la valida
  en la frontera antes de devolverla. (US-44)

## [0.20.0] - 2026-06-25

### Added

- Robustez de red/IA (US-43, Fase 6): **timeout con `AbortController`** en la capa HTTP
  (`infrastructure/http.ts`, 15 s por defecto / 30 s en generación) y en la narración
  (`useNarration`, 15 s con fallback a voz nativa). Al vencer se produce un `ApiError` de tipo
  `timeout` tratado como el resto de errores. Tests del timeout en `http.test.ts`.

### Changed

- `HistoryScreen`: el estado de error ahora incluye un botón **«Reintentar»** (antes solo texto).

## [0.19.0] - 2026-06-25

### Added

- **`AppErrorBoundary` con _fallback UI_ propia (US-41).** Componente sobre `Sentry.ErrorBoundary` que, ante
  un error de render, muestra un aviso amable en español con botón de reintento (en vez de la pantalla en
  blanco) y reporta a Sentry sin PII del niño. Colocado de forma global y por zona (cuentos, actividades,
  lectura). Sin `showDialog`/`feedbackIntegration` (C-12). El detalle técnico (mensaje, _component stack_)
  va a Sentry, nunca a la pantalla.
- **Breadcrumbs de telemetría del recorrido (US-42).** Helper `telemetry` con _wrappers_ tipados
  (`navigation`/`api`/`ui`) sobre `Sentry.addBreadcrumb` (vía _sink_ inyectado, no-op sin DSN);
  instrumentación centralizada en la capa HTTP, la navegación (`onStateChange`) y los _handlers_ de
  negocio. Solo enums/ids/contadores (sin PII del niño); `maxBreadcrumbs`, `beforeBreadcrumb` y
  `scrubEvent` extendido a `breadcrumbs[].data` como defensa en profundidad.

## [0.18.0] - 2026-06-25

### Added

- E2E nativo en **Android** (US-38, paridad de plataformas): nuevo flow
  `.maestro/onboarding.android.yaml`, validado en verde sobre Android Emulator (Pixel_9_Pro) con
  Expo Go y Maestro (56 pasos, narración nativa incluida). Documentada la receta de ejecución
  (red `10.0.2.2`, backend mock `e2e-serve` en :3100) en `estrategia-pruebas.md` y el plan.

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.17.0] - 2026-06-25

### Added

- **Sentry: `release` y `debug` (extensión US-40).** Los eventos se etiquetan con la versión del app
  (`magyblob-app@<versión>`, vía `expo-constants`) para agruparlos por release, y en desarrollo Sentry
  arranca con `debug` activo (logs de verificación). Se añade `expo-constants` y se alinea la `version`
  de `app.json` con la del paquete.
- **Disparador de prueba dev-only de Sentry.** Botón en la zona parental, visible solo bajo `__DEV__`,
  que envía un error de prueba para verificar la tubería de extremo a extremo (no se renderiza en
  producción).

### Changed

- **Sentry: política de PII «proteger al niño, permitir al adulto» (US-40).** El `beforeSend` ahora
  **redacta el nombre del niño** del perfil activo (`[child]`) en mensajes, excepciones y breadcrumbs
  —el dato del menor nunca sale, incluido el que pueda venir dentro de un cuento generado—, y **deja de
  redactar los correos** del adulto administrador (puede salir como dato de diagnóstico). El store
  registra el nombre del perfil activo en Sentry al elegir/cambiar/cerrar perfil y al rehidratar.

## [0.16.0] - 2026-06-25

### Added

- **E2E nativo de la app** con **Maestro** (US-38), nivel complementario —no sustituto— del E2E web
  de Playwright (US-32/US-37/US-39) para validar el flujo del MVP en las plataformas nativas
  (incluyendo lo que solo existe en nativo: audio `expo-audio`, voz `expo-speech`, navegación nativa).
  Incluye:
  - **Flow** [`.maestro/onboarding.yaml`](.maestro/onboarding.yaml) del happy path (bienvenida →
    puerta parental → alta → consentimiento → crear perfil → generar cuento mock → narración →
    actividades → historial), con selectores alineados con el E2E web. La **puerta parental** (opción
    múltiple, suma aleatoria) se resuelve leyendo la pregunta por **texto** (`copyTextFrom` + regex),
    calculando la suma con `evalScript` y tocando el chip resultante.
  - **`testID`** aditivos para selectores estables en nativo: `parental-pregunta` (reto de la puerta
    parental) y `alta-nombre`/`alta-apellidos`/`alta-email` (campos del alta del adulto). No alteran
    el render ni los textos visibles y no afectan a los E2E web (que van por rol/nombre accesible).
  - **ADR 0005** (Maestro vs Detox, decisión por YAGNI) y la sección «E2E web vs E2E nativo» en
    `Docs/estrategia-pruebas.md`.
  - **Esqueleto de CI** [`.github/workflows/e2e-native.yml`](../../.github/workflows/e2e-native.yml)
    en job separado (`workflow_dispatch` + `schedule`), **fuera** del gate de PR por el coste de
    simuladores.

  **Validado en iOS Simulator** (iPhone 17 Pro, iOS 26.4, **Expo Go**, Maestro 2.6.1): pasada completa
  en verde, incluida la narración nativa (`expo-speech` degrada a la voz del dispositivo, que Expo Go
  incluye → no requiere development build). Dependencias solo de desarrollo/CI, modo `mock` por defecto.
  La ejecución determinista requiere el backend en mock real (proveedor cloud desactivado).

### Fixed

- **7 correcciones del flow Maestro halladas al ejecutarlo en iOS** (selectores/timing): puerta
  parental por texto (el `testID` de un `<Text>` no se expone como `id` en iOS), cierre de teclado
  tocando el título (`hideKeyboard` falla en iOS), `scrollUntilVisible` + `centerElement` en chips e
  interés (quedaban bajo el footer fijo), `extendedWaitUntil` tras navegación, selectores de pestaña por
  regex (`'Cuentos, tab.*'`) y asserts de subcadena por regex (`'.*Mateo.*'`). Adaptado a Expo Go
  (`appId host.exp.Exponent`, sin `clearState` por su dev menu; variante development build documentada).

## [0.15.0] - 2026-06-25

Monitorización de errores y crashes con Sentry, como desviación de cumplimiento asumida (US-40, C-12).

### Added

- **Monitorización de errores y crashes con Sentry (US-40).** Integra `@sentry/react-native` con
  **inicialización condicional al DSN** (`EXPO_PUBLIC_SENTRY_DSN`): sin DSN no se inicializa y no sale
  nada a terceros (modo por defecto, desarrollo y E2E en `mock` conformes). `Sentry.wrap` en el
  componente raíz. Nuevo `src/infrastructure/sentry.ts` con su test.

### Security

- **Minimización de datos hacia Sentry (US-40, C-12).** `sendDefaultPii: false` y un `beforeSend` que
  elimina `user`, `request`, `server_name` y el nombre del dispositivo, y redacta correos en
  mensajes/excepciones/breadcrumbs. Sin Session Replay ni `setUser`; sin performance tracing. Es una
  **desviación de cumplimiento asumida (TFM)**, desactivable retirando el DSN; ver
  `Docs/cumplimiento-menores.md` (C-12).

## [0.14.1] - 2026-06-24

Corrige el E2E web al combinar multinavegador (US-37) con la cobertura de actividades/historial
(US-39).

### Fixed

- **E2E web inestable con varios `projects`**: el backend E2E (Postgres efímero) persiste estado
  durante toda la corrida, y los specs reutilizaban un email fijo para el alta del adulto; al
  repetirse el alta entre tests y navegadores fallaba con "email ya registrado" y el onboarding no
  avanzaba (timeout esperando "Crear nuevo perfil"). Ahora cada test se da de alta con un email único
  derivado de `project` + título (`packages/app/e2e/_correo.ts`), de modo que las N tests × M
  navegadores no colisionan (US-37, US-39).

## [0.14.0] - 2026-06-24

Cobertura E2E web de actividades e historial con Playwright (US-39).

### Added

- Cobertura **E2E web** de **actividades** e **historial** con Playwright sobre Expo web (US-39):
  extiende el E2E de onboarding (US-32) reutilizando su patrón para llegar a perfil + cuento generado,
  y luego recorre la pestaña **Actividades** (generar actividades recomendadas y marcar una como
  "Realizado" con valoración → "¡Hecha!", US-09/US-10) y la pestaña **Historial** (el cuento generado
  aparece en "Cuentos mágicos", US-08). Contra el backend real en modo `mock` (contenido
  determinista), localizando por rol/etiqueta accesible. Suite separada
  (`pnpm --filter @magyblob/app test:e2e`, requiere Docker y `e2e:install`).

## [0.13.0] - 2026-06-24

E2E web multinavegador y reporting rico con Playwright (US-37).

### Added

- E2E web **multinavegador** y **reporting rico** (US-37): el E2E de la app con Playwright sobre el
  export web de Expo se ejecuta ahora en tres `projects` —`chromium` (baseline), `mobile-chrome`
  (Pixel 5, viewport móvil _portrait_, mismo motor Chromium) y `mobile-safari` (iPhone 13, motor
  WebKit = el de iOS)— con reporting HTML (`playwright-report`), JSON (`test-results/results.json`)
  y line, y, ante fallo, captura/vídeo/traza (`screenshot/video/trace: *-on-failure`). `retries: 1`
  solo en CI. El script `e2e:install` instala los binarios de **chromium y webkit**, y el
  `.gitignore` ignora `playwright-report/` y `test-results/`. Valida el **export web**, no la app
  nativa; dependencias solo de desarrollo y suite aparte (no toca el arranque reproducible).

## [0.12.0] - 2026-06-24

Cobertura estratégica por riesgo de negocio (Strategic Coverage 100/80/0, US-35).

### Added

- **Cobertura estratégica por riesgo de negocio (Strategic Coverage 100/80/0, US-35):** umbrales de
  coverage **por _glob_** en [`vitest.config.ts`](vitest.config.ts) (provider `v8`) — **100%** en el
  tier CORE (`infrastructure/http`, `hooks/sanitizeForSpeech`) y **80%** de baseline IMPORTANT
  (componentes, store). El tier INFRASTRUCTURE (tipos, gateways, tokens, navegación) y lo cubierto
  por E2E/manual (pantallas, `useNarration` atado a nativo, `Icon`) se **excluyen** de la medición.
  Nuevo script `test:coverage`.
- Tests del tier CORE que faltaban: `sanitizeForSpeech.test.ts` (saneo de texto para la voz nativa),
  `useAppStore.test.ts` (sesión/consentimiento + migración v0→v1) y, en `http`, `getBaseUrl` y los
  caminos de _fallback_ del mapeo de error del backend.

## [0.11.0] - 2026-06-23

E2E de la app con Playwright sobre Expo web (US-32, Fase 6).

### Added

- Prueba **E2E de la app** con Playwright sobre Expo web (US-32): recorre el onboarding completo
  (bienvenida → puerta parental → alta del adulto → crear perfil → generar cuento) en Chromium,
  contra el **backend real en modo `mock`** (Fastify + Postgres efímero con Testcontainers) servido
  a través de un proxy de mismo origen (sin CORS). Localiza por rol/nombre accesible (coherente con
  US-30). Suite separada (`pnpm --filter @magyblob/app test:e2e`, requiere Docker y `e2e:install`).

## [0.10.0] - 2026-06-22

Pruebas user-centric de componentes (US-30).

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
