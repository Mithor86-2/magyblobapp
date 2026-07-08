# Changelog

Todos los cambios destacables del paquete `@magyblob/app` se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

### Changed

- Selector de avatar (Crear perfil) en **rejilla de 4 columnas** (12 avatares en 3 filas de 4) cuyas
  imágenes **ocupan el ancho del contenedor**, **redondas** (recortadas en círculo) y **sin fondo**;
  el avatar elegido se marca con un **anillo redondo**. (US-104, amplía US-103)
- Título de la **tarjeta de cuento** del Historial en **negrita** (antes en peso normal).
- Texto del cuento **centrado verticalmente** en la hoja del lector (antes alineado arriba).

### Deprecated

### Removed

### Fixed

### Security

## [1.15.0] - 2026-07-07

### Added

- Avatares de perfil con **imágenes propias** (US-103): set de 12 ilustraciones empaquetadas
  (256×256, sin descargas en runtime) que sustituyen a los emojis en el selector y en todas las
  pantallas que muestran el avatar (Inicio, elegir perfil, generador de cuentos, crear perfil y
  loader a pantalla completa). Los perfiles antiguos con un `id` sin imagen caen a un avatar por
  defecto.

### Changed

- Generación de actividades **una a una** (antes en lote) y sin la categoría "Todas": se elige una
  categoría concreta y el botón pasa a singular ("Generar actividad" / "Generar otra"). (US-09)
- El **historial de actividades** muestra también las **pendientes** (antes solo las completadas) y
  permite **marcarlas como realizadas** —con valoración— desde ahí; el resumen "Lo último" de
  Inicio considera también las pendientes. (US-10)

### Removed

- Avatares emoji y el helper `avatarEmoji` (reemplazados por imágenes, US-103).
- Opción "Todas" del selector de categorías de actividades (clave i18n `activities.all`). (US-09)

## [1.14.0] - 2026-07-07

### Added

- Portadas de cuento **empaquetadas por tema/estilo** (US-101): `StoryCover` resuelve la
  portada elegida por el backend (`portadaKey`) contra un catálogo local de imágenes, con
  orden **portada generada → portadaKey → respaldo por tema**. Se aplica en el lector y en el
  historial.
- Loader **a pantalla completa** (US-102): nuevo componente `FullScreenLoader` (modal con
  indicador + mensaje y avisos de espera larga) usado al **generar cuento**, **generar
  actividad**, **crear cuenta** y **crear perfil**, en vez del feedback inline / solo-botón.
  Fondo translúcido y muestra el **avatar del perfil** cuando aplica (generar cuento/actividad
  y crear perfil).

## [1.13.0] - 2026-07-07

### Added

- Color e icono por **valor de vocabulario** (US-100): cada tema, estilo, enseñanza y
  categoría tiene un color propio y estable en toda la app (mismo texto → mismo color;
  "Música" tema y categoría comparten color), vía la paleta `categoryColors` del theme y el
  resolvedor `vocabColor`. Se refleja en los chips de selección (Cuentos, Crear perfil,
  Dashboard), en los chips de **categoría** de Actividades y en los filtros del Historial
  (con su icono), y en las tarjetas.
- La tarjeta de cuento del **historial** muestra la **portada** y un **botón** de leer
  estilado; el **borde** de la tarjeta usa el color del tema (== color del botón) y muestra
  el icono del tema tintado (US-100).

### Changed

- La tarjeta de actividad usa el color central por categoría; el **borde** de la tarjeta y la
  acción ("Ver pasos") comparten color (US-100).
- En el **Historial**, las tarjetas de actividad son **compactas** (altura similar a las de
  cuento): descripción, pasos, duración/nivel y valoración quedan ocultos tras un botón
  "Ver más" (US-100). Fuera del historial la tarjeta no cambia.
- La barra de cabecera de Inicio, Actividades, Cuentos e Historial muestra siempre
  "Aprendizaje Mágico", **centrado** y en **color primario**; el icono de la zona de adultos
  es algo más pequeño y también en color primario.

### Fixed

- La imagen de cabecera de las pantallas ocupa el 100 % del ancho con alto
  proporcional (`ancho / proporción`), mostrándose entera sin recorte ni bandas
  laterales (antes se estiraba/recortaba porque `aspectRatio` no fija el alto en
  react-native).

## [1.12.0] - 2026-07-07

### Added

- **Versión de la app en la pantalla sin sesión (US-99).** El `Dashboard` (inicio sin sesión) muestra
  ahora el `VersionFooter` al pie, como el resto de pantallas.
- **El "Autor" distingue el proveedor cloud concreto (US-99).** El `AuthorBadge` de cuentos y
  actividades añade la letra del proveedor al final: **G** (Gemini), **GQ** (Groq), OR (OpenRouter),
  CB (Cerebras), conservando el icono/etiqueta de "IA en la nube". `PROVEEDORES_IA` se amplía con esos
  targets.

### Added

- **Banner de warm-up no bloqueante al arrancar (US-95).** Al abrir la app se muestra una franja
  superior "Preparando el servidor…" mientras se despierta el backend (cold start de Render free,
  ping a `/health`); desaparece al responder o al agotar reintentos. La app es navegable mientras
  tanto. Nuevo hook `useServerWarmup` y `warmUp` con callback `onReady` (retrocompatible).

### Changed

- **El cuento anónimo abre el lector con puerta de sesión (US-96).** Sin sesión, al generar el
  cuento en el Dashboard ahora se abre la vista de lectura (como con sesión) en vez de mostrarlo
  inline. Las acciones que requieren cuenta (Escuchar, Marcar como leído, Favorito, Continuar) abren
  una modal "Inicia sesión para continuar" con un botón **Crear cuenta** que lleva al alta.
