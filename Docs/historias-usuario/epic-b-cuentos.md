# Epic B — Generación de cuentos (núcleo)

Historias: **US-03**, **US-04**, **US-05**, **US-07**, **US-22**, **US-26**, **US-28**, **US-47**, **US-54**, **US-55**, **US-59**.
Volver al [índice](README.md).

## US-03 — Generar cuento personalizado · Must

Como **niño/a** (con ayuda del tutor) quiero generar un cuento eligiendo tema y estilo
para escuchar una historia hecha para mí.

**Criterios de aceptación**

- Dado un perfil seleccionado, un tema (del vocabulario único
  `animales | espacio | magia | aventuras | música`, pre-seleccionado por los intereses
  del perfil) y un estilo (`aventura | divertido | educativo`), Cuando pulso "Generar
  cuento", Entonces se muestra un cuento con título y cuerpo en el idioma del perfil.
- Dado que la generación está en curso, Cuando espero, Entonces veo un estado de carga
  ("Invocando a las hadas escritoras…") y la UI no se bloquea.
- Dado el caso de uso de generación, Cuando se invoca, Entonces delega en la interfaz
  `AIProvider.generateStory({ perfil, tema, estilo })` y nunca depende de una
  implementación concreta (Clean Architecture, [ADR 0001](../ADR/0001-arquitectura-limpia-monorepo.md)).
- (Mock, Fase 2) Dado `AI_PROVIDER=mock`, Cuando genero un cuento, Entonces recibo un
  resultado determinista y válido sin necesidad de Ollama.

## US-04 — Fallback automático a mock · Must

Como **evaluador** quiero que el sistema no se rompa si el LLM no responde para poder
ejecutar la demo sin GPU ni modelo descargado.

**Criterios de aceptación**

- Dado `AI_PROVIDER=local` y Ollama caído o sin responder en el timeout, Cuando se
  solicita un cuento, Entonces el sistema degrada automáticamente a `MockProvider` y
  devuelve un resultado válido.
- Dado el fallback, Cuando ocurre, Entonces se registra en logs (pino) sin exponer un
  error al usuario final.

## US-05 — Modo de IA configurable por entorno · Must

Como **desarrollador/evaluador** quiero seleccionar el modo de IA por variable de
entorno para alternar mock / local sin tocar código.

**Criterios de aceptación**

- Dado `AI_PROVIDER ∈ {mock, local}`, Cuando arranca el backend, Entonces se instancia el
  proveedor correspondiente ([ADR 0002](../ADR/0002-tres-modos-de-ia.md)).
- Dado un valor ausente o inválido, Cuando arranca, Entonces se usa `mock` por defecto.

## US-07 — Guardar / marcar cuento · Should

Como **padre/tutor** quiero guardar un cuento generado para volver a leerlo después.

**Criterios de aceptación**

- Dado un cuento generado, Cuando lo marco (bookmark), Entonces se persiste asociado
  al perfil y aparece en el Historial con fecha y estado `nuevo`.
- Dado un cuento ya leído, Cuando lo abro de nuevo, Entonces su estado pasa a `leído`.

## US-22 — Narrar cuento en voz alta · Could (Mejoras)

Como **niño/a no-lector** (de 2 a 6 años) quiero que el cuento se lea en voz alta para
poder disfrutarlo sin saber leer todavía.

**Implementación (decidida con el usuario): voz premium ElevenLabs como motor principal, con
fallback a voz nativa.** La narración se sirve desde el backend (que actúa de **proxy** a
ElevenLabs: `POST /v1/text-to-speech/{voice_id}`, modelo `eleven_multilingual_v2`, voz por idioma
ES/EN, salida MP3). El app pide `GET /stories/:id/narration` y reproduce el audio con `expo-audio`.
El MP3 se **persiste** (`StoryNarration`, 1-1 con `Story`) y se cachea: se sintetiza una sola vez
por cuento. Si la síntesis falla (red/timeout/clave ausente o backend caído), el app **degrada a la
voz nativa del dispositivo** (`expo-speech` → `AVSpeechSynthesizer`/`TextToSpeech`) sin error
visible para el niño. La `xi-api-key` vive solo en el backend (env `ELEVENT_LABS_API`).

