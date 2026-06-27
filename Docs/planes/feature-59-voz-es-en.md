# Plan — Feature 59: Voz ES/EN de la narración (US-55)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md); coordinación del lote en
> [coordinacion-mejoras-paralelo-2.md](coordinacion-mejoras-paralelo-2.md) (F3). Aquí va el **cómo**.
>
> Rama: `feature/59-voz-es-en` (desde `develop`). Historia: **US-55** (épica B, cuentos; amplía
> [US-22](../historias-usuario/epic-b-cuentos.md#us-22)). Capa: **solo backend**.

## Contexto

Qué existe ya (✅):

- ✅ **Narración con ElevenLabs + fallback a voz nativa** (US-22): caso de uso `NarrateStory`, ruta
  `GET /stories/:id/narration`, proveedor
  [ElevenLabsProvider.ts](../../packages/backend/src/infrastructure/tts/ElevenLabsProvider.ts) detrás
  del puerto [TTSProvider](../../packages/backend/src/domain/tts/TTSProvider.ts). Si la síntesis
  falla, el caso de uso propaga el error y la app degrada a `expo-speech`.
- ✅ **Voz por idioma en infraestructura**: [config.ts](../../packages/backend/src/config.ts) resuelve
  `tts.voiceIdByLang` (`{ es, en }`) desde `ELEVENLABS_VOICE_ID_ES`/`_EN` con defaults _premade_
  multilingües; el proveedor selecciona `voiceIdByLang[input.idioma]` por petición.
- ✅ **Config validada con Zod** (US-46) y rutas Fastify con Zod (US-44).

Qué falta (❌):

- ❌ Las variables `ELEVENLABS_VOICE_ID_ES`/`_EN` están **sin documentar**: el `.env.example` no
  explica cómo obtener un `voice_id` ni qué voz _premade_ se usa por defecto en cada idioma.
- ❌ No hay forma de **consultar** qué voces tiene configuradas el backend sin leer el código/env.
- ❌ El proveedor **no tiene test** de la selección de voz por idioma.

### Decisiones tomadas

- **No cambia el contrato ni el modelo de datos.** Las voces ya se resuelven por idioma; esta feature
  las hace **claras y configurables** (docs + nombres/comentarios) y añade observabilidad.
- **Defaults _premade_ multilingües:** ES → _George_ (`JBFqnCBsd6RMkjVDRZzb`), EN → _Rachel_
  (`21m00Tcm4TlvDq8ikWAM`). Ambas funcionan con `eleven_multilingual_v2`; se pueden sobreescribir por
  env con cualquier `voice_id` de la cuenta (panel de ElevenLabs → _Voices_, o API `GET /v2/voices`).
- **Endpoint `GET /settings/tts/voices` (incluido):** expone la voz configurada por idioma + modelo +
  si hay clave (`hasApiKey: boolean`), **sin** revelar la `xi-api-key` ni llamar a ElevenLabs (sin
  red, sin coste, sin fuga del secreto). Lectura simple sobre `config.tts`.
- **Fallback intacto.** No se toca el flujo de degradación a voz nativa.

## Fase 1 — Andamiaje (docs) ✅

- ✅ US-55 en [epic-b-cuentos.md](../historias-usuario/epic-b-cuentos.md#us-55) (Gherkin; amplía US-22)
  y listado de historias de la épica B.
- ✅ Fila de trazabilidad en [historias-usuario/README.md](../historias-usuario/README.md)
  (Could · Mejoras · Narración · B).
- ✅ Este plan.
- ✅ `## [Unreleased]` en [packages/backend/CHANGELOG.md](../../packages/backend/CHANGELOG.md).

## Fase 2 — Implementación

- ✅ **Documentar las variables de voz** en [.env.example](../../.env.example): cómo obtener un
  `voice_id`, qué voz _premade_ se usa por defecto en ES/EN, y que ambas son multilingües.
- ✅ **Claridad en `config.ts`:** nombrar/comentar los defaults ES/EN (voz + por qué multilingüe).
- ✅ **Endpoint `GET /settings/tts/voices`** (ruta nueva `routes/settings.ts`, registrada en
  `server.ts`) que devuelve `{ model, hasApiKey, voices: { es, en } }` desde `config.tts`. Con test
  de integración.
- ✅ **Test del proveedor TTS:** `ElevenLabsProvider.test.ts` co-localizado — verifica que la voz
  enviada a ElevenLabs depende del `input.idioma` (ES usa la voz ES, EN la voz EN) y que la clave
  ausente lanza (conserva el fallback).

## Definition of Done

- `pnpm check` verde (typecheck + lint + format + test).
- US-55 + trazabilidad actualizadas; cumplimiento ya documentado en US-22 (sin red nueva: el endpoint
  no llama a ElevenLabs).
- Entradas en `## [Unreleased]` del CHANGELOG de backend (versión diferida).
- Pruebas con el usuario antes del cierre; `finish`/merge solo tras confirmación explícita.