- **Incoherencia de datos de sesión → error + cerrar sesión (US-98).** Si una petición ligada a la
  sesión (perfil/guardián: generar cuento/actividades, historial, logros, listar perfiles) responde
  `404 NotFoundError` porque ese id ya no existe en la BD, en vez del error crudo se muestra una modal
  "Error de datos", se cierra la sesión y se vuelve al inicio sin sesión para revalidar los datos al
  volver a iniciar sesión. Los 404 de contenido puntual (marcar leído, favorito, continuar, completar)
  no cierran sesión.

### Fixed

- **Última línea del cuento recortada (US-97).** En pantallas donde la hoja del libro es pequeña, una
  página de ~120 palabras desbordaba el alto fijo y la última línea salía cortada. Se reduce el
  objetivo de paginado (120→60 palabras/página) y el texto encoge para caber (`adjustsFontSizeToFit`,
  alineado arriba reservando el número de página), de modo que ninguna página recorta contenido.

## [1.10.2] - 2026-07-06

### Changed

- Sin cambios funcionales en la app; versión alineada con el release de corrección del backend
  (fix del envío de email de verificación en producción, ver CHANGELOG de `@magyblob/backend`).

## [1.10.1] - 2026-07-06

### Security

- Forzadas versiones parcheadas de transitivos de test vulnerables (Dependabot) vía `overrides` en
  `pnpm-workspace.yaml`: `vite ≥6.4.3` y `esbuild ≥0.28.1` (vía `@vitest/coverage-v8`). Resuelve la
  vulnerabilidad **high** de `vite`; sin exposición en producción (la app no sirve dev server web).
  Detalle en [Docs/planes/deps-vulnerabilidades.md](../../Docs/planes/deps-vulnerabilidades.md).

## [1.10.0] - 2026-07-04

### Added

- Lectura de cuento (US-27): al **llegar a la última página** aparece —**medio segundo después**,
  para dar tiempo a ver el final— una **modal** que pregunta si marcar el cuento como leído y, al
  confirmar, lo marca (idempotente). Se muestra una sola vez por lectura y no aparece si ya estaba
  leído; complementa el botón "Marcar como leído" y el fin de la narración. `BookPages` expone
  `onReachedEnd`.
- Pantalla **Verificar email** (US-93): tras crear la cuenta con verificación requerida, la app pide un
  código OTP de 6 dígitos —en **6 casillas, una por dígito** (`CodeInput`)— enviado al email del adulto,
  con opción de **reenviar** (cooldown) y estados de error (código incorrecto/caducado/intentos agotados).
  Al validar el código correcto, inicia sesión y navega a Seleccionar perfil. Si el backend no requiere
  verificación (sin SMTP), el onboarding es el de siempre (auto-login).

### Changed

- Inicio (US-94): los cuatro accesos rápidos (Crear un cuento, Ver actividades, Mis logros, Buscar)
  pasan a una **rejilla de 2 columnas** y cada uno muestra un **icono** sobre la etiqueta (libro,
  paleta, trofeo y lupa). El mismo icono acompaña ahora la acción equivalente donde aparece: "Generar
  cuento" (Cuentos y Dashboard) → libro; "Generar actividades" (Actividades y Dashboard) → paleta.
  `BubblyButton` admite `layout: 'row' | 'stack'` (tile vertical) y el wrapper `Icon` añade el nombre
  semántico `achievements` (trofeo).
- El alta (`api.guardians.register`) resuelve de forma transparente la puerta parental server-side
  del backend (US-92): obtiene el reto de `GET /guardians/challenge` y envía la respuesta junto al
  alta. El `ParentalGate` cliente (verificación humana) se mantiene; no cambia la UI del formulario.

### Deprecated

### Removed

### Fixed

- Crash nativo de **reanimated 4 / New Architecture** (`stof: out of range` en
  `performNonLayoutOperations`) al procesar eventos **táctiles/scroll** mientras había una
  **animación reanimated en bucle activa** en la pantalla visible (el `cancelAnimation` al desmontar
  y la pausa al desenfocar no bastaban: el crash salta también en la pantalla enfocada al tocar/scrollear).
  Se **desactivan las animaciones decorativas en bucle**: el **balanceo idle del avatar**
  (`AnimatedAvatar`, US-90) y el **rebote de la cabecera** (`BouncingHeaderImage`, US-86) pasan a
  renderizarse **estáticos** (sin reanimated). Las animaciones puntuales del lector (giro de página)
  no se ven afectadas. Pendiente reintroducir el movimiento cuando el combo Expo/RN/reanimated lo
  permita sin crashear.

### Security

## [1.9.3] - 2026-07-03

Sin cambios en el runtime del app; versión unificada del monorepo. Cambios en tooling de pruebas
(E2E web reducido a chromium; E2E nativo Maestro solo manual). El APK v1.9.1 sigue vigente.

## [1.9.2] - 2026-07-03

Sin cambios en el app; versión unificada del monorepo (hotfix de backend: arranque en Render con
Prisma 7). El APK v1.9.1 sigue vigente (no cambia el código del app).

## [1.9.1] - 2026-07-03

### Fixed

- **Más crashes nativos al navegar con animaciones en vuelo (reanimated 4 / New Arch).** Igual que en
  `BookPages` (US-83), `BouncingHeaderImage` (cabecera de Historial/Cuentos, bucle infinito) y
  `AnimatedAvatar` (Inicio/Dashboard, bucle infinito) **no cancelaban** sus animaciones al desmontarse;
  al cambiar de pantalla mientras el header/avatar se animaba (p. ej. esperando en Historial a que
  responda el _cold start_ de Render), el bucle tocaba un nodo destruido → crash nativo. Ambos cancelan
  ahora con `cancelAnimation` en el _cleanup_ (con test de regresión). _(La petición pendiente no era la
  causa: en React 18 el `setState` tras desmontar es no-op; el crash lo provocaba la animación.)_

### Security

