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
