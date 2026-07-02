# Epic F — Plataforma y no-funcionales

Historias: **US-06**, **US-17**, **US-18**, **US-14**, **US-15**, **US-23**, **US-24**,
**US-25**, **US-29**, **US-30**, **US-31**, **US-32**, **US-33**, **US-34**, **US-35**, **US-36**,
**US-37**, **US-38**, **US-39**, **US-40**, **US-41**, **US-42**, **US-43**, **US-44**, **US-45**,
**US-46**, **US-50**, **US-51**, **US-52**, **US-56**, **US-57**, **US-58**, **US-60**, **US-65**,
**US-71**.
Volver al [índice](README.md).

## US-06 — Arranque reproducible · Must

Como **evaluador** quiero clonar y levantar todo con un comando para revisar el
proyecto sin pasos ocultos.

**Criterios de aceptación**

- Dado un equipo limpio, Cuando ejecuto `cp .env.example .env && docker compose up`,
  Entonces la pila (backend + PostgreSQL + Ollama) levanta y `/health` responde 200.
- Dado el modo por defecto `AI_PROVIDER=mock`, Cuando arranco, Entonces todo funciona
  sin GPU ni modelo descargado.
- Dado que quiero IA local real, Cuando ejecuto `pnpm ollama:setup`, Entonces se
  descarga `gemma:2b` (único paso con red, documentado).

## US-17 — Logs y tracking de primera parte · Should

Como **responsable del producto** quiero registrar interacciones y acciones sensibles
de forma propia (sin terceros) para medir uso y tener trazabilidad cumpliendo las
reglas de menores. Ver [cumplimiento-menores.md](../cumplimiento-menores.md).

**Criterios de aceptación**

- Dado un evento de uso (pantalla vista, cuento generado, actividad completada), Cuando
  ocurre, Entonces se registra un `InteractionEvent` con `profileId` (pseudónimo) y sin
  PII en el payload.
- Dado el tracking, Cuando se implementa, Entonces **no** usa SDKs de analítica/ads de
  terceros ni identificadores de dispositivo (regla Kids/Families).
- Dada una acción sensible del adulto (alta/edición/borrado de perfil, consentimiento),
  Cuando ocurre, Entonces se registra un `AuditLog` con actor, acción y entidad.
- Dada la política de conservación, Cuando se define, Entonces `InteractionEvent` y
  `AuditLog` se purgan según un plazo documentado (C-9).

## US-18 — Configuración editable (prompts y parámetros de IA) · Should

Como **desarrollador/administrador** quiero ajustar prompts, ids de modelo y parámetros
de generación sin tocar código ni reconstruir la imagen, para iterar la calidad de
cuentos y actividades. Ver `AppSetting` en [modelo-datos.md](../modelo-datos.md).

**Criterios de aceptación**

- Dada la tabla `AppSetting` (`key`, `value`), Cuando cambio un prompt o parámetro,
  Entonces la siguiente generación usa el nuevo valor sin redeploy.
- Dada una clave ausente en `AppSetting`, Cuando se lee, Entonces se aplica el valor por
  defecto definido en código.
- Dado un secreto (API key), Cuando se configura, Entonces va en variables de entorno,
  **nunca** en `AppSetting`.
- Dada una plantilla de prompt, Cuando se define, Entonces fuerza contenido apto y
  seguro para niños (guardarraíl).

## US-14 — Proveedor cloud opcional · Could (reactivada)

> **Historia.** _Retirada del alcance el 2026-06-12 y **reactivada**_ a petición del
> usuario: se reintroduce el modo `cloud` como opt-in, conmutable en caliente desde BD.
> **Actualización (2026-06-23):** por decisión del proyecto el modo `cloud` pasa a estar
> **ACTIVO por defecto** (target `groq`), cargado al arrancar por una migración; **sin la
> API key del target cae al modo base** (`mock`/`local`). Es una **desviación de privacidad
> asumida** (contexto TFM). Ver [ADR 0002](../ADR/0002-tres-modos-de-ia.md),
> [cumplimiento-menores.md](../cumplimiento-menores.md) (C-5) y el plan
> [14-proveedor-cloud](../planes/14-proveedor-cloud.md).

Como **administrador** (zona de padres) quiero **activar y cambiar en caliente** un
proveedor de IA en la nube (compatible con OpenAI) para mejorar la calidad de los cuentos
y actividades, sin tocar código ni exponer secretos en la base de datos, y manteniendo
`mock`/`local` como modo por defecto.

**Criterios de aceptación**

- Dada la clave `ai.cloud` de `AppSetting` con JSON `{"activo": true, "target": "groq",
"model": "..."}` y la API key del `target` en variables de entorno, Cuando se genera un
  cuento o una actividad, Entonces se usa el proveedor cloud resuelto por el preset del
  `target` (su `baseUrl`) y la key leída de env.
- Dado `activo=false`, o la clave ausente, o un JSON inválido, Cuando se construye el
  proveedor, Entonces se usa el modo por defecto (`mock`/`local`) — cloud es **opt-in**.
- Dado que el proveedor cloud falla (caído, timeout o JSON inválido), Cuando se genera,
  Entonces se cae a `MockProvider` (mismo `FallbackProvider` que `local`).
- Dado un secreto (API key del proveedor), Cuando se configura, Entonces va en variables
  de entorno (`<TARGET>_API_KEY`), **nunca** en `AppSetting`/BD (coherente con US-18).
- Dado un cambio del proveedor activo (acción sensible del adulto), Cuando ocurre,
  Entonces se registra un `AuditLog`.
- (Cumplimiento) Dado el modo cloud, Entonces se documenta que salen **datos minimizados**
  del perfil (edad, intereses, idioma; nunca nombre ni identificadores) a un tercero, que
  desde 2026-06-23 está **ON por defecto** (desviación asumida; **sin key cae a mock/local**) y
  que los free tiers pueden entrenar con los datos
  ([cumplimiento-menores.md](../cumplimiento-menores.md)).

## US-15 — Modo nocturno · Could

Como **padre/tutor** quiero un modo nocturno para descansar la vista.

**Criterios de aceptación**

- Dado el ajuste de modo nocturno, Cuando lo activo, Entonces la app aplica el tema
  oscuro y persiste la preferencia.

## US-23 — Avisos y confirmaciones dentro de la app · Should (Mejoras)

Como **usuario de la app** quiero que los avisos y confirmaciones se muestren con el
estilo de la propia app (no las alertas grises del sistema) para una experiencia coherente
y más amable para una app infantil.

**Contexto.** Hoy errores y confirmaciones usan `Alert.alert` nativo (look del SO, fuera del
design system). Se sustituye por un **modal propio reutilizable** (`<Modal>` de React Native
con los tokens de tema), expuesto vía un `DialogProvider` con un hook `useDialog()` (`alert()`
para avisos y `confirm()` para confirmaciones con acción). **Solo app**, no toca el backend.

**Criterios de aceptación**

- Dado un aviso (p. ej. fallo de red o de validación), Cuando la app lo muestra, Entonces
  aparece en un **modal con el estilo de la app** (tipografía Quicksand, paleta, bordes
  redondeados), no en la alerta nativa del sistema.
- Dada una acción que requiere confirmación (p. ej. cerrar sesión), Cuando se dispara,
  Entonces el modal ofrece **confirmar o cancelar** y solo ejecuta la acción al confirmar.
- Dado el modal abierto, Cuando se confirma o se cancela, Entonces se cierra y la app no
  queda bloqueada; el botón de confirmación destructiva (p. ej. "Cerrar sesión") se distingue
  visualmente.
- Dado el conjunto de pantallas (Consent, Login, Seleccionar perfil, Zona de adultos,
  Crear perfil, Actividades, Generador de cuentos, Historial), Cuando muestran avisos,
  Entonces **ninguna** usa ya `Alert.alert` del sistema.

## US-24 — Navegación con cabecera y "atrás" · Should (Mejoras)

Como **usuario de la app** quiero una cabecera con botón "atrás" en las pantallas del flujo
para poder volver al paso anterior sin quedarme sin salida.

**Contexto.** El stack se montó con `headerShown: false`, así que pantallas como **Login** o
**Crear perfil** no tienen forma de volver (hueco detectado en la Fase 5.5). Se habilita una
**cabecera de navegación** con botón "atrás" en las pantallas del stack (onboarding y zona de
adultos), **conservando las pestañas sin cabecera** (la zona infantil no cambia). **Solo app.**

**Criterios de aceptación**

- Dada una pantalla del stack que no es la inicial (p. ej. Login, Crear perfil), Cuando la
  abro, Entonces hay un **botón "atrás"** que vuelve a la pantalla anterior.
- Dada la pantalla inicial del onboarding (Bienvenida), Cuando se muestra, Entonces **no**
  ofrece "atrás" (no hay paso previo).
- Dadas las **pestañas** (Inicio · Actividades · Cuentos · Historial), Cuando se navega entre
  ellas, Entonces **no** aparece la cabecera del stack (la zona infantil mantiene su diseño).
- Dada la cabecera, Cuando se muestra, Entonces respeta los tokens de tema (color, tipografía
  Quicksand) y un título legible por pantalla.

## US-25 — Ver el proveedor de IA que generó el contenido (Autor) · Should (Mejoras)

Como **padre/tutor** quiero ver con qué proveedor de IA se generó cada cuento y actividad
(simulado, local o en la nube) para entender de un vistazo el origen del contenido, sobre todo
cuando el sistema cae al modo simulado (fallback).