> **Desviación de cumplimiento (asumida, TFM).** A diferencia del resto de la app, narrar con
> ElevenLabs **envía el cuerpo íntegro del cuento —que contiene el nombre del niño— a un tercero en
> la nube**, lo que **se desvía de C-2/C-5** de [cumplimiento-menores.md](../cumplimiento-menores.md)
> y de la categoría _Kids_ de Apple, y **no es minimizable** sin romper la función. Además es de
> pago (créditos por caracteres) y, fuera de tier enterprise, ElevenLabs puede registrar/entrenar
> con el texto. Se asume conscientemente en el contexto académico del TFM y queda **documentado**;
> el fallback a voz nativa mitiga el caso de clave ausente/sin red. Ver matriz de cumplimiento.

**Criterios de aceptación**

- Dado un cuento mostrado (recién generado o abierto desde el Historial), Cuando pulso
  "▶ Escuchar", Entonces se narra el `cuerpo` en voz alta en el idioma del perfil (voz ElevenLabs
  por defecto; `es-ES`/`en-US` en el fallback nativo).
- Dada una narración ya sintetizada, Cuando se vuelve a pedir, Entonces se sirve del audio
  **cacheado** (sin re-sintetizar ni gastar créditos).
- Dado que la narración está en curso, Cuando pulso "⏸ Pausar" o "⏹", Entonces la voz se
  pausa/reanuda o se detiene, y el control refleja el estado actual.
- Dado que salgo de la pantalla o se desmonta el componente, Cuando ocurre, Entonces la narración
  en curso se detiene (no sigue sonando de fondo).
- Dado un fallo de ElevenLabs (red/timeout/clave ausente), Cuando intento narrar, Entonces se
  degrada automáticamente a la **voz nativa** del dispositivo sin error visible para el niño.
- (Privacidad) Dado que se narra con ElevenLabs, Cuando se ejecuta, Entonces el texto del cuento
  sale del dispositivo hacia un tercero (desviación documentada arriba); el resto de la app
  mantiene los datos en local.

## US-55 — Voz de la narración por idioma (ES/EN) · Could (Mejoras)

Como **padre/tutor** quiero poder elegir y configurar **qué voz** narra los cuentos en español y en
inglés para que el timbre se ajuste al gusto de mi hijo/a y suene natural en cada idioma.

**Contexto.** Amplía la narración de **[US-22](#us-22)** (motor ElevenLabs con fallback a voz
nativa). La selección de voz por idioma **ya existe** en infraestructura: el backend resuelve un mapa
`voiceIdByLang` (`{ es, en }`) y el `ElevenLabsProvider` envía la petición a
`POST /v1/text-to-speech/{voice_id}` con la voz del idioma del cuento. Esta historia hace esa voz
**clara y configurable**: documenta y deja explícitas las variables `ELEVENLABS_VOICE_ID_ES` /
`ELEVENLABS_VOICE_ID_EN` (cómo obtener un `voice_id` en ElevenLabs y qué voz _premade_ multilingüe se
usa por defecto en cada idioma), y expone qué voces tiene configuradas el backend
(`GET /settings/tts/voices`, sin exponer la `xi-api-key`). El fallback a la voz nativa del dispositivo
(`expo-speech`) se conserva intacto: si la síntesis falla o falta la clave, la app narra igual.

**Criterios de aceptación**

- Dado un cuento en **español**, Cuando se narra con ElevenLabs, Entonces se usa la voz de
  `ELEVENLABS_VOICE_ID_ES` (si está vacía, la voz _premade_ multilingüe por defecto en español).
- Dado un cuento en **inglés**, Cuando se narra con ElevenLabs, Entonces se usa la voz de
  `ELEVENLABS_VOICE_ID_EN` (si está vacía, la voz _premade_ multilingüe por defecto en inglés).