## [1.9.0] - 2026-07-02

### Added

- **Pie con la versión de la app.** Nuevo `VersionFooter` al final de Welcome, Inicio y la zona de
  adultos. Versión y build del binario nativo (`expo-application`) y backend desde
  `EXPO_PUBLIC_API_URL` (`getBaseUrl()`). Formato por entorno: en **desarrollo** toda la info
  (`v. 1.8.0 (1) DEV · RENDER`/`· LOCAL`); en **release apuntando a Render** solo `v. 1.8.0 (1)`; en
  **release que no va a Render** se marca `local` (`v. 1.8.0 (1) local`).

### Changed

- **Lector: todas las páginas del mismo tamaño (US-83).** `BookPages` pasa de alto mínimo a un **alto
  fijo** por página, así el libro no cambia de tamaño al pasar página; las páginas cortas centran su
  contenido dejando espacio (como un libro real).

### Deprecated

### Removed

### Fixed

- **Los crashes del APK no llegaban a Sentry (US-40).** El DSN (`EXPO_PUBLIC_SENTRY_DSN`) solo estaba
  en el `.env` local (dev), pero **`eas.json` no lo inyectaba** en los perfiles `preview`/`production`,
  así que el APK de EAS arrancaba sin DSN → Sentry no se inicializaba → nada se reportaba. Se añade el
  DSN (público por diseño, ya iba embebido en el bundle) al `env` de `preview` y `production`; el APK
  reporta ahora con `environment: production`. _(Symbolicación de stacks: pendiente añadir el plugin
  `@sentry/react-native/expo` + `SENTRY_AUTH_TOKEN` para subir source maps.)_
- **Crash nativo del lector al navegar atrás a mitad del giro de página (US-83).** `BookPages` no
  cancelaba las animaciones de reanimated en vuelo al desmontarse; al volver del lector con un giro a
  medias, el callback tocaba un nodo ya destruido y en reanimated 4 / New Architecture provocaba un
  crash nativo en dispositivo real. Se cancela la animación (`cancelAnimation`) en el _cleanup_ del
  componente. Confirmado en dispositivo (Samsung SM-A505G, Android 11).
- **Crash por desajuste de versiones con el SDK 56.** Dependabot había subido `babel-preset-expo` y
  `expo-haptics` a la major 57 (Expo SDK 57) mientras el proyecto está en SDK 56; `babel-preset-expo`
  57 transpila un bundle incompatible con RN 0.85 (worklets de reanimated) → crash al arrancar. Se
  fijan ambos a las versiones del SDK 56 (`npx expo install`); `expo-doctor` vuelve a 21/21. El salto
  a Expo 57 se hará deliberadamente (SDK entero) en su propia rama.

### Security

## [1.8.0] - 2026-07-02

### Added