**Contexto.** El `AIProvider` activo puede ser `mock`, `local` (Ollama) o `cloud`, y ante un fallo
el `FallbackProvider` cae a `mock`. Hoy no se registra **cuál** sirvió realmente. Se propaga el
proveedor **efectivo** desde la capa de IA, se **persiste** en `Story` y `Activity` (campo
`proveedor`) y se muestra como "Autor" en la app (generador, actividades e Historial). Relacionada
con [US-04](epic-b-cuentos.md#us-04) (fallback) y [US-05](epic-b-cuentos.md#us-05) (modo por env).
**Backend + app.**

**Criterios de aceptación**

- Dado un cuento o actividad generado, Cuando se persiste, Entonces guarda el **proveedor efectivo**
  que lo produjo (`mock` | `local` | `cloud`), no el modo configurado.
- Dado que el proveedor activo falla y se cae al fallback, Cuando se genera, Entonces el proveedor
  persistido es **`mock`** (refleja lo que de verdad generó, no el que se intentó).
- Dado el contrato HTTP, Cuando se devuelve un cuento o actividad (`POST /stories`,
  `POST /activities/recommend`, `GET /profiles/:id/history`), Entonces el cuerpo incluye `proveedor`.
- Dado un cuento o actividad en la app (generador, lista de actividades, Historial), Cuando se
  muestra, Entonces aparece **"Autor:"** con un icono por proveedor (mock | local | cloud).
- (Dominio) Dado un `proveedor` fuera del vocabulario, Cuando se construye la entidad, Entonces se
  rechaza (vocabulario cerrado, como el resto).

## US-29 — Iconografía consistente con lucide-react-native · Should (Mejoras)

Como **usuario de la app** quiero que los iconos funcionales (navegación, controles, valoración,
acciones) se vean **consistentes y nítidos en cualquier dispositivo** para una experiencia más
cuidada y coherente con el design system.

**Contexto.** Hoy la app usa **emojis Unicode** como única iconografía (`<Text>{emoji}</Text>`), que
cada sistema operativo dibuja a su manera y sin control de tamaño, color ni grosor de trazo. Se
introduce [`lucide-react-native`](https://lucide.dev/) (iconos SVG vectoriales, empaquetados en el
bundle en build-time: **sin red en runtime ni SDK de tercero activo**, compatible con
[cumplimiento-menores.md](../cumplimiento-menores.md)) para los iconos **funcionales**, mediante un
**wrapper `Icon` central** que mapea nombres semánticos a iconos Lucide y consume los tokens de tema.
Se mantienen como **emoji** los **avatares de animales** (y el avatar por defecto `✨`) por la
calidez que aportan a una app infantil (2-6 años). **Solo app.**

**Criterios de aceptación**

- Dada la iconografía funcional (pestañas Inicio/Actividades/Cuentos/Historial, controles de
  narración play/pausa/stop, estrellas de valoración, flecha del Historial, acceso a la zona de
  adultos), Cuando se muestra, Entonces usa iconos de `lucide-react-native` (SVG vectorial), no
  emojis.
- Dadas las categorías de actividad (arte, música, lógica) y los badges de proveedor de IA (mock,
  local, cloud), Cuando se muestran, Entonces usan iconos de Lucide.
- Dado un icono, Cuando se renderiza, Entonces toma tamaño y color de los **tokens de tema**
  (`theme/tokens.ts`) y expone una etiqueta de accesibilidad.
- Dado el wrapper `Icon`, Cuando una pantalla necesita un icono, Entonces lo pide por **nombre
  semántico** (`<Icon name="play" />`) y queda desacoplada de la librería concreta.
- Dados los **avatares de animales** y el avatar por defecto, Cuando se muestran, Entonces siguen
  siendo **emoji** (decisión de calidez, fuera de alcance de la migración).
- (No-funcional) Dada la regla de menores, Entonces la librería no añade llamadas de red en runtime
  ni SDKs de terceros activos (iconos empaquetados en build-time).

## US-30 — Pruebas user-centric de componentes de la app · Should (Mejoras)

Como **desarrollador del proyecto** quiero que los componentes de UI de la app tengan **pruebas
automáticas que los ejerciten como lo haría una persona usuaria** (buscando por rol accesible,
etiqueta o texto, y simulando pulsaciones) para verificar comportamiento y accesibilidad, y que esas
pruebas formen parte del gate del DoD (`pnpm test`).

**Contexto.** Hasta ahora `packages/app` solo tenía un test de lógica pura (el adaptador HTTP) bajo
Vitest en modo node, **sin entorno de render** ni librería de testing de UI. Los componentes ya
exponen props de accesibilidad (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`),
pero nada las verificaba. Se introduce **React Native Testing Library** sobre **Vitest** siguiendo
la _Query Priority_ de Testing Library (rol → etiqueta → texto → `testID` como último recurso), de
modo que los tests documenten el contrato accesible y de interacción de cada componente. **Solo
app.** Sin red ni SDKs de terceros en runtime (la dependencia es solo de desarrollo).

**Criterios de aceptación**

- Dado el botón `BubblyButton`, Cuando se renderiza con un `label`, Entonces es localizable por su
  **rol `button`** y su nombre accesible, y al pulsarlo invoca `onPress`.
- Dado un `BubblyButton` en estado `disabled` o `loading`, Cuando se intenta pulsar, Entonces **no**
  invoca `onPress` y su estado accesible refleja `disabled`/`busy`.
- Dada la puerta parental `ParentalGate`, Cuando se muestra el reto y se elige la **respuesta
  correcta**, Entonces se renderiza el contenido protegido (`children`); Cuando se elige una
  **incorrecta**, Entonces no se revela el contenido y se regenera el reto.
- Dado el campo `TextField`, Cuando se renderiza, Entonces muestra su **etiqueta** visible y el campo
  es localizable por su **rol** (`textbox`); Cuando se escribe en él, Entonces invoca `onChangeText`
  con el texto y refleja el `value` actual (y el `placeholder` si se proporciona).
- Dado el chip `SelectableChip`, Cuando se pulsa, Entonces invoca `onPress`, y tanto seleccionado
  como no seleccionado sigue siendo localizable por su **rol** (`button`) y su **texto**. _(El estado
  seleccionado se transmite con `accessibilityState={{ selected }}`, que el lector de pantalla anuncia
  en iOS/Android; el adaptador web usado en los tests no lo proyecta a `aria-selected`.)_
- Dada la valoración `StarRating`, Cuando se pasa `onChange`, Entonces cada estrella es un **botón**
  con nombre accesible (`"N estrella(s)"`) y al pulsarla notifica el valor; en modo solo-lectura no
  ofrece nada pulsable.
- Dado el selector `AvatarPicker`, Cuando se muestra, Entonces cada avatar es un **botón** localizable
  por su `id` (nombre accesible) y elegirlo notifica ese `id`.
- Dado el badge `AuthorBadge`, Cuando se muestra, Entonces presenta el **proveedor** que generó el
  contenido (etiqueta legible) y expone un nombre accesible (`"Autor: …"`).
- Dada la tarjeta `ActivityCard`, Cuando se muestra, Entonces presenta título, descripción, categoría,
  duración/nivel y autor; con `onComplete`, al pulsar **"Realizado"** pide la valoración y, al elegir
  estrellas, la notifica; si ya está valorada muestra **"¡Hecha!"** y no ofrece marcarla.
- Dados los controles `NarrationControls`, Cuando el estado es reposo, Entonces ofrece **"Escuchar"**;
  cuando suena, ofrece **"Pausar"** y **"Parar"**, y cada botón dispara su acción (la lógica de audio
  se sustituye por un doble en el test).
- Dados los diálogos `DialogProvider`, Cuando un consumidor llama a `alert`/`confirm`, Entonces se
  muestra el mensaje y los botones (`"Entendido"` / `"Aceptar"`+`"Cancelar"`); aceptar ejecuta
  `onConfirm` y cierra, cancelar no lo ejecuta; usar `useDialog` fuera del provider lanza error.
- Dado el lienzo `Screen`, Cuando se renderiza con `children` y `footer`, Entonces muestra ambos.
- _Excepción:_ el wrapper `Icon` **no se prueba unitariamente** con este arnés porque
  `lucide-react-native` no es importable bajo Vitest (módulo ESM incompatible); se ejercita de forma
  indirecta (sustituido por un doble) en el resto de tests. Su contrato lo cubre [US-29](#us-29).
- (No-funcional) Dadas las pruebas, Cuando se ejecuta `pnpm test`, Entonces corren dentro del gate y
  usan queries por rol/etiqueta/texto (no por estructura ni estilos), reservando `testID` como
  último recurso.

## US-31 — Análisis estático de calidad con SonarJS · Should (Mejoras)

Como **desarrollador del proyecto** quiero que el linter detecte automáticamente _bugs_ y _code
smells_ (complejidad cognitiva, código duplicado, expresiones idénticas, ramas colapsables…) además
de los errores de estilo que ya cubre ESLint, para sostener la calidad del backend a medida que crece
y que ese análisis forme parte del gate del DoD (`pnpm lint` → `pnpm check`).

**Contexto.** Hoy ESLint usa solo `@eslint/js` + `typescript-eslint` (recomendadas) más las reglas de
frontera de capas (`no-restricted-imports`). No hay análisis de calidad/complejidad. Se introduce
[`eslint-plugin-sonarjs`](https://github.com/SonarSource/SonarJS) (las reglas JS/TS de SonarQube como
plugin de ESLint), integrado en la **flat config** de ESLint 9 ya existente mediante su configuración
`recommended`. Es una dependencia **solo de desarrollo**: no añade código de runtime, ni red, ni SDKs
de terceros (compatible con [cumplimiento-menores.md](../cumplimiento-menores.md)). Alcance: el código
del backend (`packages/backend/src` y `test`); `packages/app` sigue fuera del lint raíz (igual que hoy).

**Criterios de aceptación**

- Dado el plugin `eslint-plugin-sonarjs`, Cuando se configura ESLint, Entonces se habilita su
  configuración `recommended` en la flat config y sus reglas (prefijo `sonarjs/`) se ejecutan junto a
  las existentes en `pnpm lint`.
- Dada la frontera de capas (invariante del proyecto), Cuando se añade SonarJS, Entonces las reglas
  `no-restricted-imports` de `/domain` y de aplicación **siguen activas** y SonarJS no las relaja.
- Dado un _code smell_ que SonarJS detecta (p. ej. complejidad cognitiva alta o expresiones
  idénticas), Cuando se ejecuta el lint, Entonces se reporta como `error` y rompe el gate hasta
  resolverlo o justificar su excepción.
- Dado el estado actual del backend, Cuando se ejecuta `pnpm lint` con SonarJS activo, Entonces el
  gate queda **verde**: las incidencias detectadas se corrigen, y cualquier supresión puntual se hace
  con `// eslint-disable-next-line sonarjs/<regla>` acompañada de un motivo escrito (no se desactivan
  reglas globalmente sin justificar).
- (No-funcional) Dada la dependencia, Cuando se instala, Entonces es `devDependency` y no introduce
  llamadas de red ni SDKs de terceros en runtime.

## US-32 — Pruebas de integración con BD real, E2E y pipeline de CI · Should (Fase 6)

Como **desarrollador/evaluador del proyecto** quiero que existan **pruebas de integración contra una
base de datos real**, pruebas **end-to-end** del backend y de la app, y un **pipeline de integración
continua** que ejecute el gate en cada cambio, para tener confianza de que el sistema funciona de
punta a punta —no solo con dobles en memoria— y que la calidad se sostiene de forma automática.

**Contexto.** Hasta ahora la suite cubre dominio/aplicación con dobles in-memory y las rutas con
`app.inject()` + `makeInMemoryDeps()` (sin tocar PostgreSQL). Los repos `Prisma*` y el flujo real por
HTTP solo se habían verificado **a mano** (ver [phases.md](../phases.md), "e2e contra PostgreSQL").
Esta historia formaliza esa verificación en **tres niveles** nuevos, complementarios a los unitarios:

1. **Integración de persistencia** — los `Prisma*Repository` contra un **PostgreSQL real efímero**
   (Testcontainers), aplicando migraciones y aislando cada test. Cierra el hueco: hoy nada ejercita
   el mapeo ORM↔entidad ni las cascadas/constraints reales.
2. **E2E de backend** — el **stack real** (`docker compose`, `AI_PROVIDER=mock`) ejercitado por HTTP
   recorriendo el flujo del MVP: alta de adulto → login → crear/seleccionar perfil → generar cuento →
   recomendar actividades → narración → historial.
3. **E2E de app** — la **app Expo en web** recorrida con **Playwright** (navegador real) en el flujo
   de pantallas (onboarding → perfil → cuento), contra un backend en modo `mock`.

Más un **pipeline de CI** (GitHub Actions) que ejecuta el gate (`pnpm check`) + integración + E2E en
cada push/PR, y la **documentación de la estrategia de pruebas** (la pirámide del proyecto y la guía
de **TDD**: dónde aplica test-first y dónde no). Todo respeta [cumplimiento-menores.md](../cumplimiento-menores.md):
modo `mock` por defecto (sin red ni IA externa), dependencias solo de desarrollo, sin SDKs de terceros
en runtime.

**Criterios de aceptación**

- Dada la capa de persistencia, Cuando se ejecutan las pruebas de integración, Entonces cada
  `Prisma*Repository` (`Guardian`, `ChildProfile`, `Story`, `Activity`, `StoryNarration`,
  `InteractionEvent`, `AuditLog`) se ejercita contra un **PostgreSQL real** efímero (Testcontainers),
  con migraciones aplicadas y estado aislado entre tests (truncado/transacción), verificando el mapeo
  ORM↔entidad y al menos una cascada/constraint real.
- Dado el stack levantado en modo `mock` (`docker compose up`), Cuando la prueba E2E de backend
  recorre el flujo por HTTP (alta → login → perfil → cuento → actividades → narración → historial),
  Entonces cada paso responde con el estado esperado y el dato persiste entre llamadas (p. ej. el
  cuento aparece luego en el historial; el `AuditLog` registra el consentimiento y el login).
- Dada la app Expo servida en **web** con un backend en `mock`, Cuando Playwright recorre el flujo de
  onboarding (crear perfil → generar cuento → verlo), Entonces las pantallas navegan y muestran el
  contenido esperado, localizando elementos por **rol/etiqueta accesible** (no por estructura).
- Dado un push o pull request, Cuando se ejecuta el pipeline de CI, Entonces corre el gate completo
  (`pnpm check` = typecheck + lint + format:check + test) más la integración y el E2E, y **falla** si
  cualquier nivel falla (hace cumplir el DoD automáticamente).
- Dada la estrategia de pruebas, Cuando se consulta la documentación, Entonces existe un documento que
  describe los **niveles** de prueba del proyecto (unitario / integración / E2E), **cómo ejecutar cada
  uno** en local y en CI, y la **guía de TDD** (qué se hace test-first y qué no, con su justificación
  YAGNI).
- (No-funcional) Dadas las nuevas dependencias y servicios de prueba, Cuando se ejecutan, Entonces son
  **solo de desarrollo/CI**, usan el modo `mock` por defecto (sin red ni IA externa ni SDKs de
  terceros en runtime) y no añaden pasos ocultos al arranque reproducible (US-06).

## US-33 — Actualizar las GitHub Actions a la siguiente major (Node 24) · Could (Mantenimiento)

Como **mantenedor del proyecto** quiero que las _actions_ del pipeline de CI usen versiones que no
dependan de Node.js 20 (en retirada en los runners) para evitar avisos de deprecación y que el CI
siga funcionando cuando GitHub deje de forzar Node 24 sobre las actions antiguas.

**Contexto.** El workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (introducido en
[US-32](#us-32)) usa `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` y
`pnpm/action-setup@v4`. GitHub marca esas `@v4` como deprecadas porque apuntan a **Node.js 20**, que
se está retirando de los runners (hoy se fuerzan a Node 24, pero es temporal). Es **deuda de
mantenimiento**, no un fallo: el CI pasa en verde. Cuando estén disponibles las `@v5` (o equivalentes
sobre Node 24) conviene actualizarlas.

**Criterios de aceptación**

- Dado el workflow de CI, Cuando se revisan las _actions_, Entonces `actions/checkout`,
  `actions/setup-node`, `actions/upload-artifact` y `pnpm/action-setup` apuntan a una versión que se
  ejecuta de forma nativa en Node 24 (p. ej. `@v5`), sin anotaciones de deprecación de Node 20.
- Dado el pipeline actualizado, Cuando se hace push o pull request, Entonces los tres jobs (gate,
  integración + E2E backend, E2E app) siguen pasando en verde.
- (No-funcional) Dado que es mantenimiento, Entonces el cambio no altera el comportamiento del CI ni
  del código de la app/backend (solo versiones de _actions_).

## US-34 — Observabilidad: log de los prompts de IA y su configuración · Should (Mejoras)

Como **desarrollador/evaluador del proyecto** quiero ver en los logs del backend **los prompts que
se envían al LLM** (cuentos y actividades), **su configuración resuelta** y **la respuesta del
modelo**, para depurar la calidad de la generación y entender qué plantilla/parámetros se están
usando en cada petición.

**Contexto.** Los prompts se construyen en `buildStoryPrompt`/`buildActivitiesPrompt`
([prompts.ts](../../packages/backend/src/infrastructure/ai/prompts.ts)) y los envían `OllamaProvider`
y `CloudProvider`; el `MockProvider` **no** construye prompts (contenido fijo), así que queda fuera.
Hoy el `AILogger` solo expone `warn` y solo lo recibe el `FallbackProvider`. Se extiende `AILogger`
con `info` y se inyecta el logger en ambos providers reales para registrar, **a nivel `info`** (vía
pino, ya cableado), el prompt (system + user), la config (plantilla AppSetting vs. defecto, `params`
de longitud/rima/formato, temperatura, modelo, cantidad de actividades) y la respuesta cruda.

> **Desviación de cumplimiento asumida (TFM).** El prompt incluye el **nombre del niño** (PII), por lo
> que loguearlo a `info` deja PII en los logs por defecto. Es una decisión consciente para depuración
> (contexto TFM); se documenta en [cumplimiento-menores.md](../cumplimiento-menores.md) (C-5). En un
> despliegue real se bajaría a `debug` o se redactaría el nombre.

**Criterios de aceptación**

- Dado `AI_PROVIDER=local` (Ollama) o el modo cloud activo, Cuando se genera un cuento, Entonces el
  backend registra a `info` un log con el **system prompt**, el **user prompt**, la **config**
  resuelta (plantilla por defecto o de `AppSetting`, `params`, temperatura, modelo) y la **respuesta**
  del LLM.
- Dado el mismo modo, Cuando se recomiendan actividades, Entonces se registra un log equivalente
  (incluyendo la **cantidad** solicitada y, si aplica, la categoría) con prompt, config y respuesta.
- Dado `AI_PROVIDER=mock` (sin prompts), Cuando se genera, Entonces **no** se emite log de prompt (no
  hay prompt que registrar).
- Dado el `AILogger`, Cuando se extiende con `info`, Entonces sigue siendo opcional para los
  consumidores existentes (el `FallbackProvider` y sus tests con `{ warn }` no se rompen).
- (No-funcional) Dado el cambio, Entonces es **solo backend**, no añade dependencias ni red, y la
  generación sigue funcionando igual (el log es un efecto lateral, no altera el resultado).

## US-37 — E2E web multinavegador (Playwright) · Could (Mejoras)

Como **desarrollador/evaluador del proyecto** quiero que la prueba **E2E web** de la app (Playwright
sobre el **export web de Expo**) se ejecute en **varios navegadores** y produzca un **reporting rico**
(informe HTML, JSON y trazas/vídeo/capturas ante fallo), para tener confianza de que el flujo funciona
en los motores que importan (Chromium y WebKit/iOS) y poder diagnosticar un fallo sin reproducirlo a
mano.

**Contexto.** [US-32](#us-32) introdujo el E2E de la app con Playwright sobre el export web de Expo
(`expo export --platform web`) servido por un proxy de mismo origen contra el backend real en `mock`,
pero **solo en `chromium`** (Desktop Chrome) y con un reporter `list`. Esta historia **amplía** ese
E2E: añade proyectos de Playwright para cubrir el **motor WebKit** (el de iOS/Safari) y un **viewport
móvil** (la app es _portrait_), y configura el reporting de depuración. **Valida el EXPORT WEB de la
app, no la app nativa** (iOS/Android): es la web servida la que se recorre con navegadores reales; no
hay simuladores ni dispositivos nativos. **Solo afecta a la suite E2E de `packages/app`** (config y
scripts de prueba); no toca runtime de la app ni el backend. Las dependencias siguen siendo solo de
desarrollo. _(Nota: en el repo `mobile-chrome` usa el mismo motor Chromium que el baseline; aporta el
viewport móvil, no un motor distinto. El motor adicional real lo aporta `mobile-safari` = WebKit.)_

**Criterios de aceptación**

- Dada la configuración de Playwright, Cuando se define la lista de `projects`, Entonces existen al
  menos tres: `chromium` (`devices['Desktop Chrome']`, baseline existente de US-32), `mobile-chrome`
  (`devices['Pixel 5']`, viewport móvil _portrait_) y `mobile-safari` (`devices['iPhone 13']`, motor
  **WebKit** = el de iOS).
- Dado el E2E ya existente (US-32), Cuando se añaden los nuevos proyectos, Entonces se **conservan sin
  cambios** `webServer` (backend mock + servidor estático del export web), `baseURL`
  (`http://127.0.0.1:4173`), `testDir` (`./e2e`) y `workers: 1` (no se rompe el E2E actual).
- Dado el reporting, Cuando termina la ejecución, Entonces se generan un informe **HTML**
  (`outputFolder: 'playwright-report'`, `open: 'never'`), un fichero **JSON**
  (`test-results/results.json`) y la salida **`line`** en consola.
- Dado un test que falla, Cuando se ejecuta, Entonces se conservan **captura** (`screenshot:
'only-on-failure'`), **vídeo** (`video: 'retain-on-failure'`) y **traza** (`trace:
'retain-on-failure'`) para diagnosticarlo. _(Se usa `retain-on-failure` y `retries: 1` **solo en
  CI**, porque con `workers: 1` y `retries: 0` la opción `on-first-retry` no captura nada.)_
- Dado el script de instalación de navegadores, Cuando se ejecuta `pnpm --filter @magyblob/app
e2e:install`, Entonces instala los binarios de **chromium y webkit** (`playwright install chromium
webkit`), no solo Chromium.
- Dados los artefactos de prueba generados, Cuando se ejecuta el E2E, Entonces el `.gitignore` **ignora**
  `packages/app/playwright-report/` y `packages/app/test-results/` (no se versionan).
- Dado el coste (con `workers: 1` son ~**3x** navegadores en serie), Cuando se decide la estrategia de
  CI, Entonces se documenta dejar **solo `chromium` en el gate de PR** y `mobile-safari`/`mobile-chrome`
  en un job **nightly** (filtrando por `--project`), para no triplicar el tiempo de cada PR.
- (No-funcional) Dada la regla de menores, Entonces el cambio respeta
  [cumplimiento-menores.md](../cumplimiento-menores.md): modo `mock` por defecto (sin red ni IA
  externa), dependencias **solo de desarrollo**, sin SDKs de terceros en runtime; y **no** añade pasos
  ocultos al arranque reproducible ([US-06](#us-06)) — el E2E sigue siendo una suite aparte.

## US-36 — Git hooks de calidad con Husky + lint-staged · Should (Mejoras)

Como **desarrollador del proyecto** quiero que el gate de calidad se ejecute **automáticamente** en
los Git hooks (no solo por disciplina manual) para que sea imposible commitear código mal formateado
o pushear con el gate (`pnpm check`) en rojo, manteniendo el commit rápido y el push completo.

**Contexto.** Hoy la regla "verifica el gate antes de pedir commit o cerrar la rama" es **manual**:
nada impide un commit con lint/formato roto ni un push con el gate en rojo. Se introduce
[Husky](https://typicode.github.io/husky/) v9 + [lint-staged](https://github.com/lint-staged/lint-staged)
con una arquitectura de gates **rápido en commit / completo en push**: `pre-commit` corre `lint-staged`
sobre los archivos _staged_ (autofix de ESLint en el backend + Prettier), y `pre-push` corre el gate
canónico `pnpm check` (typecheck + lint + format:check + test). La **integración** (`test:integration`)
y los **E2E** (`test:e2e`) **no** entran en los hooks: requieren Docker y se quedan en CI (coherente
con [US-32](#us-32) y [estrategia-pruebas.md](../estrategia-pruebas.md)). Ambas dependencias son
**solo de desarrollo**: sin runtime, red ni SDKs de terceros (compatible con
[cumplimiento-menores.md](../cumplimiento-menores.md), igual que SonarJS/coverage). Ver el plan
[39-husky-git-hooks](../planes/39-husky-git-hooks.md).

**Criterios de aceptación**

- Dado un commit con cambios _staged_, Cuando se ejecuta `git commit`, Entonces el hook `pre-commit`
  corre `lint-staged` y aplica ESLint (autofix, acotado al backend) y Prettier **solo** a los archivos
  _staged_, terminando en segundos.
- Dado un archivo _staged_ que ESLint no puede arreglar (p. ej. import que viola la frontera de capas),
  Cuando se intenta commitear, Entonces el hook **falla** (`exit ≠ 0`) y el commit se aborta.
- Dado un `git push`, Cuando se ejecuta, Entonces el hook `pre-push` corre `pnpm check` (typecheck +
  lint + format:check + test) y, si cualquier paso falla, **aborta el push**.
- Dado que integración y E2E requieren Docker, Cuando se hace commit o push, Entonces **no** se
  ejecutan en los hooks (siguen ejecutándose en CI).
- Dada una situación excepcional, Cuando se necesita saltar los hooks, Entonces `git commit/push
--no-verify` lo permite (uso puntual, no por defecto).
- Dado un `pnpm install` en una clonación nueva, Cuando termina, Entonces el script `prepare` deja los
  hooks activos sin pasos manuales (se comparten vía el repo).
- (No-funcional) Dadas las dependencias `husky` y `lint-staged`, Cuando se instalan, Entonces son
  `devDependencies`, no añaden red ni SDKs de terceros en runtime, y Husky v9 no emite avisos de
  deprecación (hooks sin shebang ni `chmod`).

## US-35 — Cobertura estratégica por riesgo de negocio (100/80/0) · Should (Mejoras)

Como **desarrollador/evaluador del proyecto** quiero que la cobertura de tests se gobierne por el
**riesgo de negocio de cada módulo** (no por un porcentaje global), de modo que el código **crítico**
—el que rompe el negocio o el cumplimiento de menores si falla— esté **100% cubierto** y el gate lo
haga cumplir, mientras que el código que TypeScript ya valida no infle una métrica engañosa.

**Contexto.** El gate (`pnpm check`) verifica que los tests pasan, pero **no mide qué cubren**: no hay
configuración de coverage ni umbrales en ningún paquete. El riesgo no es el % global —«94% de
cobertura es inútil si el 6% crítico falla»—, sino que código CORE quede sin red. La auditoría detectó
un hueco CORE concreto: [`parseResponse.ts`](../../packages/backend/src/infrastructure/ai/parseResponse.ts)
(saneo de la salida del LLM **antes de mostrarla a un niño**: descarta `nivel`/`duracionMin` fuera de
rango, categorías inventadas y títulos/cuerpos vacíos) **no tenía test propio**. Se adopta el sistema
**Strategic Coverage 100/80/0**, que clasifica el código en tres niveles y fija umbrales por _glob_ en
Vitest (provider `v8`), haciéndolos cumplir en CI. Sin red ni SDKs de terceros (dependencias solo de
desarrollo); ver [estrategia-pruebas.md](../estrategia-pruebas.md) y [cumplimiento-menores.md](../cumplimiento-menores.md).

- **CORE (100%)** — si falla → pérdida de usuario o incumplimiento: saneo de salida del LLM,
  `FallbackProvider`/`createAIProvider`/`MockProvider`, casos de uso, value-objects e invariantes de
  entidades del dominio; en la app, el adaptador HTTP, `sanitizeForSpeech` y el store de sesión/consentimiento.
- **IMPORTANT (80%)** — si falla → usuario frustrado: componentes de UI, narración con degradación a
  voz nativa, pantallas con validación, prompts, providers reales y contrato de rutas.
- **INFRASTRUCTURE (0%)** — TypeScript valida: DTOs, interfaces de repositorio/gateway, vocabularios,
  _labels_, tokens de tema, navegación, _bootstrap_; se **excluyen** de la medición (junto con lo
  cubierto por otras suites: repos Prisma → integración, ElevenLabs → E2E/manual) para no ensuciar la señal.

**Criterios de aceptación**

- Dado el saneo de la salida del LLM (`parseResponse`), Cuando se ejecutan sus pruebas, Entonces se
  verifica que descarta `nivel`/`duracionMin` fuera de rango, categorías inexistentes y títulos/cuerpos
  vacíos, recorta a la cantidad pedida, estampa el `proveedor` y lanza error si no queda contenido válido.
- Dado el nivel **CORE**, Cuando se ejecuta `pnpm coverage`, Entonces los _globs_ CORE
  (`parseResponse`, casos de uso, value-objects, entidades de dominio; y en la app `http`,
  `sanitizeForSpeech`, `useAppStore`) reportan **100%** y el resto del código medido cumple el **80%**.
- Dado un descenso por debajo del umbral de un nivel, Cuando corre el coverage (local o en CI),
  Entonces **falla** el comando (no pasa con _warning_), haciendo cumplir el DoD automáticamente.
- Dado el nivel **INFRASTRUCTURE** y el código cubierto por otras suites (repos Prisma, ElevenLabs),
  Cuando se mide el coverage del run unitario, Entonces están **excluidos** de la medición y no
  cuentan como hueco.
- Dado el gate diario, Cuando se ejecuta `pnpm check`, Entonces sigue siendo **rápido** (sin coverage,
  sin Docker); el umbral por nivel lo hace cumplir el job de CI (`pnpm coverage`) y se documenta el
  comando local.
- (No-funcional) Dadas las dependencias añadidas (`@vitest/coverage-v8`), Cuando se instalan, Entonces
  son **solo de desarrollo** y no introducen red ni SDKs de terceros en runtime.

## US-38 — E2E nativo de la app en simuladores (iOS/Android) con Maestro · Could (Mejoras)

Como **desarrollador/evaluador del proyecto** quiero pruebas end-to-end de la app **nativa**
ejecutadas sobre el **iOS Simulator** y el **Android Emulator**, para validar el flujo real del MVP
en las plataformas objetivo —incluyendo lo que solo existe en nativo (audio `expo-audio`, lectura
en voz alta `expo-speech`, navegación nativa)— y no solo sobre el export web.

**Contexto.** El E2E actual ([US-32](#us-32)) recorre la app con **Playwright** sobre el export web
de Expo (`react-native-web`); eso valida la lógica de pantallas pero **no** es la app nativa.
Playwright no maneja el iOS Simulator (la emulación de viewport ni siquiera está disponible sobre el
protocolo de inspección de iOS) y su soporte Android es experimental/web-WebView. Esta historia
añade un **nivel complementario, no sustituto**. Decisión de herramienta: **Maestro** frente a
Detox por **YAGNI** (setup mínimo, _flows_ en YAML, integra con Expo dev/development build); Detox se
descarta por mayor coste de configuración. Se justifica en un **ADR**.

**Criterios de aceptación**

- Dada la app construida para desarrollo (Expo) y el backend en modo `mock`, Cuando se ejecuta el
  _flow_ de Maestro sobre el **iOS Simulator**, Entonces recorre onboarding → crear perfil → generar
  cuento → narrarlo, localizando elementos por **identificador/etiqueta accesible** (no por
  estructura).
- Dado el mismo _flow_ sobre el **Android Emulator**, Entonces completa el recorrido con el mismo
  resultado (**paridad de plataformas**).
- Dada una capacidad **solo nativa** (`expo-speech`/`expo-audio`), Cuando el _flow_ la ejercita,
  Entonces se verifica un **efecto observable** que el E2E web no puede cubrir, dejando explícita la
  cobertura aportada.
- Dada la herramienta, Cuando se consulta la documentación, Entonces
  [estrategia-pruebas.md](../estrategia-pruebas.md) describe **cuándo aplica E2E nativo (Maestro) vs
  E2E web (Playwright)**, cómo ejecutarlo en local (simulador/emulador), y la decisión queda en un
  **ADR**.
- (CI, opcional) Dado el coste de levantar simuladores, Cuando se define el pipeline, Entonces el
  E2E nativo corre en un **job separado** (nightly/manual), **no** en el gate de cada PR, y su
  omisión en PR queda **documentada** para no dar falsa sensación de cobertura.
- (No-funcional) Dadas las nuevas dependencias, Cuando se ejecutan, Entonces son **solo de
  desarrollo/CI**, modo `mock` por defecto (sin red ni IA externa ni SDKs de terceros en runtime) y
  **no** alteran el arranque reproducible ([US-06](#us-06)).

## US-39 — E2E de actividades e historial (Playwright) · Could (Mejoras)

Como **desarrollador/evaluador del proyecto** quiero que el E2E web de la app (introducido en
[US-32](#us-32)) cubra también el recorrido de **actividades recomendadas** y del **historial de
cuentos**, para tener confianza de que esos dos flujos clave de la zona infantil funcionan de punta a
punta en un navegador real —no solo con tests de componente—.

**Contexto.** El E2E de la app con Playwright (US-32, [`onboarding.spec.ts`](../../packages/app/e2e/onboarding.spec.ts))
recorre el onboarding completo (bienvenida → puerta parental → alta del adulto → crear perfil →
generar cuento) sobre Expo web contra el backend real en modo `mock`. Pero las **actividades**
(US-09/US-10) y el **historial** (US-08) hoy solo tienen pruebas **unitarias/de componente** (US-30),
sin un recorrido end-to-end en navegador. Esta historia **extiende** la cobertura E2E web a esos dos
flujos, reutilizando el mismo patrón de onboarding para llegar al estado con perfil + cuento generado.
Valida el **export web** de la app (no la app nativa); el recorrido nativo queda fuera de alcance.
Localiza por **rol/etiqueta accesible** (coherente con US-30/US-32), corre en modo `mock` (contenido
determinista del [`MockProvider`](../../packages/backend/src/infrastructure/ai/MockProvider.ts)),
respeta [cumplimiento-menores.md](../cumplimiento-menores.md) (sin red ni IA externa ni SDKs de
terceros en runtime) y no añade pasos ocultos al arranque reproducible ([US-06](#us-06)). **Solo
pruebas de la app** (no toca backend ni código de runtime).

**Criterios de aceptación**

- Dada la app Expo servida en **web** con un backend en `mock`, Cuando el E2E recorre el onboarding y
  llega al estado con **perfil creado + cuento generado**, Entonces puede continuar hacia los flujos de
  actividades e historial (reutiliza el patrón de [US-32](#us-32)).
- Dado el estado con perfil, Cuando el E2E navega a la pestaña **Actividades** y genera actividades,
  Entonces aparecen **actividades recomendadas** (tarjetas con su título/categoría del mock), localizadas
  por rol/etiqueta accesible (US-09).
- Dada una actividad sin completar, Cuando el E2E pulsa **"Realizado"** y elige una valoración en
  estrellas, Entonces la tarjeta refleja el estado **"¡Hecha!"** (efecto observable de US-10).
- Dado el cuento generado en el onboarding, Cuando el E2E navega a la pestaña **Historial**, Entonces el
  cuento aparece en la sección **"Cuentos mágicos"** (p. ej. por su título determinista con el nombre del
  niño), localizado por rol/etiqueta accesible (US-08).
- Dado el recorrido E2E, Cuando se ejecuta, Entonces valida el **export web** de la app (Chromium), no la
  app nativa, y todos los localizadores van por **rol/etiqueta/texto accesible** (no por estructura ni
  estilos).
- (No-funcional) Dada la prueba, Cuando corre, Entonces usa el modo `mock` por defecto (sin red ni IA
  externa ni SDKs de terceros en runtime), es **solo de la app** (no toca backend) y no rompe el arranque
  reproducible ([US-06](#us-06)) ni el spec de onboarding existente.

## US-40 — Monitorización de errores y crashes con Sentry · Could (Mejoras)

Como **desarrollador/responsable del producto** quiero capturar en tiempo real los **errores no
controlados y crashes** de la app Expo (con _stack trace_ y contexto del dispositivo) para
diagnosticar fallos que no se reproducen en desarrollo, sin tener que pedir _logs_ manuales al
usuario.

**Contexto.** Se integra [`@sentry/react-native`](https://docs.sentry.io/platforms/react-native/)
(Sentry SaaS) en la app. **Solo app**, no toca el backend. La inicialización es **condicional al DSN
en variable de entorno**: sin DSN (modo por defecto, desarrollo y E2E en `mock`) Sentry **no se
inicializa** y no sale nada a terceros; con DSN (builds de producción/preview) captura errores y
crashes. El cliente se configura con `sendDefaultPii: false` y un `beforeSend` cuya política es
**proteger al niño y permitir al adulto**: redacta el **nombre del niño** del perfil activo (el dato
del menor nunca sale) y deja salir los datos del **adulto administrador** (su email). Se etiqueta
`release` (versión del app) y `debug` en desarrollo, y hay un **disparador de prueba dev-only** para
verificar la tubería.

> **Desviación de cumplimiento asumida (TFM).** `@sentry/react-native` es un **SDK de terceros** que
> transmite informes de error y metadatos del dispositivo a un tercero en la nube (sentry.io). **Rompe
> C-2** (cero SDKs de analítica/terceros) y **C-5** (los datos no salen del equipo), y es
> **incompatible con la categoría Kids de Apple** (prohíbe transmitir datos a terceros). Es una
> decisión consciente para el TFM, al estilo de C-5 (cloud) y C-11 (ElevenLabs); se documenta en
> [cumplimiento-menores.md](../cumplimiento-menores.md) (**C-12**) con sus mitigaciones. El camino
> conforme para producción real sería un reporte de errores _on-device_ o un proveedor con DPA y
> garantía de no-entrenamiento. Ver los planes [42-sentry-monitorizacion-errores](../planes/42-sentry-monitorizacion-errores.md)
> y [43-sentry-release-debug-test](../planes/43-sentry-release-debug-test.md) (adaptaciones: política
> de PII niño-sí/adulto-no, `release`, `debug` en dev y disparador de prueba).

**Criterios de aceptación**

- Dado un **DSN de Sentry** en variable de entorno, Cuando la app arranca, Entonces Sentry se
  inicializa y captura los **errores no controlados** y **crashes** con su _stack trace_.
- Dado que **no hay DSN** configurado (modo por defecto, desarrollo y E2E en `mock`), Cuando la app
  arranca, Entonces Sentry **no se inicializa** y **no** se transmite nada a terceros (coherente con el
  modo base y con [US-06](#us-06)).
- Dado un evento a punto de enviarse y un **perfil de niño activo**, Cuando pasa por `beforeSend`,
  Entonces se **redacta el nombre del niño** (`[child]`) en mensaje, excepciones y breadcrumbs —el dato
  del menor nunca sale—, mientras que el **email del adulto administrador sí puede salir** (decisión
  consciente), y `sendDefaultPii` queda en **`false`** (no se envían IP ni identificadores por defecto).
- Dado que la app está construida con una versión, Cuando se envía un evento, Entonces lleva la
  **`release`** (`magyblob-app@<versión>`) para agrupar los errores por versión, y en **desarrollo**
  Sentry corre con **`debug`** activo (logs de verificación en consola).
- Dado un build de **desarrollo** (`__DEV__`), Cuando un adulto entra en la zona parental, Entonces
  dispone de un **disparador de prueba** que envía un error a Sentry para verificar la tubería; en
  **producción** ese disparador **no** se renderiza.
- (Cumplimiento) Dado el SDK, Entonces queda documentado como **desviación asumida (C-12)** en
  [cumplimiento-menores.md](../cumplimiento-menores.md), con sus mitigaciones, y es **desactivable**
  retirando el DSN (sin DSN → comportamiento conforme, nada sale).
- (No-funcional) Dado el modo `mock`/desarrollo, Cuando se ejecutan los E2E y el gate, Entonces Sentry
  permanece inactivo (sin DSN) y no añade pasos ocultos al arranque reproducible ([US-06](#us-06)).

## US-41 — Degradación elegante ante errores de render (ErrorBoundary) · Could (Mejoras)

Como **niño/a usuario** (y como responsable del producto) quiero que, si una pantalla falla de forma
inesperada, la app **muestre un aviso amable y permita reintentar** en lugar de quedarse en blanco
(_white screen of death_), para que un fallo en una zona no rompa toda la experiencia.

**Contexto.** Extiende la monitorización de [US-40](#us-40). Hoy solo existe `Sentry.wrap(App)` (boundary
raíz **sin _fallback_ propia**: ante un crash de render se ve la pantalla nativa por defecto). Se añade un
componente propio **`AppErrorBoundary`** sobre `Sentry.ErrorBoundary` que captura el error, lo reporta a
Sentry (con `scrubEvent` ya redactando PII del niño) y renderiza una **_fallback UI_ en español** acorde al
tema (`BubblyButton` de reintento, colores `errorContainer`/`onErrorContainer`). Se coloca en **dos
niveles**: global (envolviendo la navegación) y **por zona** en las pantallas de contenido generado
(`StoryGenerator`, `Actividades`, `StoryReader`) para aislar fallos. **No** se usa la prop `showDialog`
(diálogo de _feedback_ de Sentry): es UI/red de tercero que recoge PII y choca con **C-12** y con la regla
de diálogos propios ([US-23](#us-23)); la app usa su `DialogProvider`.

**Criterios de aceptación**

- Dado un componente hijo que lanza un error de render, Cuando ocurre dentro de un `AppErrorBoundary`,
  Entonces se muestra una **_fallback UI_ en español** (mensaje amable, sin _stack_ ni texto técnico) y la
  app **no** queda en blanco.
- Dada la _fallback UI_, Cuando el usuario pulsa **«Reintentar»**, Entonces el boundary se **resetea**
  (`resetError`) y vuelve a montar el contenido.
- Dado un boundary **por zona** (p. ej. `Cuentos`), Cuando esa pantalla falla, Entonces el resto de la app
  (otras tabs, navegación) **sigue operativa** (degradación elegante).
- Dado un error capturado por el boundary y un **DSN** configurado, Cuando se reporta a Sentry, Entonces el
  evento llega etiquetado con el origen (`boundary`) y **sin PII del niño** (vía `scrubEvent`); sin DSN, no
  sale nada.
- (Cumplimiento) Dado el boundary, Entonces **no** se activa `showDialog`/`feedbackIntegration` ni se
  muestra `error.message` ni el _component stack_ al usuario (coherente con **C-12** y [US-23](#us-23)).

## US-42 — Telemetría del recorrido del usuario (breadcrumbs) · Could (Mejoras)

Como **desarrollador/responsable del producto** quiero registrar el **rastro de eventos previos a un
error** (navegación → acciones → llamadas API) para **reconstruir los pasos exactos** del usuario y
reproducir bugs que no se dan en desarrollo, sin pedir _logs_ manuales.

**Contexto.** Extiende [US-40](#us-40). Hoy no hay ningún `addBreadcrumb` propio. Se añade un helper
**`telemetry`** con _wrappers_ tipados sobre `Sentry.addBreadcrumb` (categorías `navigation`/`api`/`ui`,
niveles `info`/`warning`/`error`) que aceptan **solo datos no-PII por construcción** (enums/ids/contadores:
`tema`, `estilo`, `edad`, `idioma`, `status`, `rating`). Instrumentación centralizada: en `request()` (capa
HTTP, cubre los 9 endpoints), en el `onStateChange` de la navegación, y en los _handlers_ de negocio
(generar cuento/actividades, completar actividad, login/alta, selección/creación de perfil). Como **defensa
en profundidad** se fija `maxBreadcrumbs`, se añade un `beforeBreadcrumb` y se extiende `scrubEvent` para
redactar también `breadcrumbs[].data` (hoy solo redacta `message`).

**Criterios de aceptación**

- Dado un recorrido del usuario (navegar, generar, llamar a la API), Cuando ocurre un error y se envía a
  Sentry, Entonces el evento incluye un **_timeline_ de breadcrumbs** con las categorías
  `navigation`/`api`/`ui` previas, con su **nivel** (`info`/`warning`/`error`).
- Dada una llamada API en `request()`, Cuando termina (éxito o `ApiError`), Entonces se registra un
  breadcrumb `api` con **método, ruta y `status`/resultado**, **sin** cuerpo ni datos sensibles.
- Dado un cambio de pantalla, Cuando cambia el estado de navegación, Entonces se registra un breadcrumb
  `navigation` con el **nombre de ruta** (sin parámetros con PII).
- Dado un breadcrumb a punto de enviarse, Cuando contiene (por error) el **nombre del niño**, Entonces se
  **redacta** (`[child]`) tanto en `message` como en `data` (vía `scrubEvent`/`beforeBreadcrumb`), y nunca
  se registra texto libre (prompt del cuento, nombre del perfil).
- (Cumplimiento) Dado que **no hay DSN**, Cuando la app funciona, Entonces los _wrappers_ son **no-op** y no
  se transmite nada (coherente con [US-06](#us-06) y **C-12**); sin Session Replay ni tracking automático de
  navegación de terceros.

## US-43 — Robustez de red/IA en la app: timeouts y estados de error · Should (Fase 6)

Como **niño/a usuario** (y como responsable del producto) quiero que, si el backend o la IA **tardan o
no responden**, la app **no se quede colgada** y muestre un aviso claro con opción de **reintentar**,
para que un fallo de red o de generación no bloquee la experiencia.

**Contexto.** Cierra el ítem de robustez de la **Fase 6** y su DoD (_"la app no rompe ante fallos de IA
o red"_). Hoy la capa HTTP ([`infrastructure/http.ts`](../../packages/app/src/infrastructure/http.ts))
usa `fetch` **sin timeout**: si el backend no responde, el spinner queda indefinido. Se añade un
**`AbortController` con timeout configurable** (p. ej. 30 s generación, 15 s narración) que, al vencer,
produce un `ApiError` de tipo `timeout` tratado como el resto de errores. La mayoría de pantallas ya
muestran carga + error (`StoryGenerator`, `Actividades`, `SelectProfile`, `History`, `Login`); se
completan los huecos: **spinner de carga en `CreateProfile`** y **botón «Reintentar» en `History`**. La
narración ([`useNarration`](../../packages/app/src/presentation/hooks/useNarration.ts)) gana timeout y
conserva su **fallback a voz nativa** on-device. **Solo app**, no toca el backend ni el arranque
reproducible (US-06), sin red externa ni SDKs de terceros nuevos.

**Criterios de aceptación**

- Dado que el backend no responde, Cuando una petición supera el **timeout** configurado, Entonces se
  aborta y se produce un `ApiError` (tipo `timeout`); la app muestra el **estado de error** y **no**
  queda con un spinner indefinido.
- Dado un fallo de red o timeout al **generar cuento** o **recomendar actividades**, Cuando ocurre,
  Entonces la pantalla muestra un **aviso claro** con opción de **reintentar** y la app sigue operativa.
- Dado que estoy **creando un perfil**, Cuando la petición está en curso, Entonces veo un **estado de
  carga** (spinner) y el botón no permite envíos duplicados.
- Dado un error al cargar el **Historial**, Cuando se muestra, Entonces hay un botón **«Reintentar»**
  que reintenta sin tener que salir y volver a la pestaña.
- Dado un fallo o timeout de la **narración** (ElevenLabs/red), Cuando intento escuchar, Entonces
  degrada a la **voz nativa** del dispositivo sin colgarse ni mostrar error técnico.
- (Tests) Dado el camino de error (petición que falla/expira), Cuando se ejercita en test, Entonces se
  verifica que la UI muestra el error/reintento y no rompe.

## US-44 — Validación de fronteras de datos con Zod · Should (Mejoras)

Como **responsable del producto** quiero que los **datos que entran al sistema desde fuentes no
fiables** (salida del LLM, settings persistidos, respuestas del backend en la app) se **validen y
saneen en su frontera** con esquemas declarativos, para que un dato malformado se rechace o normalice
de forma predecible en lugar de propagarse y romper más adentro.

**Contexto.** Hoy ese saneo es **imperativo y disperso**: la salida del LLM se valida a mano en
[`parseResponse.ts`](../../packages/backend/src/infrastructure/ai/parseResponse.ts) (un modelo pequeño
alucina categorías inexistentes o números fuera de rango), los settings en JSON se validan con
`JSON.parse` + chequeos manuales en [`cloudSettings.ts`](../../packages/backend/src/infrastructure/ai/cloudSettings.ts)
y [`storyParams.ts`](../../packages/backend/src/infrastructure/ai/storyParams.ts), y la app **confía
ciegamente** en las respuestas del backend (`as TResponse` en
[`http.ts`](../../packages/app/src/infrastructure/http.ts)). Se introduce **Zod** como librería de
validación en las capas **application/infrastructure** (backend) y en la app, manteniendo el
comportamiento actual de **sanear, no solo rechazar**. **Restricción de arquitectura:** Zod **no** entra
en `/domain` (el invariante de capas ESLint prohíbe dependencias externas ahí); los value-objects
(`Edad`, `Idioma`) **no se tocan**. **Cumplimiento:** Zod es una librería pura sin red/SDK/telemetría →
**no afecta** a C-2/C-5 ([cumplimiento-menores](../cumplimiento-menores.md)). Fase 2 **opcional**:
migrar la validación de rutas Fastify a `fastify-type-provider-zod` para eliminar la duplicación entre
el JSON Schema de cada ruta y los DTOs.

**Criterios de aceptación**

- Dado un JSON de salida del LLM con campos inválidos (categoría inexistente, `nivel` fuera de rango),
  Cuando se parsea con el esquema Zod, Entonces los valores no válidos se **descartan o sanean** igual
  que hoy y el resultado conserva el mismo contrato (`GeneratedStory`/`GeneratedActivity[]`).
- Dado un setting (`ai.cloud` / `prompt.story.params`) ausente, no-JSON o con forma incorrecta, Cuando
  se valida con Zod, Entonces se devuelve `null` (privacidad/seguridad por defecto: ante la duda, no se
  activa) sin lanzar.
- Dado que la app recibe una respuesta del backend, Cuando no cumple el esquema esperado, Entonces se
  produce un `ApiError` controlado en lugar de propagar un objeto malformado por un cast `as`.
- Dado el invariante de capas, Cuando se ejecuta el lint, Entonces **ningún** import de `zod` aparece en
  `/domain` (la regla `no-restricted-imports` sigue verde).
- (Tests) Dado cada esquema nuevo, Cuando se ejercitan sus casos límite (válido, inválido, saneable),
  Entonces los tests co-localizados verifican el mismo comportamiento que la validación manual sustituida
  y `pnpm check` queda verde.

## US-45 — Sesión autenticada del adulto con JWT · Should (Fase 6)

Como **padre/tutor** quiero que mi sesión quede **autenticada con un token** tras identificarme, y que
los endpoints que manejan mis datos y los de mis hijos **solo respondan con una credencial válida**, para
que la información del perfil del niño no sea accesible sin haber iniciado sesión.

**Contexto.** Hoy el "login" es una **identificación ligera por email sin contraseña** (Fase 5.5,
[US-19](epic-a-perfil.md#us-19)): `POST /guardians/login` devuelve el `Guardian` pero **no emite ninguna
credencial**, y **ningún endpoint está protegido** (cualquiera puede llamar a `POST /stories`,
`GET /profiles/:id/history`, etc.). Esta historia añade **autenticación basada en JWT** con
[`@fastify/jwt`](https://github.com/fastify/fastify-jwt): el login emite un **access token de vida corta**
(p. ej. 15 min) y un **refresh token de vida larga** (p. ej. 7 días), el backend protege las rutas de
datos con un _preHandler_ (`onRequest`) que verifica el access token, y la app guarda los tokens y
envía `Authorization: Bearer` en cada petición, renovando el access ante un `401` mediante el refresh.
El **alta (`POST /guardians`) también abre sesión** (auto-login) para no exigir un login extra en el
onboarding. **No se añade contraseña** (se conserva la identificación ligera declarada en cumplimiento);
JWT solo aporta gestión de sesión/credencial sobre el login existente. **Decisiones (YAGNI):** se usa
**un único secreto** y se distingue access vs refresh por el claim `type` (no se separan
secretos/namespaces; la augmentación de tipos del patrón namespaced es frágil y el secreto único cumple
igual los criterios); el refresh es **stateless** (JWT firmado, sin tabla en BD) y el _logout_ es de
cliente (descartar tokens); la **revocación server-side queda fuera de alcance** (limitación asumida).
Los **secretos van en variables de entorno**, nunca en BD ni en el repo (coherente con [US-18](#us-18)).
La app es **React Native/Expo** (no navegador): los tokens viajan en el **cuerpo JSON**, no en cookie
httpOnly. **Backend + app.** Ver el plan [48-jwt-sesion](../planes/feature-48-jwt-sesion.md).

> **Cumplimiento.** JWT es una librería de utilidades de token **sin red externa ni SDKs de terceros** →
> **no afecta** a C-2/C-5 ([cumplimiento-menores.md](../cumplimiento-menores.md)). Refuerza la protección
> de los datos del menor (los endpoints dejan de ser anónimos), manteniendo la privacidad por diseño.

**Criterios de aceptación**

- Dado un adulto registrado, Cuando hace `POST /guardians/login` con un email válido, Entonces la
  respuesta incluye el `Guardian` y **un `accessToken` (corto) y un `refreshToken` (largo)** JWT
  firmados, y se sigue registrando el `AuditLog`/evento de login.
- Dado un **access token válido** en la cabecera `Authorization: Bearer`, Cuando se llama a una ruta
  protegida (`GET /guardians/:id/profiles`, `POST /profiles`, `POST /stories`,
  `POST /activities/recommend`, `GET /profiles/:id/history`, `POST /stories/:id/read`,
  `POST /activities/:id/complete`, narración), Entonces responde con normalidad (200/201).
- Dada una ruta protegida, Cuando se llama **sin token o con un token inválido/expirado**, Entonces
  responde **401** con el cuerpo de error uniforme y **no** ejecuta la operación.
- Dadas las rutas **públicas** (`GET /health`, `POST /guardians`, `POST /guardians/login`,
  `POST /guardians/refresh`), Cuando se llaman sin token, Entonces siguen respondiendo (no se protegen).
- Dado un **refresh token válido**, Cuando se llama a `POST /guardians/refresh`, Entonces se emite un
  **nuevo access token** (200); con un refresh inválido/expirado, Entonces **401**.
- Dado que la app tiene sesión iniciada, Cuando hace cualquier petición autenticada, Entonces adjunta
  `Authorization: Bearer <accessToken>`; y ante un **401**, intenta **una** renovación con el refresh y
  reintenta la petición; si la renovación falla, **cierra la sesión** y vuelve al onboarding.
- Dado el cierre de sesión, Cuando el adulto hace _logout_, Entonces la app **descarta access y refresh**
  tokens del almacenamiento persistido (el _logout_ es de cliente; no hay revocación server-side).
- (Seguridad) Dado el secreto de firma, Cuando se configura, Entonces va en **variables de entorno**
  (`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`), **nunca** en BD ni versionado, con defaults solo de
  desarrollo (coherente con [US-18](#us-18)).
- (No-funcional) Dado JWT, Entonces **no** introduce red externa ni SDKs de terceros (no afecta a
  C-2/C-5) y el arranque reproducible ([US-06](#us-06)) sigue funcionando con los secretos por defecto.
- (Tests) Dado el flujo, Cuando se ejercita en test, Entonces se verifica: emisión de tokens en login,
  refresh (200/401), rutas protegidas (401 sin token / OK con token), y en la app que `http.ts` adjunta
  la cabecera y hace refresh-on-401, y que el store persiste/limpia los tokens.

## US-46 — Configuración del backend validada con Zod · Should (Mejoras)

Como **desarrollador/evaluador del proyecto** quiero que la **configuración derivada de variables de
entorno** se valide con un esquema declarativo al arrancar, de modo que un despliegue de **producción**
con secretos ausentes o mal formados (`DATABASE_URL`, `JWT_SECRET`, etc.) **falle de inmediato con un
mensaje claro** en lugar de arrancar con valores de desarrollo inseguros o caer más tarde de forma
opaca.

**Contexto.** Hoy [`loadConfig()`](../../packages/backend/src/config.ts) lee `process.env` de forma
**imperativa** con _helpers_ sueltos (`parsePort`, `parseAiProvider`, `loadCloudApiKeys`,
`loadAuthConfig`, `loadTtsConfig`) y **defaults de desarrollo silenciosos**: en producción, un
`JWT_SECRET` ausente cae al secreto inseguro `dev-insecure-…` y un `DATABASE_URL` vacío no se detecta
hasta que Prisma falla. No hay validación de frontera de la config ni fallo temprano. Aprovechando que
**US-44** ya introdujo **Zod** en el backend, se reescribe `loadConfig()` sobre un **esquema Zod** que
normaliza y valida las variables, con una **regla condicional por entorno**: en `NODE_ENV=production`
los secretos/URLs críticos son **obligatorios** (sin caer a defaults de desarrollo), mientras que en
desarrollo/test se conserva el comportamiento actual (defaults seguros). El esquema se invoca en el
**arranque** ([`index.ts`](../../packages/backend/src/index.ts)): si la validación falla, el proceso
**aborta** (`exit ≠ 0`) imprimiendo los errores agregados de Zod (qué variable falta o está mal).
**Solo backend.** Zod es una librería pura sin red/SDK/telemetría → **no afecta** a C-2/C-5
([cumplimiento-menores.md](../cumplimiento-menores.md)) ni al arranque reproducible
([US-06](#us-06)): el modo por defecto (`AI_PROVIDER=mock`, `NODE_ENV` no productivo) sigue arrancando
con `cp .env.example .env && docker compose up` sin pasos ocultos.

**Criterios de aceptación**

- Dado `NODE_ENV=production` y una variable crítica ausente o mal formada (p. ej. `DATABASE_URL` vacía,
  `JWT_SECRET` ausente), Cuando el backend arranca, Entonces `loadConfig()` **lanza** y el proceso
  **aborta** (`exit ≠ 0`) con un mensaje que indica **qué** variable(s) fallan, sin levantar el
  servidor.
- Dado `NODE_ENV=production` y un `JWT_SECRET` ausente, Cuando se valida la config, Entonces **no** se
  cae al secreto de desarrollo (`dev-insecure-…`): el secreto inseguro queda restringido a entornos no
  productivos.
- Dado el modo por defecto (sin `NODE_ENV=production`, `AI_PROVIDER=mock`), Cuando se arranca con
  `cp .env.example .env && docker compose up`, Entonces la config valida con los **defaults de
  desarrollo** y el arranque reproducible ([US-06](#us-06)) sigue funcionando sin pasos ocultos.
- Dada una variable con tipo/valor inválido (p. ej. `PORT` no numérico, `AI_PROVIDER` fuera de
  `mock|local`), Cuando se valida, Entonces el esquema la **normaliza o rechaza** de forma predecible
  (mismo contrato `Config` que hoy), sin propagar un valor basura.
- Dado el invariante de capas, Cuando se ejecuta el lint, Entonces el esquema Zod vive en
  infraestructura/config (no en `/domain`) y la regla `no-restricted-imports` sigue verde.
- (Tests) Dado el esquema, Cuando se ejercitan sus casos (defaults de desarrollo, override por env,
  fallo en producción por secreto/URL ausente, normalización de tipos), Entonces los tests
  co-localizados de [`config.test.ts`](../../packages/backend/test/config.test.ts) —hoy solo cubre la
  parte JWT— se **amplían** para cubrirlos y `pnpm check` queda verde.

## US-51 — Ambiente de producción guiado (despliegue) · Should (Mejoras)

Como **desarrollador/evaluador del proyecto** quiero un **camino de despliegue de producción
reproducible y documentado** (infraestructura como código + guía paso a paso) para poner el backend en
la nube con su base de datos gestionada y un proveedor de IA accesible, sin pasos ocultos y sin
exponer secretos en el repositorio.

**Contexto.** Hasta ahora el proyecto solo se levantaba en local con `docker compose up`
([US-06](#us-06)) y la **configuración del backend ya se valida al arrancar con Zod**
([US-46](#us-46)), que en `NODE_ENV=production` **exige `DATABASE_URL`** y avisa de un `JWT_SECRET`
inseguro. Esta historia añade el **ambiente de producción guiado**, decidido con el usuario:

- **Backend en [Render](https://render.com)** como _web service_ Docker, construido con el
  [`Dockerfile`](../../packages/backend/Dockerfile) existente (contexto de build = **raíz del repo**),
  health check en `/health`, rama `main` → producción. Las **migraciones Prisma** corren solas en el
  arranque vía el `CMD` del Dockerfile (`prisma migrate deploy && node dist/index.js`), sin pasos
  ocultos.
- **Base de datos en [Neon](https://neon.tech)** (PostgreSQL 16 gestionado), con _connection string_
  `sslmode=require` y host `-pooler`.
- **IA en la nube con [Groq](https://groq.com)** (free tier), reutilizando el `CloudProvider` ya
  existente (US-14); **Ollama no va a producción** (no hay GPU en el plan free).
- **Infraestructura como código**: un [`render.yaml`](../../render.yaml) (Blueprint de Render) declara
  el servicio y sus variables; los **secretos** (`DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`) se
  marcan `sync: false` (se introducen en el panel, **nunca** en el repo).

Es **infra + docs**: no toca el runtime del backend (la config Zod de US-46 ya soporta producción) ni
la lógica de la app, solo añade el blueprint, la guía [`Docs/despliegue.md`](../despliegue.md) y la
parametrización de `EXPO_PUBLIC_API_URL` de la app hacia el backend de producción (sin romper el
default local). **Cumplimiento:** usar Groq en producción implica que el **texto del cuento sale a un
tercero** en la nube; se documenta como **desviación asumida del TFM**, coherente con la ya declarada
para el modo cloud ([C-5](../cumplimiento-menores.md)). Sin la `GROQ_API_KEY` el backend cae al modo
base (`mock`/`local`) y no sale nada (conforme).

**Criterios de aceptación**

- Dado el [`render.yaml`](../../render.yaml) en la raíz, Cuando se importa como Blueprint en Render,
  Entonces define un _web service_ **Docker** con `dockerfilePath: packages/backend/Dockerfile`,
  `dockerContext: .`, `branch: main`, `healthCheckPath: /health`, región y plan declarados, sin Root
  Directory (contexto = raíz del repo).
- Dados los **secretos** de producción (`DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`), Cuando se
  declaran en el blueprint, Entonces van con `sync: false` (se introducen en el panel de Render),
  **nunca** con valores reales versionados; el resto de variables (`NODE_ENV=production`,
  `AI_PROVIDER=mock`, …) llevan valor fijo.
- Dado `NODE_ENV=production` y los valores del blueprint, Cuando el backend arranca en Render, Entonces
  la validación Zod ([US-46](#us-46)) **pasa** porque `DATABASE_URL` está presente; el `CMD` del
  Dockerfile aplica las **migraciones** (`prisma migrate deploy`) y luego levanta el servidor, y
  `/health` responde 200.
- Dada la guía [`Docs/despliegue.md`](../despliegue.md), Cuando un evaluador la sigue, Entonces puede
  crear el proyecto en Neon (PG16, `sslmode=require`, host `-pooler`), el _web service_ en Render
  (contexto raíz, env vars) y la API key de Groq, **probando antes contra una rama de Neon** que
  contra la base de `main`, y conoce el **cold start** del plan free.
- Dada la app, Cuando se construye apuntando a producción, Entonces `EXPO_PUBLIC_API_URL` se
  **parametriza** hacia la URL de Render (documentado en el `.env.example` del app, comentado) **sin
  romper** el default local (`http://localhost:3000`).
- (Cumplimiento) Dado el uso de **Groq** en producción, Entonces queda documentado en
  [cumplimiento-menores.md](../cumplimiento-menores.md) como **desviación asumida (TFM)**, coherente
  con C-5; y **sin la API key** el backend cae al modo base (`mock`/`local`) sin enviar nada a terceros.
- (No-funcional) Dado el blueprint y la guía, Cuando se revisan, Entonces **no** contienen secretos
  reales y el arranque reproducible local ([US-06](#us-06)) sigue intacto (`docker compose up` no
  cambia).

## US-50 — Dashboard/Home sin sesión (uso libre efímero) · Should (Mejoras)

Como **adulto que aún no se ha registrado** quiero una pantalla de inicio que me explique la app y me
deje **probar la generación de cuentos y actividades sin crear cuenta**, para conocer el valor del
producto antes de dar de alta a nadie, sin que se guarde ningún dato del menor.

**Contexto.** Hoy, sin sesión, el arranque va directo a **Bienvenida** (onboarding):
[`resolveInitialRoute`](../../packages/app/src/presentation/initialRoute.ts) devuelve `Welcome` cuando
`guardian` es nulo, y **toda** generación exige sesión (rutas `POST /stories` y
`POST /activities/recommend` protegidas con JWT, [US-45](#us-45)) y un `profileId` persistido. Esta
historia añade un **modo anónimo efímero**: una pantalla **Dashboard** como ruta inicial sin sesión que
explica la app y permite generar **hasta 3 cuentos y 3 actividades** de prueba, llamando a **rutas
públicas nuevas** (`POST /stories/anonymous`, `POST /activities/recommend/anonymous`) que **generan y
devuelven el contenido sin persistir nada y sin pedir nombre de niño** (solo datos mínimos: edad,
idioma y temas/estilos para el cuento; categoría/cantidad para actividades). El backend protege el modo
con un **rate-limit en memoria** (sin dependencia nueva, hook `onRequest`): máx. 3 cuentos + 3
actividades por cliente (IP), con **429** al superarlo. El cliente lleva su propio **contador efímero**
(no persistente) y desde el Dashboard se llega al **alta** o al **login**. **Backend + app.** Depende de
[US-47](epic-b-cuentos.md#us-47) (multi-tema/estilo en `POST /stories`) y de
[US-49](epic-a-perfil.md#us-49) (`resolveInitialRoute`).

> **Cumplimiento (C-1, C-14).** El modo anónimo es **efímero**: no persiste datos del menor ni su
> nombre (no se crea `ChildProfile` ni `Story`/`Activity`), por lo que **no genera dato de menor sin
> consentimiento** (coherente con C-1). Solo viajan datos mínimos no identificativos (edad, idioma,
> temas) y el contenido generado se devuelve y se descarta. El rate-limit usa la IP **solo en memoria
> y de forma efímera** (no se persiste, no es PII de menor). Ver [cumplimiento-menores.md](../cumplimiento-menores.md)
> (C-14).

**Criterios de aceptación**

- Dado que **no hay sesión**, Cuando arranca la app, Entonces la ruta inicial es **`Dashboard`** (no
  `Welcome`): una pantalla que explica la app y ofrece probar cuentos/actividades y, además, **crear
  cuenta** o **iniciar sesión**.
- Dado el Dashboard, Cuando pulso **«Generar cuento»** (con sus temas/estilos y una edad/idioma por
  defecto), Entonces la app llama a `POST /stories/anonymous` y muestra el cuento generado **sin** que
  se cree cuenta ni se persista nada.
- Dado el Dashboard, Cuando pulso **«Generar actividades»**, Entonces la app llama a
  `POST /activities/recommend/anonymous` y muestra las actividades generadas, también de forma efímera.
- Dado el **límite de uso** (3 cuentos y 3 actividades), Cuando lo alcanzo, Entonces la app deshabilita
  el botón correspondiente e invita a **crear cuenta** para seguir; y el backend responde **429** si se
  fuerza una petición por encima del límite (mensaje claro).
- Dadas las rutas anónimas, Cuando se llaman **sin token**, Entonces responden con normalidad (son
  **públicas**, como `POST /guardians`); y **validan su entrada con Zod** (vocabulario cerrado de temas,
  estilos, categorías; edad e idioma en rango), devolviendo **400** ante datos inválidos.
- (Cumplimiento) Dado el modo anónimo, Entonces **no** crea `ChildProfile`, `Story` ni `Activity` (no
  toca el modelo de datos ni Prisma) y **no** recibe ni guarda el nombre del niño; queda documentado en
  [cumplimiento-menores.md](../cumplimiento-menores.md) (C-14) como efímero y conforme con C-1.
- (Tests) Dado el flujo, Cuando se ejercita en test, Entonces se verifica: los casos de uso anónimos
  **no persisten** (repos sin escrituras), las rutas responden **200/201** dentro del límite y **429**
  al superarlo, y en la app que el Dashboard llama a los gateways anónimos y respeta el contador efímero.

## US-52 — Icono de la app y splash de marca · Could (Mejoras)

Como **adulto** quiero que la app tenga un **icono propio** y una **pantalla de carga (splash)** con la
identidad visual del producto, para que se reconozca en el dispositivo y la primera impresión sea cuidada.

- Dado el dispositivo, Cuando instalo la app, Entonces en el launcher aparece el **icono propio**: en
  Android un **icono adaptativo** (logo en la zona segura sobre fondo de marca `#fff8f6`) y en iOS un
  icono con **fondo sólido** (sin transparencia → sin esquinas negras).
- Dado el arranque, Cuando se muestra el **splash**, Entonces el **fondo es `#ccc4b9`** con el logo
  centrado (`expo-splash-screen`, `resizeMode: contain`).
- (No-funcional) Dado Android 13+, Entonces existe un **icono monocromo** (silueta del logo) para el
  tema del sistema.
- (No-funcional) Dado el cumplimiento, Entonces los recursos van **empaquetados en build-time** (sin
  descargas en runtime ni SDKs de terceros), coherente con [cumplimiento-menores.md](../cumplimiento-menores.md).

## US-53 — Robustez de producción y alta/login · Should (Mejoras)

Como **adulto** quiero que el alta y el inicio de sesión sean **robustos en producción** (servidor
en frío, redes lentas, teclado del móvil) y que mis credenciales tengan **garantías mínimas de
calidad**, para no perder el flujo por un timeout, un campo tapado por el teclado, un email mal
escrito o una contraseña débil.

- Dado un backend desplegado que arranca en frío (Render), Cuando lanzo la primera petición tras
  abrir la app, Entonces los **timeouts** son holgados (peticiones normales **30 s**, generación de
  IA **90 s**, narración **30 s**) y, ante un fallo de **red** o **timeout**, la app **reintenta con
  backoff** (hasta **2** reintentos) antes de mostrar error.
- Dado el arranque de la app, Cuando se inicializa, Entonces se hace un **ping de warm-up** a
  `/health` para despertar el servidor en frío sin bloquear la interfaz ni romper los tests.
- Dada una pantalla de formulario (Consent/Login/CreateProfile), Cuando aparece el **teclado**,
  Entonces el contenido se desplaza (`KeyboardAvoidingView`) y **ningún campo queda tapado**,
  conservando el scroll y el footer fijo.
- Dado el alta, Cuando introduzco un **email con formato inválido**, Entonces el backend lo **rechaza
  con 400** de forma temprana (`z.string().email()`); el **409 por email duplicado** se mantiene.
- Dado el alta, Cuando elijo la **contraseña**, Entonces se exige un mínimo razonable de **≥8
  caracteres con al menos una letra y un número** (sin reglas agresivas), validado **en el backend y
  en la app** de forma sincronizada, con **ayuda visual** del requisito en la pantalla de alta.

## US-56 — Estándares de diseño Android/iOS · Should (Mejoras)

Como **usuario de la app** quiero que los componentes base sigan las pautas de diseño de cada
plataforma (Material 3 en Android, Human Interface Guidelines en iOS) para que la interacción se sienta
**nativa, accesible y agradable** en cualquier dispositivo.

**Contexto.** El design system "Aprendizaje Mágico" (tokens en
[theme/tokens.ts](../../packages/app/src/presentation/theme/tokens.ts)) ya fija paleta, tipografía
Quicksand y tap targets ≥64px, pero los componentes base no daban **feedback táctil** conforme a cada
plataforma (sin `android_ripple` ni háptica) y algunos pares de color no se habían verificado contra el
**contraste AA** (WCAG 2.1, 4.5:1 texto normal / 3:1 texto grande). Esta historia hace de **bajo riesgo**
mejoras conformes a Material 3 / HIG centradas en **componentes y theme** (`BubblyButton`,
`SelectableChip`, `tokens.ts`) y en las **opciones de navegación** (`stackScreenOptions` en `App.tsx`),
**sin tocar el contenido/strings de las pantallas** (eso lo cubren las historias de i18n y cabeceras).
Se añade [`expo-haptics`](https://docs.expo.dev/versions/latest/sdk/haptics/) (SDK oficial de Expo,
empaquetado en build-time: sin red ni SDK de tercero en runtime, conforme a
[cumplimiento-menores.md](../cumplimiento-menores.md)). **Solo app.** Ver el plan
[feature-60-estandares-diseno](../planes/feature-60-estandares-diseno.md).

**Criterios de aceptación**

- Dado un botón principal `BubblyButton` en **Android**, Cuando lo pulso, Entonces muestra un
  **`android_ripple`** con el color de la plataforma (Material 3) además del estado "hundido" existente.
- Dado el `BubblyButton` (no deshabilitado), Cuando lo pulso, Entonces dispara un **háptico suave**
  (`expo-haptics`, `ImpactFeedbackStyle.Light`) como confirmación táctil; deshabilitado o cargando **no**
  dispara háptico ni invoca `onPress`.
- Dado el chip `SelectableChip` en **Android**, Cuando lo pulso, Entonces ofrece **feedback táctil**
  (`android_ripple`) coherente con el botón.
- Dados los pares de color del theme (texto sobre superficie), Cuando se auditan contra **WCAG 2.1 AA**,
  Entonces cumplen el contraste mínimo (4.5:1 texto normal, 3:1 texto grande) y los que no cumplían se
  ajustan, documentando el cambio.
- Dada la cabecera del stack en **iOS**, Cuando navego hacia atrás, Entonces el botón "atrás" sigue la
  HIG (etiqueta/título conforme) y la navegación queda consistente entre plataformas.
- Dados los componentes tocados (`BubblyButton`, `SelectableChip`), Cuando se ejecuta `pnpm test`,
  Entonces sus pruebas **user-centric** (rol/nombre accesible, sin probar estilos) siguen en verde y
  cubren el nuevo comportamiento donde es observable.
- (No-funcional) Dada la dependencia `expo-haptics`, Cuando se instala, Entonces va **empaquetada en
  build-time** (sin red ni SDK de tercero en runtime) y degrada de forma segura en plataformas sin
  háptica (web), conforme a [cumplimiento-menores.md](../cumplimiento-menores.md).

## US-58 — Cabeceras por pantalla · Could (Mejoras)

Como **usuario de la app** quiero que cada pantalla principal muestre una **imagen de cabecera**
ilustrada para que la app se sienta más cálida, visual y reconocible, y para que cada sección tenga
una identidad propia de un vistazo.

**Contexto.** El lienzo base [Screen](../../packages/app/src/presentation/components/Screen.tsx) ya
fija fondo crema, márgenes seguros, scroll, footer fijo y `KeyboardAvoidingView` (US-53), pero las
pantallas no tenían cabecera ilustrada. Esta historia añade una **variante opcional** de `Screen`
con la prop `headerImageName` que pinta la imagen correspondiente de
[assets/images/headers/](../../packages/app/assets/images/headers/) en la parte superior, dentro del
área segura y respetando el scroll y el footer existentes. El mapeo de nombre → imagen usa
**`require` estáticos** (Metro no resuelve `require` dinámicos). Las imágenes se **optimizan en peso**
antes de empaquetar (de ~2 MB a ~200-400 KB) sin degradar visiblemente. Solo las pantallas con imagen
disponible reciben cabecera (`Welcome`, `Home`, `Dashboard`, generador de cuentos y actividades); el
resto se queda sin ella. **Solo app.** Ver el plan
[feature-62-cabeceras-pantalla](../planes/feature-62-cabeceras-pantalla.md).

> **Ajuste (feature 64).** La cabecera se muestra con la **imagen completa** (`resizeMode="contain"`,
> con la proporción del origen ~1000×1026) en vez de recortada (`cover`), para que se vea entera y bien
> encuadrada. Ver el plan [feature-64-ajustes-prompts-doc](../planes/feature-64-ajustes-prompts-doc.md).
>
> **Ajuste (feature 65).** El `aspectRatio` cuadrado del origen hacía la cabecera demasiado alta. Ahora
> la imagen se sigue mostrando **completa** (`resizeMode="contain"`) pero dentro de una **banda de alto
> proporcional** (~22 % del alto de pantalla con `useWindowDimensions`, acotada a 170–200), centrada,
> con el fondo del theme (`colors.surface`) rellenando el espacio sobrante: queda encuadrada y
> proporcionada. Ver el plan
> [feature-65-ajustes-cabecera-portadas](../planes/feature-65-ajustes-cabecera-portadas.md).

**Criterios de aceptación**

- Dada una pantalla que pasa `headerImageName` (p. ej. `welcome`), Cuando se renderiza, Entonces
  muestra la **imagen de cabecera** correspondiente **completa** (sin recorte) en la parte superior,
  dentro del área segura y por encima del contenido desplazable.
- Dada una pantalla que **no** pasa `headerImageName`, Cuando se renderiza, Entonces **no** muestra
  ninguna cabecera y conserva el comportamiento anterior (contenido, scroll y footer intactos).
- Dado el lienzo con cabecera, Cuando aparece el **teclado**, Entonces se conserva el
  `KeyboardAvoidingView` (US-53) y el **footer fijo** sigue alcanzable.
- Dadas las imágenes de cabecera, Cuando se empaquetan, Entonces su **peso** queda en el rango
  ~200-400 KB por imagen (optimizadas desde ~2 MB) **sin degradación visible** y con dimensiones
  consistentes.
- Dada la resolución del nombre a imagen, Cuando se construye la app, Entonces usa **`require`
  estáticos** (mapa por nombre), no `require` dinámicos (requisito de Metro).
- Dado el componente `Screen` y alguna pantalla con cabecera, Cuando se ejecuta `pnpm test`, Entonces
  hay pruebas que verifican que la cabecera se renderiza cuando se pasa el nombre y **no** se renderiza
  cuando se omite.

## US-57 — Internacionalización del app (ES/EN) · Should (Mejoras)

Como **persona adulta que usa la app** quiero poder **cambiar el idioma de la interfaz entre español
e inglés** para que toda la app (textos de UI, botones, títulos de pantalla, mensajes) se muestre en
el idioma que prefiero, con independencia del idioma del perfil del niño.

**Contexto.** Hasta ahora todos los textos de la UI estaban **hardcodeados en español** repartidos por
`presentation/screens/*`, los componentes con texto (`ActivityCard`, `AuthorBadge`, `NarrationControls`,
`ParentalGate`, `ErrorFallback`, `BubblyButton` vía `label`) y los **títulos de cabecera del stack** en
`App.tsx`. Esta historia introduce **i18n** con `i18next` + `react-i18next` (recursos `es`/`en`
empaquetados, sin red ni SDK de tercero en runtime, conforme a
[cumplimiento-menores.md](../cumplimiento-menores.md)) y `expo-localization` como **sugerencia inicial**
del idioma del dispositivo. El **idioma por defecto y de respaldo es `es`** (los textos en español se
conservan idénticos bajo claves, de modo que las pruebas user-centric existentes que consultan por texto
siguen verdes). Se distingue el **idioma del APP** (`appLanguage`, ES/EN, persistido en `useAppStore`,
con selector en la **zona de adultos**) del **idioma del PERFIL** del niño (que ya existe y gobierna la
generación de los cuentos en el backend, y **no se toca**). Los vocabularios cerrados del dominio
(`labels.ts`: temas, estilos, parentesco, categorías, proveedor) se integran en el sistema i18n
manteniendo su etiqueta ES idéntica. **Solo app.** Ver el plan
[feature-61-i18n-app](../planes/feature-61-i18n-app.md).

> **Ajuste (feature 64).** Se **retira `expo-localization`**: el idioma lo elige la persona adulta y por
> defecto es **`es`**, así que la detección del idioma del dispositivo sobra. El criterio sobre
> `expo-localization` (sugerencia inicial) queda **obsoleto**: el arranque sin preferencia guardada usa
> `es` fijo y el cambio manual vía `appLanguage`/selector existente. Ver el plan
> [feature-64-ajustes-prompts-doc](../planes/feature-64-ajustes-prompts-doc.md).

**Criterios de aceptación**

- Dado el sistema i18n inicializado, Cuando no hay idioma elegido por la persona adulta, Entonces el
  idioma activo es **`es`** por defecto (y `es` es también el `fallbackLng`), de modo que los textos
  coinciden con los que había antes.
- Dada una clave de traducción existente en ambos idiomas, Cuando el idioma activo es `es`, Entonces
  `t('clave')` devuelve el texto **en español**; Cuando el idioma activo es `en`, Entonces devuelve el
  texto **en inglés**.
- Dada la **zona de adultos** (`ParentalScreen`), Cuando elijo el idioma del app (ES o EN), Entonces la
  interfaz cambia de idioma de inmediato (`i18n.changeLanguage`) y la elección **persiste** entre
  reinicios (`appLanguage` en `useAppStore`).
- Dado el **idioma del perfil** del niño (que gobierna la generación de los cuentos), Cuando cambio el
  idioma del **app**, Entonces el idioma del perfil **no** se ve afectado (son ajustes independientes).
- Dados los **textos hardcodeados** de las pantallas, los componentes con texto y los **títulos de
  cabecera** del stack (`App.tsx`), Cuando se aplica la i18n, Entonces se sustituyen por claves `t(...)`
  resueltas desde los diccionarios `es`/`en`.
- ~~Dado `expo-localization`, Cuando arranca la app por primera vez (sin preferencia guardada),
  Entonces el idioma del dispositivo se usa **solo como sugerencia inicial**...~~ **(obsoleto, feature
  64).** Ahora: Cuando arranca la app sin preferencia guardada, Entonces el idioma activo es **`es`**
  fijo (sin detección del dispositivo); el cambio es **manual** vía el selector de la zona de adultos.
- Dado el conjunto de pruebas, Cuando se ejecuta `pnpm test`, Entonces hay pruebas del **cambio de
  idioma** (`t` devuelve ES/EN según el idioma activo) y de que una pantalla **renderiza el texto
  traducido**, y las pruebas user-centric existentes (que consultan por texto en español) **siguen en
  verde** sin cambios de texto.
- (No-funcional) Dadas las dependencias `i18next` y `react-i18next`, Cuando se instalan, Entonces los
  diccionarios van **empaquetados en build-time** (sin red ni descarga de traducciones en runtime),
  conforme a [cumplimiento-menores.md](../cumplimiento-menores.md). **(feature 64: `expo-localization`
  ya no es dependencia del app.)**

## US-60 — Documento de muestra de prompts (resultados reales) · Could (Mejoras)

Como **autor del TFM / persona que evalúa la calidad de la IA** quiero un **documento de muestra** que
recoja, para un conjunto representativo de combinaciones, el **prompt real** que envía el sistema y el
**resultado real** del proveedor (cuentos y actividades con Groq, portadas con Gemini), para poder
**auditar y documentar** el comportamiento de la capa de IA sin tener que reproducirlo a mano.

**Contexto.** La capa de IA construye los prompts en
[`prompts.ts`](../../packages/backend/src/infrastructure/ai/prompts.ts) (`buildStoryPrompt`,
`buildActivitiesPrompt`, `buildImagePrompt`) y llama a los proveedores de infraestructura
([`CloudProvider`](../../packages/backend/src/infrastructure/ai/CloudProvider.ts) para texto vía Groq,
[`GeminiImageProvider`](../../packages/backend/src/infrastructure/ai/GeminiImageProvider.ts) para
imágenes). Esta historia añade un **script on-demand** (`pnpm --filter @magyblob/backend prompts:dump`,
al estilo de los `ai:smoke`) que recorre un conjunto **representativo** de combinaciones (cada tema una
vez, cada estilo una vez, ambos idiomas ES/EN, 1-2 edades — **no** el producto cartesiano), construye
los prompts reales, obtiene los resultados llamando a Groq/Gemini y escribe un **documento Markdown**
sobrescribible ([muestra-prompts.md](../muestra-prompts.md)). Requiere `GROQ_API_KEY` y `GEMINI_API_KEY`
y **no entra en el gate** (como `ai:smoke`); el **formateador** del documento sí tiene un test unitario
determinista (sin red) para que haya cobertura en el gate. Para las portadas se registra **solo si
Gemini devolvió imagen y su tamaño**, sin incrustar el base64. **Solo backend (tooling).** Ver el plan
[feature-64-ajustes-prompts-doc](../planes/feature-64-ajustes-prompts-doc.md).

**Criterios de aceptación**

- Dado el script `prompts:dump`, Cuando se ejecuta con `GROQ_API_KEY` y `GEMINI_API_KEY` presentes,
  Entonces recorre un conjunto **representativo** (cada tema y cada estilo al menos una vez, ambos
  idiomas ES/EN, 1-2 edades) y **no** el producto cartesiano completo.
- Dado un caso de **cuento** o **actividad**, Cuando el script lo procesa, Entonces construye el prompt
  real con `buildStoryPrompt`/`buildActivitiesPrompt`, llama a **Groq** (vía `CloudProvider`) y registra
  el **system+prompt enviados** y el **resultado real** (título+cuerpo / lista de actividades).
- Dado un caso de **portada**, Cuando el script lo procesa, Entonces construye el prompt con
  `buildImagePrompt`, llama a **Gemini** (`GeminiImageProvider`) y registra el **prompt** y si devolvió
  imagen (**ok/tamaño**, sin incrustar el base64).
- Dado que falta `GROQ_API_KEY` o `GEMINI_API_KEY`, Cuando se ejecuta el script, Entonces **aborta** con
  un mensaje claro indicando qué variable falta, y **no** se ejecuta en el gate (`pnpm check`).
- Dado el conjunto de resultados, Cuando termina el script, Entonces escribe/sobrescribe el documento
  Markdown [muestra-prompts.md](../muestra-prompts.md) con, por cada caso: combinación, system+prompt y
  resultado.
- Dado el **formateador** del documento, Cuando se ejecuta `pnpm test`, Entonces hay una prueba unitaria
  con datos deterministas en memoria (sin red) que verifica el Markdown generado.

## US-65 — Estándar de documentación de código (cabeceras + lint) · Could (Mejoras)

Como **autor del TFM / quien mantiene el código** quiero que la documentación de código siga un
**estándar uniforme y verificable** (cabecera de módulo en los ficheros que aún no la tienen y una
regla de lint que la exija a futuro), para que la cobertura de comentarios deje de depender de la
disciplina manual y el código siga siendo navegable y trazable a las historias de usuario.

**Contexto.** Una auditoría detectó que el proyecto ya sigue una **convención de facto** sólida
(cobertura ~89–90 %): cabecera de módulo `/** */` en **prosa española** con referencias a las US y a
los requisitos de cumplimiento (`C-N`); andamiaje técnico en inglés; sin TSDoc formal. Quedan **14
ficheros** sin cabecera de módulo: 4 rutas backend
([profiles](../../packages/backend/src/routes/profiles.ts),
[stories](../../packages/backend/src/routes/stories.ts),
[anonymous](../../packages/backend/src/routes/anonymous.ts),
[activities](../../packages/backend/src/routes/activities.ts)), 3 providers de IA
([CloudProvider](../../packages/backend/src/infrastructure/ai/CloudProvider.ts),
[createAIProvider](../../packages/backend/src/infrastructure/ai/createAIProvider.ts),
[OllamaProvider](../../packages/backend/src/infrastructure/ai/OllamaProvider.ts) —cabecera mal ubicada—),
la entidad [Story](../../packages/backend/src/domain/entities/Story.ts), el caso de uso
[RecommendActivities](../../packages/backend/src/application/use-cases/RecommendActivities.ts) y 5 del app
(4 pantallas + `Icon.tsx`). Además, el gate **no** valida documentación (no hay `eslint-plugin-jsdoc`).
Esta historia (a) cierra esos huecos siguiendo la convención y (b) la vuelve _enforced_ con una regla
de lint sobre exports públicos, integrada en `pnpm check`. Es **mejora de calidad/tooling** (no altera
lógica). Ver el plan [feature-76-doc-estandar](../planes/feature-76-doc-estandar.md).

**Criterios de aceptación**

- Dado cada uno de los **14 ficheros** sin cabecera de módulo, Cuando se documenta, Entonces tiene un
  bloque `/** */` **inicial** en español que describe su propósito y —cuando aplique— referencia su
  **US** y/o requisito de **cumplimiento** (`C-N`), conforme a la convención de facto.
- Dado [OllamaProvider](../../packages/backend/src/infrastructure/ai/OllamaProvider.ts), Cuando se
  ajusta, Entonces su bloque doc queda **al inicio del módulo** (no tras las interfaces).
- Dado `eslint-plugin-jsdoc`, Cuando se configura la regla `jsdoc/require-jsdoc` para **exports
  públicos** (clases, interfaces, funciones exportadas) con `publicOnly`, Entonces `pnpm lint`
  **falla** si un export público carece de bloque doc.
- Dado que la regla sería ruidosa en pruebas y código generado, Cuando se configura, Entonces se
  **excluyen** `*.test.ts`, `src/generated/**` y lo que no sea fuente propia (config, tipos triviales).
- Dado el gate `pnpm check`, Cuando se ejecuta tras la feature, Entonces pasa en **verde** (typecheck +
  lint + format:check + test) con la nueva regla activa y los 14 ficheros documentados.
- (No funcional) Dada la naturaleza del cambio, Cuando se aplica, Entonces **no se altera la lógica**:
  solo se añaden comentarios de documentación y configuración de lint; los tests existentes siguen en
  verde sin cambios de comportamiento.

## US-71 — Ajustes UX + robustez cold-start {#us-71}

**Como** usuario, **quiero** una app más robusta ante el arranque en frío del servidor y con una
navegación y un historial más cómodos, **para** una mejor experiencia.

**Prioridad:** Should · **Fase:** Mejoras · **Pantalla:** Toda la app.

**Alcance (6 ajustes)**

1. **Cold-start de Render (A1):** warm-up con reintentos + timeouts holgados (base 60 s, generación
   120 s) y aviso "esto tarda más de lo usual" tras ~6 s (`useSlowHint`) en Generador/Actividades/Dashboard.
2. **Marcar leído explícito (A2):** botón "Marcar como leído" o al terminar la narración; ya no se marca
   solo por abrir el lector.
3. **Actividades + buscador (A3):** actividades realizadas visibles en Historial y contadas en logros
   (test de regresión); búsqueda y filtros en un modal ("Buscar" con contador + "Limpiar"); título completo.
4. **Resumen de logros en Home (A4):** conseguidos/total + barra de progreso hacia Mis logros.
5. **Animaciones de entrada (A5):** wrapper `Appear` (translateY + escala) en imágenes, tarjetas y botón principal.
6. **Botón fijo a zona de adultos (A6):** en el header compartido, visible en las 4 pestañas.

**Criterios de aceptación**

- **(A1)** Dado un backend dormido, Cuando genero contenido, Entonces la petición no se aborta antes de
  ~60 s (120 s en generación) y, si tarda >6 s, aparece el aviso de espera.
- **(A2)** Dado el lector, Cuando lo abro, Entonces el cuento **no** se marca leído; Cuando pulso el
  botón o termino la narración, Entonces sí se marca leído.
- **(A3)** Dado que completo una actividad, Cuando abro el Historial, Entonces aparece; y Cuando abro
  Mis logros, Entonces cuenta para el logro de actividades. El buscador vive en un modal; "Limpiar" resetea.
- **(A4)** Dado un perfil con logros, Cuando abro Inicio, Entonces veo "conseguidos/total" con barra que
  lleva a Mis logros.
- **(A5)** Dado que entro a una pantalla, Entonces imágenes, tarjetas y el botón principal aparecen con
  una animación de entrada sin ocultar el contenido.
- **(A6)** Dado que estoy en cualquiera de las 4 pestañas, Entonces hay un botón fijo en el header que
  lleva a la zona de adultos (tras su puerta parental).

## US-72 — CI en verde (cobertura + integración + E2E + proceso) · Should (Mejoras) {#us-72}

Como **responsable técnico** quiero que el pipeline de CI esté en **verde** y que el gate local
impida volver a publicar en rojo, para que `main`/`develop` reflejen un estado realmente sano.

**Criterios de aceptación**

- Dado el job **Gate** del CI (que corre `pnpm coverage`), Cuando se ejecuta, Entonces todos los
  ficheros del tier CORE (US-35) cumplen su umbral (100%) — backend y app (`http.ts`) — sin bajar
  umbrales ni excluir código con tests reales.
- Dado el job **Integración + E2E backend** (Testcontainers), Cuando se ejecuta, Entonces pasa; en
  particular el round-trip de `PrismaActivityRepository` persiste `creadoEn` (como `Story`).
- Dado el job **E2E app** (Playwright), Cuando se ejecuta, Entonces los flujos de alta localizan los
  campos por `testID` (robusto ante cambios de nº/orden de campos), no por recuento de textbox.
- Dado el hook **pre-push**, Cuando se hace `git push`, Entonces corre `pnpm check` **y** `pnpm
coverage`, bloqueando el push si la cobertura baja del umbral (evita reincidir en CI rojo).
- (No funcional) Dado el alcance, Cuando se aplica, Entonces el comportamiento de producción no cambia
  (se simplifica `fetchWithRetry` sin alterar intentos/backoff; el resto son tests/proceso).

## US-73 — Lectura tipo libro + pulido UX · Should (Mejoras) {#us-73}

Como **niño/a** quiero **leer el cuento como un libro** (páginas que paso una a una) nada más
generarlo, y como **adulto** quiero **cerrar con claridad** el buscador del historial y que el niño
vea **sus trofeos** para motivarse.

**Criterios de aceptación**

- Dado el generador de cuentos, Cuando pulso **"Generar cuento"** y el cuento se genera, Entonces se
  **navega al lector** (`StoryReader`) y el generador ya **no** muestra el cuento en línea (queda como
  formulario). (A1)
- Dado el lector, Cuando se muestra el cuento, Entonces el cuerpo aparece **paginado** (una página a la
  vez) con **swipe horizontal** y botones **‹ / ›**, un indicador **"Página {n} de {total}"** y una
  **animación de giro** al cambiar de página (API `Animated` de RN, sin librerías nuevas). (A2)
- Dado un cuerpo de una sola línea (mock) o multipárrafo (LLM real) o vacío, Cuando se pagina, Entonces
  el paginado es robusto (nunca 0 páginas; reparte por párrafos y, si hace falta, por frases). (A2)
- Dado el **modal de búsqueda** del Historial, Cuando está abierto, Entonces muestra un botón **"X"**
  arriba a la derecha con etiqueta accesible "Cerrar" que lo cierra. (A3)
- Dado el resumen de logros de Inicio, Cuando hay logros conseguidos, Entonces se muestra una fila de
  **🏆 pequeños** (uno por logro, acotada con "+N" si hay muchos); si no hay ninguno, un **mensaje de
  ánimo**. (A4)
- (No funcional) Dado el alcance, Cuando se aplica, Entonces solo cambia `packages/app`; gate +
  cobertura (CORE/IMPORTANT US-35) + E2E siguen en verde.

## US-74 — Libro por páginas (IA) + giro 3D + Historial con pestañas · Should (Mejoras) {#us-74}

Como **niño/a** quiero **leer el cuento como un libro de verdad** (páginas que la IA ya divide, con un
**giro 3D** al pasarlas sobre hoja blanca) y **encontrar rápido** en el historial mis cuentos y mis
actividades por separado, viendo lo más reciente de cada uno al entrar.

**Criterios de aceptación**

- Dado el prompt de generación, Cuando la IA crea un cuento, Entonces devuelve el cuerpo **dividido en
  al menos 4 páginas** (párrafos separados por línea en blanco); el modo `mock` también produce ≥4
  páginas. (A1)
- Dado el lector, Cuando pagina el cuento, Entonces **respeta los cortes de página de la IA** y
  garantiza **≥4 páginas** (subdividiendo si hiciera falta); un cuerpo vacío sigue mostrando una página
  en blanco. (A1)
- Dado el lector, Cuando paso de página (‹ / › o swipe), Entonces se ve un **efecto de giro 3D**
  (`rotateY` con perspectiva, dirección según avance/retroceso) y la página se muestra sobre **fondo
  blanco tipo papel** con texto oscuro, independiente del tema. (A2)
- Dado el Historial, Cuando entro, Entonces veo arriba **"Lo último"** con el **último cuento** y la
  **última actividad**, y debajo un **toggle Cuentos / Actividades** (por defecto Cuentos) que muestra
  la lista completa del tipo elegido; la búsqueda/filtros aplican a la pestaña activa. (A3)
- (No funcional) Dado el alcance, Cuando se aplica, Entonces el cambio de prompt requiere
  **sincronizar el JSON de settings a la BD** (dev/prod, US-70) y gate + cobertura + E2E siguen en
  verde.

## US-79 — Lector con page-curl por gesto {#us-79}

> **Ajuste (lote 2 de ideas):** se refuerza el efecto de pliegue (sombra en el canto + giro/escala) siguiendo el arrastre, como aproximación de page-curl SIN Skia (se descartó `/react-native-skia`).

**Como** niño (con el adulto), **quiero** pasar página del cuento arrastrando con un giro tipo libro,
**para** que la lectura sea más natural y fluida; y que las páginas se vean del mismo tamaño.

**Prioridad:** Should · **Fase:** Mejoras · **Pantalla:** Lector de cuento.

**Alcance**

1. **`react-native-gesture-handler` + `react-native-reanimated`** (+ `react-native-worklets`):
   `BookPages` pasa página **arrastrando** con giro 3D (`rotateY` + `perspective`) en el hilo de UI,
   conservando los botones ‹ / › y el indicador. Hoja de **alto consistente** (proporcional a la
   pantalla). `App` en `GestureHandlerRootView`; `babel.config.js` con `babel-preset-expo`.
2. **Tests:** ambas libs se aliasan a stubs bajo Vitest (la navegación ‹/› sigue verificándose);
   `expo export` web validado. **Requiere dev build** (Expo Go no sirve, como desde US-66).

**Criterios de aceptación**

- **(Botones)** Dado el lector, Cuando pulso › / ‹, Entonces avanza/retrocede la página y el indicador
  se actualiza; en los extremos los botones se deshabilitan.
- **(Tamaño)** Dadas páginas de distinta longitud, Entonces la hoja mantiene un alto consistente.

## US-80 — Nombre de sección en la cabecera {#us-80}

**Como** persona usuaria, **quiero** ver el nombre de la sección en la cabecera, **para** saber en qué
pantalla estoy sin depender solo de la pestaña activa.

**Prioridad:** Should · **Fase:** Mejoras · **Pantalla:** Toda la app (pestañas).

**Alcance**

1. **`Screen`** acepta `title`, mostrado fijo arriba a la izquierda de la barra de cabecera (junto al
   botón de la zona de adultos); las 4 pestañas lo pasan reutilizando las etiquetas `tabs.*` (ES/EN).

**Criterios de aceptación**

- **(Con título)** Dada una pantalla con `title`, Entonces se muestra como cabecera (rol heading).
- **(Sin título)** Dada una pantalla sin `title`, Entonces no se muestra cabecera de sección.
