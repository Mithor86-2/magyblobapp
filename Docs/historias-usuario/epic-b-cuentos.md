# Epic B — Generación de cuentos (núcleo)

Historias: **US-03**, **US-04**, **US-05**, **US-07**, **US-22**. Volver al [índice](README.md).

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

**Contexto y cumplimiento.** La narración usa la **síntesis de voz nativa del dispositivo**
(`expo-speech` → `AVSpeechSynthesizer` en iOS, `TextToSpeech` en Android): es **on-device,
gratuita y sin SDK de terceros ni llamada externa**, por lo que **no rompe C-2/C-3/C-5** de
[cumplimiento-menores.md](../cumplimiento-menores.md) (ningún dato sale de la máquina, a
diferencia del modo `cloud`). Es **solo app** (Expo); el backend no se toca. Limitación
declarada: la voz y su calidad dependen de las voces instaladas en el SO del dispositivo.

**Criterios de aceptación**

- Dado un cuento mostrado (recién generado o abierto desde el Historial), Cuando pulso
  "▶ Leer cuento", Entonces el dispositivo narra el `cuerpo` en voz alta en el idioma del
  perfil (`es-ES` para `ES`, `en-US` para `EN`).
- Dado que la narración está en curso, Cuando pulso "⏸ Pausar" o "⏹ Parar", Entonces la
  voz se pausa/reanuda o se detiene, y el control refleja el estado actual.
- Dado que salgo de la pantalla o se desmonta el componente, Cuando ocurre, Entonces la
  narración en curso se detiene (no sigue sonando de fondo).
- Dado un dispositivo sin voz disponible para el idioma del perfil, Cuando intento narrar,
  Entonces el botón se muestra deshabilitado o avisa de forma clara, sin romper la pantalla.
- (Cumplimiento) Dado el flujo de narración por defecto, Cuando se ejecuta, Entonces toda la
  síntesis ocurre en el dispositivo, sin enviar el texto del cuento a ningún servicio externo.

**Alternativa contemplada — voz premium en la nube (ElevenLabs), opt-in OFF por defecto.**
Como mejora de calidad opcional se contempla una **segunda fuente de narración** detrás de una
interfaz `TTSProvider`, siguiendo el mismo patrón que el proveedor de IA en la nube
([US-14](epic-f-plataforma.md#us-14), [ADR 0002](../ADR/0002-tres-modos-de-ia.md)): el adulto la
activa explícitamente y queda registrada. ElevenLabs (`POST /v1/text-to-speech/{voice_id}`, modelo
`eleven_multilingual_v2`, ES/EN, salida MP3) ofrece voces mucho más naturales, pero **no es el
camino conforme por defecto** y arrastra salvedades que **deben documentarse** antes de
implementarla:

- **Rompe C-5 y es incompatible con la categoría Kids de Apple.** Para narrar hay que enviar el
  **cuerpo íntegro del cuento** a un tercero, y ese texto **contiene el nombre del niño**; a
  diferencia del modo `cloud` del LLM, **no se puede minimizar** sin romper la función.
- **Retención:** el _Zero Retention Mode_ (`enable_logging=false`) que evita que ElevenLabs
  conserve/entrene con el texto es **solo para clientes enterprise**; en free/normal tier hay
  logging/retención.
- **Coste:** servicio **de pago** (créditos por caracteres); no cumple el objetivo de "sin coste"
  que sí cubre el TTS nativo.
- **Arquitectura:** la `xi-api-key` **no puede vivir en la app** → este modo exige **proxy por el
  backend** (ruta que recibe el cuento y devuelve el audio, con la key en env como las del LLM
  cloud). Es decir, deja de ser "solo app".
- **Defecto seguro:** si el modo premium está OFF o falla, la narración cae al **`DeviceTTS`**
  nativo (mismo espíritu que el `FallbackProvider`).

Criterios de aceptación de la alternativa (si se implementa):

- Dado el modo premium **desactivado** (defecto), Cuando narro un cuento, Entonces se usa el TTS
  nativo del dispositivo y **no** se hace ninguna llamada externa.
- Dado que un adulto **activa** el modo premium tras la puerta parental, Cuando narro, Entonces el
  audio se sirve vía backend-proxy a ElevenLabs y el cambio queda en `AuditLog`.
- Dado el modo premium activo y un fallo de red/timeout/clave ausente, Cuando narro, Entonces se
  degrada automáticamente al `DeviceTTS` sin error visible para el niño.
