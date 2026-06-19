# Plan — Narración de cuentos con ElevenLabs (US-22)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md) (Fase de mejoras). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

El flujo de cuentos está completo (generar → leer → historial) pero **sin narración por voz**. La
**US-22** ya estaba especificada como mejora _Could_, con TTS nativo por defecto y ElevenLabs como
alternativa premium. El usuario decide implementarla **con ElevenLabs como motor principal**
(`ELEVENT_LABS_API` ya está en `.env`).

Qué existe ya (✅):

- ✅ `AIProvider` (dominio) + impls + `FallbackProvider`/`HotSwap`: patrón a imitar para `TTSProvider`.
- ✅ Entidad `Story` (con `cuerpo`, `idioma`) + repo Prisma + ruta `POST /stories`.
- ✅ App: `StoryGeneratorScreen` muestra el cuento; gateways HTTP segregados; `BubblyButton`/theme.

Qué falta (❌): puerto `TTSProvider`, proveedor ElevenLabs, persistencia del audio, ruta de
narración, y en la app el botón de escucha con fallback a voz nativa.

### Decisiones (con el usuario)

- **ElevenLabs principal + fallback a voz nativa del dispositivo** (`expo-speech`) si falla
  (red/timeout/clave ausente). Sin toggle opt-in/puerta parental.
- **Persistir el MP3** (tabla `StoryNarration`, 1-1 con `Story`, cascade) para reescuchar sin
  re-generar ni gastar créditos. Implica **migración Prisma** + actualizar `../modelo-datos.md`.
- **Voz** `eleven_multilingual_v2`, `voice_id` por idioma (ES/EN) configurable por env.
- **Backend como proxy** (la `xi-api-key` no vive en la app). El fallback nativo ocurre en el
  dispositivo (la voz del SO no existe en servidor).
- **Cumplimiento:** ElevenLabs envía el cuento (con el nombre del niño) a un tercero → se **desvía**
  de C-2/C-5 y de Apple Kids. Se asume (TFM) y se **documenta** en `cumplimiento-menores.md` y US-22.

## Historias cubiertas

- **US-22** — Narrar cuento en voz alta ([épica B](../historias-usuario/epic-b-cuentos.md)).

## Tareas

### F1 — Backend: vertical slice TTS (proxy + caché)

- [ ] ❌ Dominio: puerto `tts/TTSProvider.ts`, entidad `StoryNarration`, repo
      `StoryNarrationRepository`, `'cuento_narrado'` en `TIPOS_EVENTO`.
- [ ] ❌ Aplicación: caso de uso `NarrateStory` (caché → síntesis → persist → evento) + test.
- [ ] ❌ Infra: `ElevenLabsProvider` + `PrismaStoryNarrationRepository`.
- [ ] ❌ Prisma: modelo `StoryNarration` + migración `add_story_narration` + `../modelo-datos.md`.
- [ ] ❌ Config/wiring: `config.tts`, `AppDeps` (`tts`, `narrations`), `composition`, doubles.
- [ ] ❌ Ruta `GET /stories/:id/narration` (audio/mpeg) + test de integración + `.env.example`.

### F2 — App: botón de narración + fallback nativo ✅

- [x] ✅ Deps `expo-audio`, `expo-file-system`, `expo-speech` (vía `expo install`, SDK 56).
- [x] ✅ Gateway `narrationUrl(storyId)` + impl HTTP (+ test).
- [x] ✅ Hook `useNarration` (fetch → reproduce con expo-audio; fallback `Speech.speak`; limpieza).
- [x] ✅ `NarrationControls` ("▶ Escuchar/⏸/⏹") en `StoryGeneratorScreen` y `StoryReaderScreen`.
      App: 12 tests verdes, typecheck OK, bundle (`expo export`) OK.

### F3 — Docs y cumplimiento ✅

- [x] ✅ US-22 actualizada (variante implementada) + matriz de cumplimiento (C-11, desviación C-2/C-5).
- [x] ✅ `modelo-datos.md` (entidad `StoryNarration`), `phases.md`, `memory.md`, `lecciones`.

### Cierre

- [x] ✅ Gate `pnpm check` verde (118 backend + 12 app) + bundle. Falta e2e con clave real (manual).
- [ ] 🔄 Pruebas con el usuario + cierre con **cerrar-feature** (versión, CHANGELOG, merge tras
      confirmación).

## DoD

El cuento se narra con ElevenLabs (audio persistido y cacheado) y degrada a voz nativa sin error
visible para el niño; `GET /stories/:id/narration` devuelve `audio/mpeg`. `pnpm check` verde +
migración aplicada + bundle + pruebas con el usuario.