- Dado un `voice_id` configurado por env para un idioma, Cuando se narra en ese idioma, Entonces la
  petición a ElevenLabs usa **ese** `voice_id` (la voz es configurable sin tocar código).
- Dado el backend en marcha, Cuando se consulta `GET /settings/tts/voices`, Entonces devuelve la voz
  configurada por idioma (ES/EN) y el modelo, **sin** revelar la `xi-api-key`.
- Dado un fallo de síntesis o clave ausente, Cuando se intenta narrar, Entonces se conserva el
  **fallback a la voz nativa** del dispositivo (sin regresión respecto a US-22).
- (Privacidad) Igual que US-22: narrar con ElevenLabs envía el texto del cuento a un tercero
  (desviación ya documentada); el endpoint de voces no envía datos del niño a la nube.

## US-26 — Contenido más personalizado por niño · Should (Mejoras)

Como **padre/tutor** quiero que los cuentos y actividades usen de forma explícita el **nombre**, la
**edad** y los **intereses** de mi hijo/a para que se note que el contenido es para él/ella.

**Contexto.** Los prompts (`prompts.ts` / `AppSetting`) ya reciben el perfil, pero conviene afinar:
tono y dificultad según la **edad** (2-3 muy simple; 5-6 algo más rico) y temática según los
**intereses**. Afecta a cuentos (épica B) y actividades (épica C); se verifica en `mock` y `local`.
**Solo backend** (prompts); el contrato HTTP no cambia.

**Criterios de aceptación**

- Dado un perfil con nombre, edad e intereses, Cuando se genera un cuento, Entonces el prompt
  incluye explícitamente esos datos para personalizar el contenido.
- Dada la edad del perfil, Cuando se construye el prompt, Entonces ajusta el tono/longitud/dificultad
  por tramo de edad (p. ej. frases más cortas para 2-3 años).
- Dados los intereses del perfil, Cuando se recomiendan actividades sin categoría fija, Entonces el
  prompt los tiene en cuenta para proponer algo afín.
- (No funcional) Dado el cambio de prompts, Cuando se ejecuta el gate, Entonces los tests de
  `mock`/`local` siguen en verde y la salida estructurada se mantiene parseable.

## US-28 — Reglas narrativas del cuento (prompt maestro) · Should (Mejoras)

Como **padre/tutor** quiero que los cuentos sigan una **estructura narrativa clara y un tono
adecuado** para niños de 2 a 5 años, para que tengan principio-nudo-desenlace, una pequeña
enseñanza y un final feliz, además de la personalización que ya existe.