- **Lector como libro: portada + historia + "FIN" (US-83, ajustes #1 + #5).** `BookPages` acepta una
  **portada** (1ª página: imagen + título del cuento) y una página final **"FIN"**, además de la
  historia paginada. El pase de página mantiene el **giro de hoja con Reanimated** (`rotateY` +
  escala, arrastre y ‹/›), **sin sombras** (se quitaron la banda de sombra del pliegue y la sombra de
  elevación de la hoja; solo queda el giro). _(Se intentó el curl "real" con `react-native-page-flipper`,
  pero su versión 1.0.1 crashea con Reanimated 4 / New Architecture; se descartó y se quitaron esas
  dependencias — ver `Docs/memory.md`.)_
- **Cabeceras con rebote en loop (US-86, ajuste #4).** Nuevo `BouncingHeaderImage`: la imagen de
  cabecera oscila suavemente arriba↔abajo en bucle infinito (reanimated `withRepeat`).
- **4º color de acción "ámbar" (US-87, ajuste #6).** Nueva variante `quaternary` de `BubblyButton` y
  tokens `quaternary`/`onQuaternary`/`quaternaryBorder` (claro y oscuro) para distinguir "Mis logros".
- **Chips por categoría: color + icono (US-89, lote 4 #1).** `SelectableChip` admite `icon` y `color`
  por categoría; en Cuentos los chips de temas (cielo), estilos (menta), enseñanza (ámbar) y usar-nombre
  (coral) tienen color e icono propios; los iconos de tema se reutilizan en los intereses al crear el
  perfil y en el Dashboard. Helper `chipIcons.ts` + nuevos iconos lucide en `Icon`.
- **Avatar del niño con animación idle continua + pop y estrellas al tocar (US-90, lote 4 #2).** Nuevo
  `AnimatedAvatar`: balanceo orgánico **continuo y sin pausas** (bucle ~4 s) que combina rebote
  vertical (2 por bucle) y vaivén izquierda↔derecha (1 por bucle) por interpolación de seno
  (`ease-in-out` natural, loop perfecto sin cortes). El giro se atenúa con una ventana (seno²) de modo
  que hay un **tramo de rebote más suave y sin giro** en los extremos del bucle (continuo a través del
  corte). Al **tocar** el avatar (Inicio y cabecera de
  Cuentos): salto rápido de **escala** (feedback táctil) + **ráfaga de estrellas** desde el centro
  hacia afuera. También se usa (sin toque) en el avatar seleccionado del `AvatarPicker`.
- **Número de página impreso en cada hoja (US-91, lote 4 #3).** Cada hoja del libro muestra su número
  de página, además del indicador "Página n de total".

### Changed

- **Colores de botón consistentes + sombra por tono propio (US-87, ajuste #6).** Regla: en una misma
  pantalla no hay dos acciones del mismo color, y cada acción mantiene su color entre pantallas. Mapa:
  Cuento (generar/crear)=coral, Actividades (ver/generar)=menta, **Crear cuenta=ámbar** (`quaternary`,
  antes coral como "Generar cuento"), Ya tengo cuenta=cielo (`accent`), Mis logros=ámbar, **Búsqueda
  (Inicio)=cielo** (antes menta como "Ver actividades"), Filtros (Historial)=cielo, Limpiar=ámbar,
  Reintentar=menta, Cerrar sesión=rojo (`danger`). El borde inferior ("sombra") de cada botón pasa a
  ser un **tono oscuro de su propio color** (antes era siempre el borde coral).
- **Buscador del Historial reubicado (US-84, ajuste #2).** El campo de búsqueda baja a **después de
  "Lo último"** y **encima del toggle [Cuentos | Actividades]**.
- _(US-88 revertida, ajustes #7 + #8.)_ Tras las pruebas, la barra de pestañas se **deja como estaba
  antes del lote**: el resaltado del activo es el "blob" alrededor del icono y el `tabBarStyle` original
  (sin `tabBarButton` propio ni inset inferior). Los cambios de tabulador se descartan a petición del
  usuario.
- **Cerrar sesión vuelve al Dashboard (US-85, ajuste #3).** Tras el logout se navega al `Dashboard`
  (inicio sin sesión con "Prueba un cuento / Prueba unas actividades"), no a `Welcome`.

### Deprecated

### Removed

### Fixed

- **`babel-preset-expo` declarado como devDependency del app.** `babel.config.js` (US-79) referencia
  `babel-preset-expo`, pero solo estaba disponible por transitividad; en un build nativo limpio (EAS /
  `gradlew assembleRelease`) con pnpm estricto, Metro fallaba al bundlear con `Cannot find module
'babel-preset-expo'`. Se añade como dependencia directa para que la APK/AAB compile.
- **Expo Doctor 21/21 limpio (pre-build).** Se elimina `androidNavigationBar` de `app.json` (fuera del
  esquema de SDK 56; el color de la barra ya lo gestiona `expo-navigation-bar` en runtime, US-66); se
  añade el peer que faltaba `expo-asset` (requerido por `expo-audio`); se alinean a la versión de la
  SDK `expo`, `expo-constants`, `expo-font`, `expo-splash-screen`; y se marca `@sentry/react-native`
  (8.x intencional, US-40) en `expo.install.exclude` para no falsar el chequeo de versiones.

### Security

- **Vitest 2 → 3 (chore/vitest-3).** Actualiza `vitest` y `@vitest/coverage-v8` a `^3.2.6`, cerrando
  la vulnerabilidad **crítica** de Vitest (`<3.2.6`). Solo afecta a tooling de test
  (`devDependencies`); no se envía al bundle de la app (compilado por EAS/Metro). Los 272 tests y los
  umbrales de coverage siguen en verde sin cambios de configuración. Residuos dev-only (vite/esbuild
  vía vitest; uuid vía el toolchain de Expo) se difieren a Dependabot/Expo.

## [1.7.0] - 2026-07-02

### Changed

- **Pasos visibles al generar actividades (US-81, ajuste).** `ActivityCard` acepta
  `pasosVisiblesInicial`; el generador (`ActivitiesScreen`) lo pasa `true` para que las actividades
  recién generadas muestren el paso a paso de inmediato; en Historial/Búsqueda siguen plegados.
- **Buscador del Historial en vivo (US-64, ajuste #4).** La búsqueda pasa de vivir en el modal a un
  **campo en línea siempre visible** que filtra la pestaña activa a medida que se escribe (como el de
  Inicio); el modal queda solo con los **filtros** (botón "Filtros (N)"). Búsqueda + filtros se combinan.
- **Efecto de pliegue del lector más marcado (US-79, ajuste #5).** `BookPages` añade una sombra de
  pliegue en el canto que gira y un giro/escala más pronunciados siguiendo el arrastre, para aproximar
  un page-curl **sin** añadir `@shopify/react-native-skia`.

### Added

- **Continuar la historia desde el lector (US-78).** Botón "Continuar la historia" en `StoryReaderScreen`
  que llama al gateway `stories.continueStory` (`POST /stories/:id/continue`) y **abre el capítulo
  nuevo** en el lector (`navigation.push`), con estado de carga y aviso de error. i18n ES/EN
  (`reader.continueStory`, `reader.continueError`).
- **Opción de usar el nombre del niño (US-76).** Toggle "Usar el nombre de {niño}" en el generador
  (activo por defecto); el gateway `stories.generate` envía `usarNombre`. i18n ES/EN
  (`storyGenerator.nameField`, `storyGenerator.useName`).
- **Lector con page-curl por gesto (US-79).** `BookPages` se reescribe con
  `react-native-gesture-handler` + `react-native-reanimated` (+ `react-native-worklets`): pasar
  página **arrastrando** con giro 3D (`rotateY` + `perspective`) en el hilo de UI, conservando los
  botones ‹ / › y el indicador. La hoja tiene **alto consistente** (proporcional a la pantalla) para
  que las páginas no salten de tamaño. `App` se envuelve en `GestureHandlerRootView` y se añade
  `babel.config.js` (el plugin de worklets lo aporta `babel-preset-expo`). Bajo Vitest ambas libs se
  aliasan a stubs inertes (la navegación por ‹/› sigue verificándose). **Requiere dev build** (Expo
  Go no sirve con estos módulos nativos, como ya ocurría desde US-66).
- **Búsqueda global de cuentos y actividades (US-82).** Nueva pantalla `SearchResults` (stack raíz,
  accesible desde Inicio con el botón "Buscar") con un campo de texto que, sobre la biblioteca del
  perfil (`GET /profiles/:id/history`), lista en un mismo sitio los **cuentos y actividades** que
  coinciden (reutiliza `filtrarCuentos`/`filtrarActividades`); tocar un cuento abre el lector. i18n
  ES/EN (`nav.search`, `search.*`, `home.search`).
- **Nombre de sección en la cabecera (US-80).** `Screen` acepta `title`, mostrado fijo arriba a la
  izquierda de la barra de cabecera (junto al botón de la zona de adultos); las 4 pestañas
  (Inicio · Actividades · Cuentos · Historial) lo pasan reutilizando las etiquetas `tabs.*` (ES/EN).
- **Pasos de actividad plegables (US-81).** En `ActivityCard` las instrucciones empiezan **ocultas**
  con un botón **"Ver pasos"**; al desplegarlas se muestran los pasos y el botón pasa a **"Ocultar
  pasos"**. i18n ES/EN (`activityCard.showSteps`, `activityCard.hideSteps`).
- **Historial con pestañas Cuentos/Actividades (US-74, A3).** Franja "Lo último" con el último cuento y
  la última actividad, y un **toggle Cuentos / Actividades** (por defecto Cuentos) que muestra la lista
  completa del tipo elegido; la búsqueda/filtros aplican a la pestaña activa. i18n ES/EN
  (`history.tabStories`, `history.tabActivities`, `history.latest`, `history.lastStory`,
  `history.lastActivity`).
- **Lectura tipo libro (US-73, A2).** El lector muestra el cuento **paginado** (una página a la vez)
  con swipe horizontal, botones ‹ / ›, indicador "Página {n} de {total}" y **animación de giro**
  (`Animated` de RN, sin librerías nuevas). Nuevo paginador puro `paginarCuento` (robusto ante cuerpo
  de una línea, multipárrafo o vacío) y componente `BookPages`; i18n ES/EN (`reader.page`, `‹`/`›`).
- **Trofeos ganados en Inicio (US-73, A4).** Bajo la barra de progreso de logros, fila de **🏆
  pequeños** (uno por logro conseguido, acotada con "+N"); mensaje de ánimo si aún no hay ninguno
  (`home.noAchievementsYet`, ES/EN).
- **Cerrar el buscador del Historial (US-73, A3).** Botón **"X"** arriba a la derecha del modal de
  búsqueda (icono `close`, etiqueta accesible "Cerrar").
- **Pantalla "Mis logros" (US-68).** Vitrina de medallas del perfil (cuentos, actividades, racha y
  temas) con progreso y estado conseguido/bloqueado, accesible desde Inicio; consume
  `GET /profiles/:id/achievements`. Gateway `achievements`, tipos y esquema Zod, e i18n ES/EN.
- **Cuento a la carta: enseñanza (US-69).** Chip de selección única opcional "¿Qué quieres enseñar?"
  en el generador (envía `ensenanza`) y **filtro por enseñanza** en el Historial; tipos, esquema Zod e
  i18n ES/EN.
- **Aviso de espera larga en cold-start (A1).** Hook `useSlowHint` que, tras ~6 s cargando, muestra
  "esto está tardando más de lo usual…" (más el matiz de que el servidor puede tardar ~1 min en
  despertar) en Generador, Actividades y Dashboard.
- **Resumen de logros en Home (A4).** Tarjeta con "conseguidos/total" y `ProgressBar` que lleva a
  Mis logros.
- **Botón fijo a la zona de adultos (A6).** `AdultsButton` en el header compartido (`Screen`), visible
  en las 4 pestañas.
- **Animaciones de entrada (A5).** Wrapper `Appear` (`Animated` integrado: translateY + escala) en
  imágenes de cabecera, botón principal del footer, tarjetas de actividad/cuento y medallas de logros.

### Changed

- **Cuento paginado por la IA, mínimo 4 páginas (US-74, A1).** El prompt pide dividir el cuento en ≥4
  páginas (párrafos separados por línea en blanco) y `paginarCuento` respeta esos cortes garantizando
  ≥4 páginas; el modo `mock` también genera ≥4 páginas. (Requiere sincronizar `app-settings.json` a la
  BD, US-70.)
- **Giro 3D al pasar página (US-74, A2).** El lector pasa página con un efecto **3D** (`rotateY` con
  perspectiva, dirección según avance/retroceso) sobre **fondo blanco tipo papel**, en vez del giro
  leve anterior.
- **Generar cuento navega al lector (US-73, A1).** Al generar se abre el `StoryReader` y el generador
  deja de mostrar el cuento en línea (queda como formulario). Una sola pantalla de lectura.
- **Marcar cuento como leído explícito (A2).** Ya no se marca leído solo por abrir el lector: se marca
  con el botón "Marcar como leído" (en la vista de lectura y en el resultado del generador, en color
  `accent` para distinguirlo del botón de escuchar) o al terminar de escuchar la narración
  (`onFinished` en `useNarration`).
- **Historial reorganizado (A3).** Búsqueda de texto y todos los filtros pasan a un **modal** ("Buscar"
  con contador de filtros activos + "Limpiar"); el título del cuento se muestra completo.
- **Timeouts tolerantes al cold-start de Render (A1).** Warm-up con reintentos (`/health`, ~70 s) y
  timeouts más holgados (base 30→60 s, generación 90→120 s) para no abortar mientras la instancia
  suspendida de Render free despierta.
- Refactor interno del cliente HTTP (`fetchWithRetry`): bucle de reintentos acotado + intento final,
  **sin cambio de comportamiento** (mismos intentos/backoff). Elimina una rama muerta y restaura la
  cobertura CORE de `http.ts` al 100%; E2E de alta localizado por `testID` (robusto). (US-72)
- **"Realizado" marca la actividad al instante (US-72).** El botón la completa sin obligar a puntuar
  (valoración opcional, editable después con las estrellas); el estado "hecha" se rige por
  `completadaEn`. Simplifica el flujo de dos pasos.

### Deprecated

### Removed

### Fixed

- **Las actividades marcadas como realizadas ya se ven en el Historial (US-72).** El Historial
  considera "hecha" una actividad por su `completadaEn` (no por la `valoracion`), coherente con el
  backend, y ya no depende del segundo paso (puntuar) para registrarla. Cubierto por E2E (marcar
  realizada → aparece en el Historial); añadido `testID="history-activities"` para acotar la aserción.

### Security

## [1.6.0] - 2026-07-01

### Changed

- Sin cambios funcionales en el app; versión alineada (lockstep) con el release conjunto v1.6.0
  (backend: configuración por JSON con sync versionado, US-70).

## [1.5.0] - 2026-07-01

### Added

- Tema **claro/oscuro** reactivo en toda la app con selección **Automático / Claro / Oscuro** desde la
  zona de adultos, persistida (no se borra al cerrar sesión). "Automático" sigue el esquema del sistema
  operativo (US-66). Toda la implementación es local (lectura del SO + módulos build-time de Expo), sin
  red ni SDK de terceros (Docs/cumplimiento-menores.md).

### Changed

- Las **barras del sistema** (barra de estado y, en Android, la barra de navegación inferior de
  botones/gestos), la barra de pestañas y las cabeceras de navegación son ahora coherentes con el tema
  activo (US-66). `userInterfaceStyle` pasa a `automatic`.
- **La app se arranca con un development build** (`cd packages/app && npx expo run:android` / `run:ios`),
  no con Expo Go: al usar módulos nativos (`expo-navigation-bar`/`expo-system-ui`) Expo Go ya no puede
  cargarla. Documentación de arranque (READMEs y `estrategia-pruebas.md`) actualizada (US-66).
- La **paleta del tema oscuro** pasa del cocoa cálido al diseño **"cielo nocturno"** (índigo cósmico)
  de `Docs/Design/stitch_magyblob/DESIGN_Dark.md`: superficies índigo profundas, coral como acción
  principal, púrpura suave (secundario) y aqua (terciario), con texto lila claro de alto contraste
  (US-66). El tema claro y los tokens invariantes (Quicksand, radios, espaciado) no cambian.

### Deprecated

### Removed

### Fixed

### Security

## [1.4.1] - 2026-06-28

### Added

- `eas.json` con perfiles de **EAS Build**: `preview` (APK de distribución interna apuntando al backend
  de producción, para probar en dispositivo), `development` (APK dev contra `10.0.2.2`) y `production`
  (AAB). La URL del backend va en `env.EXPO_PUBLIC_API_URL` del perfil (la build en la nube no usa el
  `.env` local).
- Cabecera de documentación de módulo en las pantallas `StoryGeneratorScreen`, `HistoryScreen`,
  `CreateProfileScreen` y `ActivitiesScreen`, que aún no la tenían (US-65).

## [1.4.0] - 2026-06-28

### Added

- **Favoritos (UI) y búsqueda en el Historial (US-64).** Botón **estrella** (lucide `star`, relleno
  cuando es favorito) para alternar el favorito de un cuento o actividad en la **lectura** del cuento
  (`StoryReaderScreen`), los **ítems del Historial** y la tarjeta de actividad (`ActivityCard`), con
  actualización **optimista** (revierte si el backend falla). Nuevos gateways
  `stories.setFavorite(id, favorito)` / `activities.setFavorite(id, favorito)` contra
  `POST /stories/:id/favorite` y `POST /activities/:id/favorite` (autenticados, body `{ favorito }`),
  con `favorito?: boolean` opcional en los tipos `Story`/`Activity` y sus esquemas Zod (compatibilidad
  durante la transición hasta integrar el backend).
- **Búsqueda de texto en el Historial** (en cliente): campo de texto que filtra cuentos y actividades
  por coincidencia **normalizada** (minúsculas, sin acentos, por subcadena) en título, cuerpo
  (cuentos), descripción e instrucciones (actividades), tema, estilo y categoría; lógica pura en
  `historyFilters.ts` (US-64).
- **Filtro "Solo favoritos"** en el Historial (chip toggle), combinado con los filtros de tema/estilo/
  categoría (US-62) y con la búsqueda de texto (US-64).

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.3.0] - 2026-06-27

### Added

- **Fecha de generación** en el Historial (cada cuento y actividad), la **lectura** del cuento y la
  tarjeta de actividad: se muestra `creadoEn` (ISO del backend) **formateado y localizado** según el
  idioma del app (ES/EN); si el dato falta no se muestra nada (US-62, amplía US-08).
- **Filtros de búsqueda en el Historial** (en cliente): cuentos por **tema** y **estilo**,
  actividades por **categoría**, con chips y opción **"Todos"** por defecto; el estado del filtro es
  local de la pantalla (US-62).

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.2.5] - 2026-06-27

### Fixed

- Dashboard sin sesión, UX del límite (US-50): al recibir **429** del backend (cupo anónimo agotado
  por IP, p. ej. tras recargar la app) el contador se pone al máximo, así el botón queda **deshabilitado**
  con "Límite alcanzado" y se muestra un **mensaje visible justo encima del botón** (antes el aviso solo
  salía como un error al final de la pantalla, fuera de vista). El contador y el mensaje van ahora sobre
  cada botón de generar (cuentos y actividades).

## [1.2.4] - 2026-06-27

### Changed

- Las **instrucciones** de las tarjetas de actividad ("Cómo hacerlo") se muestran como **lista
  numerada** (un paso por línea) en vez de un párrafo; helper `pasosDeInstrucciones` que parte el
  texto por los marcadores "1. / 2. …" o por líneas (US-54).

### Deprecated

### Removed

### Fixed

### Security

## [1.2.3] - 2026-06-27

### Fixed

- Portada en el **Dashboard sin sesión** (US-50/US-59): la tarjeta del cuento de prueba (modo anónimo)
  no mostraba portada; ahora pinta el **respaldo local por tema** con `StoryCover` (el modo anónimo no
  genera imagen, así que siempre usa el respaldo), igual que el generador con sesión y la lectura.

## [1.2.2] - 2026-06-27

### Fixed

- Cabecera de pantalla (US-58): la imagen se muestra completa pero dentro de una banda de alto
  proporcional al alto de pantalla (acotada a 170–200), centrada y con el fondo del theme rellenando
  el espacio sobrante, en vez del `aspectRatio` cuadrado del origen que la hacía demasiado alta.
- Portadas (US-59): se quita la portada de las tarjetas de actividad (`ActivityCard`), que vuelve al
  icono por categoría. Las portadas por tema quedan solo para cuentos
  (`StoryReaderScreen`/`StoryGeneratorScreen`), ya que los respaldos locales se organizan por tema y
  las actividades por categoría.

## [1.2.1] - 2026-06-27

### Changed

- i18n del app sin `expo-localization`: el idioma lo elige la persona adulta y por defecto es `es`; se
  retira la detección del idioma del dispositivo (default/fallback `es` fijo + cambio manual vía el
  selector existente). Se elimina la dependencia `expo-localization` (US-57).

### Fixed

- Cabecera de pantalla: la imagen se muestra **completa** (`resizeMode="contain"`, con la proporción del
  origen ~1000×1026) en vez de recortada (`cover`), para que se vea entera y bien encuadrada (US-58).

## [1.2.0] - 2026-06-27

### Added

- Portadas de imagen en cuentos y actividades (US-59): la app **siempre** muestra una portada con
  cero latencia. Prefiere la imagen generada por el backend (`story.portada` / `activity.imagen`) si
  existe; si no, cae a un **respaldo local empaquetado** elegido por tema
  (`assets/images/story/<tema>.png`, mapa estático con `default`), siguiendo el mismo patrón de
  `require` estáticos que las cabeceras (US-58). Se renderiza en la lectura del cuento
  (`StoryReaderScreen`), en el generador (`StoryGeneratorScreen`) y en `ActivityCard`, respetando el
  layout y las cabeceras. Los tipos `Story.portada?` / `Activity.imagen?` y los esquemas Zod de
  respuesta admiten el campo opcional.
- Internacionalización del app ES/EN (US-57): se introduce `i18next` + `react-i18next` (diccionarios
  `es`/`en` empaquetados, sin red ni descarga en runtime) y `expo-localization` como sugerencia inicial
  del idioma del dispositivo. El idioma por defecto y de respaldo es `es` (los textos en español se
  conservan idénticos bajo claves). Los textos hardcodeados de las pantallas, los componentes con texto
  y los títulos de cabecera del stack pasan a resolverse con `t('clave')`. El idioma del app
  (`appLanguage`, ES/EN) se persiste en `useAppStore` y se cambia desde un selector en la zona de
  adultos, independiente del idioma del perfil del niño (que gobierna la generación de cuentos en el
  backend).
- Cabeceras ilustradas por pantalla (US-58): el lienzo base `Screen` acepta una prop opcional
  `headerImageName` (`welcome | home | dashboard | cuentos | actividades`) que pinta la imagen de
  cabecera correspondiente de `assets/images/headers/` en la parte superior, dentro del área segura y
  por encima del contenido desplazable, conservando el scroll, el footer fijo y el
  `KeyboardAvoidingView` (US-53). El mapeo nombre → imagen usa `require` estáticos (requisito de
  Metro). Reciben cabecera Bienvenida, Inicio, Dashboard, el generador de cuentos y Actividades; el
  resto de pantallas se queda sin ella.

### Changed

- Las 5 imágenes de cabecera (`assets/images/headers/*.png`) se **optimizan** de ~2 MB a ~200-400 KB
  cada una (redimensionado y recompresión) sin degradación visible, reduciendo el peso del bundle del
  app (US-58).

### Deprecated

### Removed

### Fixed

### Security

## [1.1.0] - 2026-06-26

### Added

- Robustez en producción del alta/login (US-53): **reintento con backoff** (hasta 2) en el adaptador
  HTTP ante fallos transitorios (`timeout`/`network`) y **ping de warm-up** a `/health` al arrancar,
  para absorber el _cold start_ del backend en Render. Ayuda visual del requisito de contraseña en la
  pantalla de alta (≥8 caracteres con al menos una letra y un número).

### Changed

- Timeouts más holgados acordes al arranque en frío del servidor (US-53): peticiones normales
  `15 s → 30 s`, generación de IA `30 s → 90 s` y narración `15 s → 30 s`.
- La contraseña del alta exige ahora **≥8 caracteres con al menos una letra y un número** (antes solo
  longitud mínima), sincronizada con la validación del backend (US-53).
- `Screen` envuelve su contenido en `KeyboardAvoidingView` para que el teclado no tape los campos de
  los formularios (Consent/Login/CreateProfile), conservando el scroll y el footer fijo (US-53).
- Estándares de diseño Android/iOS (US-56): **feedback táctil** conforme a Material 3 / HIG en los
  componentes base. `BubblyButton` y `SelectableChip` muestran **`android_ripple`** (recortado a la
  píldora) además del estado "hundido"/atenuado existente; en plataformas sin háptica (web) degradan
  sin error. Se añade **`expo-haptics`** (SDK de Expo, empaquetado en build-time: sin red ni SDK de
  tercero en runtime) y `BubblyButton` dispara un **háptico suave** (`ImpactFeedbackStyle.Light`) al
  pulsar; deshabilitado o cargando no dispara háptico.
- Cabecera del stack (`stackScreenOptions` en `App.tsx`): el botón "atrás" pasa de
  `headerBackButtonDisplayMode: 'minimal'` a `'default'` (US-56) para seguir la HIG de iOS —muestra el
  título de la pantalla anterior cuando cabe y degrada a "Back"/solo icono según el espacio—, dejando
  una vuelta atrás consistente entre versiones de iOS (en iOS 26+ el título de "atrás" se oculta por
  defecto). En Android el chevron sigue sin etiqueta (Material).
- Contenido IA (US-54): `ActivityCard` muestra las **instrucciones paso a paso** de la actividad
  cuando existen, y el botón **"Realizado"** usa un **color de acento** propio del theme (en lugar del
  color de la categoría).

### Fixed

- Contenido IA (US-54): el generador de cuentos (`StoryGeneratorScreen`) ofrece **todos** los temas
  del vocabulario (`animales · espacio · magia · aventuras · musica`) con los intereses del perfil
  **pre-seleccionados**; antes la lista se limitaba a los intereses y ocultaba magia y música.

## [1.0.1] - 2026-06-26

### Added

- Icono de la app y splash de marca (US-52): icono **adaptativo** de Android bien separado
  (`foreground` con el logo en la zona segura sobre transparente, `background` de color plano
  `#fff8f6`, `monochrome` como silueta para Android 13+) e `icon.png` recompuesto sobre **fondo
  sólido** `#fff8f6` (sin transparencia → sin esquinas negras en iOS). Splash con `expo-splash-screen`
  y **fondo `#ccc4b9`** (logo centrado, `contain`). Respaldo del logo transparente en `logo-source.png`.

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [1.0.0] - 2026-06-26

Primer release de producción. App verificada contra el backend en producción (Render / Neon / Groq).
Hito de versión: consolida el trabajo de las versiones 0.x; sin cambios de código respecto a la 0.24.0.

## [0.24.0] - 2026-06-26

### Added

- Documentada la parametrización de `EXPO_PUBLIC_API_URL` hacia el backend de **producción** (Render,
  US-51) en `.env.example` (comentario con la URL pública de ejemplo), sin romper el default local
  (`http://localhost:3000`). La URL se inlinea en el bundle (no es secreta). Ver `Docs/despliegue.md`.
- Pantalla `Dashboard` de **inicio sin sesión** (US-50): explica la app y permite probar hasta 3
  cuentos y 3 actividades en **modo anónimo efímero** (contador en el cliente, no persistente), con
  accesos a crear cuenta e iniciar sesión.
- Gateways anónimos `stories.generateAnonymous` y `activities.recommendAnonymous` (rutas públicas del
  backend, sin token) y sus tipos/esquemas Zod de respuesta.

### Changed

- `resolveInitialRoute`: sin sesión, la ruta inicial pasa de `Welcome` a `Dashboard` (US-50).

### Deprecated

### Removed

### Fixed

### Security

## [0.23.0] - 2026-06-26

### Added

- Selección de perfil al arrancar (US-49, amplía US-02): el store guarda la lista de hijos del
  guardián (`profiles` + `setProfiles`) como fuente única, y `SelectProfileScreen` la alimenta en
  lugar de un `useState` local. Función pura `resolveInitialRoute` (en
  `presentation/initialRoute.ts`) que decide la ruta inicial del app, con tests de los cuatro
  caminos.

### Changed

- Lógica de arranque del app (US-49): al recuperar la sesión, si el guardián tiene **un único**
  perfil y ninguno activo, se **auto-selecciona** y entra directo a `Main` (antes siempre paraba en
  «Elegir perfil»); con varios o ninguno va a `SelectProfile`, con perfil activo a `Main` y sin
  sesión a `Welcome`. Migración de persistencia del store a **v3** (el shape persistido incorpora
  `profiles`; el estado previo se descarta y el adulto se identifica una vez).
- Generador de cuentos con **selección múltiple** de temas y estilos (US-47): los chips de la
  pantalla `StoryGeneratorScreen` ahora son toggle (varios a la vez); el botón "Generar" se
  deshabilita y avisa si no hay al menos un tema y un estilo. `api.stories.generate` envía las listas
  `temas`/`estilos` al backend.
- `GenerateStoryRequest` pasa de `tema`/`estilo` (singulares) a `temas: Tema[]`/`estilos: Estilo[]`
  (US-47). La respuesta del cuento no cambia: el backend devuelve el tema/estilo representativo
  singular, que la app sigue mostrando igual.
- Campo de **contraseña** en el alta (`ConsentScreen`) y en el login (`LoginScreen`) del adulto
  (US-48), con validación de longitud mínima; los gateways de alta/login envían la contraseña.
- El login deja de ser identificación ligera por email: `LoginScreen` exige contraseña y muestra un
  mensaje de error **genérico** ante credencial inválida (`401`), sin distinguir email de contraseña
  (US-48).

### Security

- La contraseña se introduce con entrada protegida (`secureTextEntry`) y solo viaja al backend; no se
  persiste en el cliente (US-48).

## [0.22.0] - 2026-06-26

### Added

- Sesión autenticada con JWT (US-45): el store persiste `accessToken` y `refreshToken`
  (además de guardián y perfil), con `setSession`/`setTokens`; el adaptador HTTP adjunta
  `Authorization: Bearer` en las rutas protegidas y, ante un 401, renueva el access con el
  refresh (`POST /guardians/refresh`) y reintenta una vez. Nuevo gateway `guardians.refresh`.

### Changed

- `guardians.login` y `guardians.register` devuelven la **sesión** (`GuardianSession`:
  guardián + tokens); las pantallas de login/alta usan `setSession`. La narración adjunta
  el Bearer al descargar el audio (ruta protegida) y degrada a voz nativa ante un 401. (US-45)
- Migración de persistencia del store a **v2**: el estado previo (sin tokens) se descarta y
  el adulto vuelve a identificarse una vez para obtener la sesión JWT. (US-45)

### Deprecated

### Removed

### Fixed

### Security

- Ante una sesión inválida/expirada que no puede renovarse, el adaptador HTTP cierra la
  sesión (`logout`) y la app vuelve al onboarding, en lugar de quedar en un estado sin
  autorización. Los tokens se guardan solo en el almacenamiento local del dispositivo. (US-45)

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
