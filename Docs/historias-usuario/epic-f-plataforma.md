# Epic F — Plataforma y no-funcionales

Historias: **US-06**, **US-17**, **US-18**, **US-14**, **US-15**, **US-23**, **US-24**,
**US-25**, **US-29**, **US-30**. Volver al [índice](README.md).

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
> usuario: se reintroduce el modo `cloud` como **opt-in, OFF por defecto**, conmutable en
> caliente desde BD. El defecto del proyecto sigue siendo `mock`/`local` (privacidad por
> diseño). Ver [ADR 0002](../ADR/0002-tres-modos-de-ia.md) y el plan
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
  queda OFF por defecto y que los free tiers pueden entrenar con los datos
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