**Contexto.** Amplía [US-26](#us-26): además de personalizar con nombre/edad/intereses/estilo, el
prompt del cuento incorpora **reglas generales de creación de texto** (el "prompt maestro"):
estructura en pasos, onomatopeyas suaves, ausencia de miedo/violencia/peligro real y final feliz y
tranquilo. **Solo backend** (`prompts.ts`; el system vive en código **por idioma**, no en el seed);
el contrato HTTP no cambia. Afecta a `local`/`cloud` (el `MockProvider` no usa prompts). La
**longitud** sigue gobernada por `prompt.story.params` (US-26), no se fija en el prompt maestro.

> **Limitación verificada (local):** las reglas y el idioma se cumplen plenamente en `cloud`
> (Groq 70B). En `local` con modelos pequeños (`gemma:2b`, `llama3.2:3b`) el cuento sale **en
> español** aunque el perfil sea `en` (no siguen bien la instrucción de idioma); se asume que el
> inglés y la calidad plena son cosa de `cloud`.

**Criterios de aceptación**

- Dado que se genera un cuento (formato `cuento`/`fábula`), Cuando se construye el prompt, Entonces
  pide una **estructura**: presentación del personaje, situación inicial, un amigo que ayuda,
  resolución positiva y una **enseñanza final**.
- Dado el prompt del cuento, Cuando se construye, Entonces pide **tono tierno** y **onomatopeyas
  suaves** y prohíbe miedo, violencia o peligro real, con **final feliz y tranquilo**.
- Dado un perfil en inglés, Cuando se construye el prompt con plantilla configurable, Entonces el
  idioma se expresa de forma legible (`{idiomaNombre}` → "inglés"/"español"), de modo que el cuento
  se escribe en el idioma del perfil.
- Dada la personalización de US-26, Cuando se aplica el prompt maestro, Entonces se **mantienen**
  nombre, edad, intereses y estilo, y la longitud configurable (`palabrasMin/Max`).
- (No funcional) Dado el cambio de prompts, Cuando se ejecuta el gate, Entonces los tests de
  `mock`/`local` siguen en verde y la salida estructurada (`titulo`/`cuerpo`) se mantiene parseable.

## US-47 — Cuentos mejorados: multi-tema/estilo, prompt más rico y mayor longitud · Should (Mejoras)

Como **niño/a** (con ayuda del tutor) quiero poder elegir **más de un tema y más de un estilo** al
generar un cuento, y que el cuento sea más **divertido y desarrollado** (más largo), para tener
historias más variadas y entretenidas.

**Contexto.** Amplía [US-03](#us-03) (hoy la generación elige **un solo** tema y **un solo** estilo)
y [US-28](#us-28) (reglas narrativas del prompt maestro). Combina dos mejoras del lote post-HITO 2
(2.4 multi-selección + 2.6 prompt más dinámico/largo); ambas reescriben el pipeline de cuentos, por
lo que van **en una sola feature** (ver [coordinación del lote](../planes/coordinacion-mejoras-paralelo.md),
F-B). Toca **backend** (ruta `routes/stories.ts`, `GenerateStoryInput`, `buildStoryPrompt`,
parámetros en `storyParams.ts` + seed `prompt.story.params`) y **app** (`StoryGeneratorScreen` con
chips de selección múltiple). Se diseña **sin migración Prisma** (decisión anti-conflicto del lote):
el cuento sigue persistiendo en las columnas actuales de `Story` (un `tema`/`estilo` representativo),
no se añaden columnas. Afecta a `local`/`cloud` en la calidad del texto; el `MockProvider` mantiene
una salida determinista válida.

**Criterios de aceptación**

- Dado un perfil seleccionado, Cuando abro el generador, Entonces puedo seleccionar **uno o varios**
  temas (del vocabulario `animales | espacio | magia | aventuras | musica`, pre-seleccionados por
  los intereses del perfil) y **uno o varios** estilos (`aventura | divertido | educativo`) mediante
  chips de selección múltiple.
- Dado que selecciono varios temas y/o estilos, Cuando pulso "Generar cuento", Entonces la petición
  envía **arrays** (`temas`, `estilos`) al backend y el cuento combina lo elegido en una sola
  historia coherente.
- Dado que no selecciono ningún tema o ningún estilo, Cuando intento generar, Entonces la UI me pide
  elegir al menos uno (no se envía una lista vacía) y el backend rechaza la entrada vacía.
- Dado el caso de uso de generación, Cuando se invoca, Entonces delega en
  `AIProvider.generateStory({ perfil, temas, estilos })` (interfaz `GenerateStoryInput` con arrays) y
  nunca depende de una implementación concreta (Clean Architecture).
- Dado el prompt del cuento, Cuando se construye en `buildStoryPrompt`, Entonces interpola la **lista
  legible** de temas y de estilos (p. ej. "sobre animales y magia, con un estilo divertido y
  educativo") y mantiene las reglas narrativas de US-28 (estructura, tono tierno, onomatopeyas, final
  feliz) y la personalización de US-26 (nombre, edad, intereses, tono por edad).
- Dado el prompt mejorado, Cuando se genera, Entonces el cuento tiene **más desarrollo narrativo**:
  el límite de palabras (`palabrasMax` en `storyParams.ts` y el seed `prompt.story.params`) se sube
  respecto al valor actual, y el prompt pide explícitamente extenderse sin quedarse corto.
- Dado el diseño sin migración, Cuando se persiste el cuento, Entonces se guarda en las columnas
  actuales de `Story` (un `tema`/`estilo` representativo de la selección), **sin** columnas nuevas ni
  migración Prisma.
- (Mock) Dado `AI_PROVIDER=mock`, Cuando genero un cuento con varios temas/estilos, Entonces recibo
  un resultado determinista y válido sin Ollama.
- (No funcional) Dado el cambio de pipeline y prompts, Cuando se ejecuta el gate, Entonces los tests
  (caso de uso, endpoint, gateway de la app y `mock`/`local`) siguen en verde y la salida
  estructurada (`titulo`/`cuerpo`) se mantiene parseable.

## US-54 — Contenido IA: títulos variados, instrucciones de actividad y temas completos · Should (Mejoras)

Como **padre/tutor** quiero que los cuentos tengan **títulos variados** (no siempre la misma
plantilla), que las actividades incluyan **instrucciones paso a paso** y que el generador ofrezca
**todos los temas** disponibles, para que el contenido se sienta más rico y la app no oculte
opciones.

**Contexto.** Tres mejoras que comparten el pipeline de IA (`prompts.ts`, `MockProvider`) y el
esquema Prisma, por lo que van en una sola feature (ver [coordinación del lote nº 2](../planes/coordinacion-mejoras-paralelo-2.md),
F2). **Afecta también a la épica C** (actividades): se añade el campo de dominio
`Activity.instrucciones` (migración Prisma) que recorre entidad → `parseResponse` → DTO → mapper →
`RecommendActivities`, y el `MockProvider` lo rellena. En la app, `ActivityCard` muestra las
instrucciones y el botón **"Realizado"** pasa a un color de acento propio. El **fix de temas** vive
en `StoryGeneratorScreen` (la lista hoy se limita a los intereses del perfil). Toca **backend** y
**app**; el contrato HTTP del cuento no cambia (solo añade `instrucciones` a la actividad).

**Criterios de aceptación**

- **(Títulos variados)** Dado un perfil, Cuando genero varios cuentos con temas distintos en modo
  `mock`, Entonces los títulos varían (no siempre `"{nombre} y la aventura de {tema}"`).
- **(Títulos variados)** Dado el prompt del cuento (ES/EN), Cuando se construye, Entonces pide
  explícitamente **variar el título** en cada generación.
- **(Instrucciones)** Dado un perfil, Cuando se recomiendan actividades, Entonces cada actividad
  incluye un campo `instrucciones` con un **paso a paso**, y el prompt de actividades lo solicita.
- **(Instrucciones · mock)** Dado `AI_PROVIDER=mock`, Cuando pido actividades, Entonces el conjunto
  determinista incluye `instrucciones` válidas.
- **(Instrucciones · persistencia)** Dado el campo nuevo, Cuando se persiste una actividad, Entonces
  `instrucciones` se guarda en una columna `NULL`-able de `activities` (migración Prisma, sin romper
  filas existentes).
- **(Instrucciones · app)** Dada una actividad con instrucciones, Cuando la veo en `ActivityCard`,
  Entonces se muestran; y el botón **"Realizado"** usa un **color de acento** propio del theme.
- **(Temas)** Dado el generador de cuentos, Cuando lo abro, Entonces puedo elegir entre **todos** los
  temas del vocabulario (`animales | espacio | magia | aventuras | musica`) con los **intereses** del
  perfil **pre-seleccionados** (antes faltaban magia y música).
- (No funcional) Dado el cambio de pipeline, prompts, schema y app, Cuando se ejecuta el gate,
  Entonces los tests (caso de uso, prompt, ruta de integración y componente de la app) siguen en
  verde y la salida estructurada se mantiene parseable.

## US-59 — Portadas de imagen de cuentos y actividades · Could (Mejoras)

Como **niño/a** (con ayuda del tutor) quiero ver una **portada ilustrada** en mis cuentos y
actividades, para que la experiencia sea más visual y atractiva aunque todavía no sepa leer.

**Contexto.** Mejora del lote nº 2 (ver [coordinación del lote nº 2](../planes/coordinacion-mejoras-paralelo-2.md),
F7). **Afecta también a la épica C** (actividades): el dato de imagen recorre dos entidades
(`Story.portada`, `Activity.imagen`), por eso la historia vive en la épica B pero su criterio de
actividades se verifica también en C. El diseño tiene **dos piezas**:

1. **La app SIEMPRE muestra una portada, con cero latencia.** Prefiere la imagen generada
   (`story.portada` / `activity.imagen`) si existe; si no, usa un **respaldo local empaquetado**
   (`assets/images/story/<tema>.png`, mapa estático por tema con un `default`), igual que las
   cabeceras de F6 (selección por nombre, sin lógica extra). Se renderiza en `StoryReaderScreen`, en
   el generador (`StoryGeneratorScreen`) y en `ActivityCard`.
2. **Generación opcional con Gemini/Imagen (backend, best-effort).** La interfaz `AIProvider` gana
   `generateImage(prompt)`; el adaptador **Gemini/Imagen** (infraestructura) usa `GEMINI_API_KEY`
   (`config.cloudApiKeys.gemini`). El prompt se construye con **tema/estilo/título**, **nunca** con
   el nombre del niño. La generación es **best-effort**: no bloquea ni rompe la creación del cuento;
   si falla o no hay clave, el campo queda `null` y la app cae al respaldo local. Almacenamiento
   simple: data URL / base64 en el campo (sin bucket; migrable después).

> **Desviación de cumplimiento (asumida, TFM).** Generar la portada con Gemini envía a un tercero el
> **tema/estilo/título** (sin nombre del niño ni identificadores), lo que se desvía de C-5 igual que
> el modo `cloud` del LLM. **Sin `GEMINI_API_KEY` no se genera nada**: la app usa solo el respaldo
> local empaquetado (privacidad por diseño, sin red). Ver
> [cumplimiento-menores.md](../cumplimiento-menores.md) (C-5).

**Criterios de aceptación**

- Dado un cuento mostrado (recién generado o abierto desde el Historial), Cuando se pinta, Entonces
  muestra una **portada**: la imagen generada (`portada`) si existe, o el **respaldo local por tema**
  en caso contrario; nunca se queda sin imagen.
- Dada una actividad en `ActivityCard`, Cuando se pinta, Entonces muestra una imagen análoga
  (`imagen` generada o respaldo local por categoría/tema), respetando el layout y las cabeceras de F6.
- Dado el caso de uso de generación, Cuando se invoca, Entonces delega en
  `AIProvider.generateImage(prompt)` y nunca depende de una implementación concreta (Clean
  Architecture); el adaptador Gemini/Imagen vive en infraestructura.
- Dado el prompt de imagen, Cuando se construye, Entonces se forma con **tema/estilo/título** y
  **nunca** incluye el nombre del niño ni datos identificativos.
- Dado que la generación de imagen **falla** (error de red, HTTP, respuesta inválida) o **no hay
  `GEMINI_API_KEY`**, Cuando se crea el cuento/actividad, Entonces la creación **se completa igual**
  (el campo `portada`/`imagen` queda `null`) y la app muestra el respaldo local (best-effort, no
  bloquea ni rompe).
- Dado el campo nuevo, Cuando se persiste un cuento/actividad, Entonces `portada`/`imagen` se guarda
  en una columna `NULL`-able (migración Prisma, sin romper filas existentes).
- (No funcional) Dado el cambio de interfaz, adaptador, schema y app, Cuando se ejecuta el gate,
  Entonces los tests (adaptador de imagen con mock sin red, fallback de selección por tema en la app,
  y creación de cuento que no rompe si la imagen falla) siguen en verde.
