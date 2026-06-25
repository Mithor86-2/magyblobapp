# Plan — Feature 35: log de los prompts de IA y su configuración (US-34)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Rama: `feature/35-log-prompts-ia` (desde `develop`). Historia: **US-34**. Solo backend.

## Contexto

Qué hay ya (✅) y qué falta (❌):

- ✅ Prompts construidos en `buildStoryPrompt`/`buildActivitiesPrompt` (`infrastructure/ai/prompts.ts`).
- ✅ Config resuelta en `OllamaProvider`/`CloudProvider` (`leerOverrides`, `leerStoryParams`,
  `leerTemperatura`) desde `AppSetting` con defaults en código.
- ✅ Logger pino cableado: `server.ts` inyecta `{ info, warn }` a `buildProductionDeps`.
- ❌ `AILogger` (en `FallbackProvider.ts`) solo declara `warn`; **no** `info`.
- ❌ El logger **solo** llega a `FallbackProvider`, **no** a `OllamaProvider`/`CloudProvider`.
- ❌ No se loguea el prompt, su configuración ni la respuesta del LLM.

Decisiones tomadas con el usuario (2026-06-23):

- Loguear a **nivel `info`** (siempre visible): config + prompt completo (system + user) + **respuesta**
  del LLM, para cuentos y actividades.
- **Desviación de PII asumida** (el prompt lleva el nombre del niño) → documentar en
  `cumplimiento-menores.md` (C-5). En real se bajaría a `debug` o se redactaría.
- Solo `OllamaProvider` y `CloudProvider` (el `MockProvider` no construye prompts).

## Historias cubiertas

- US-34 — Observabilidad: log de los prompts de IA y su configuración
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-34))

## Tareas

- [ ] ❌ Extender `AILogger` (`FallbackProvider.ts`) con `info(meta, msg)` **opcional** (no rompe a
      `FallbackProvider` ni a sus tests con `{ warn }`). Añadir `info` al `NO_OP_LOGGER`.
- [ ] ❌ Inyectar `logger?: AILogger` en `OllamaProvider` y `CloudProvider` (opciones del constructor);
      pasarlo desde `createAIProvider`/`buildBase` (Ollama) y `HotSwapAIProvider.resolver` (Cloud).
- [ ] ❌ Loguear a `info` en el punto único de cada provider (`generate`/`chat`), que tiene system +
      prompt + temperatura + modelo + respuesta: un log con el **prompt** (system, user) y la **config**
      (op, plantilla `appsetting`/`defecto`, params, temperatura, modelo, cantidad) y otro con la
      **respuesta** cruda. Pasar el `op`/config como parámetro desde `generateStory`/`recommendActivities`.
- [ ] ❌ Tests (`test/infrastructure/`): verificar que con `local`/cloud y un `AILogger` con
      `info: vi.fn()` se registra el prompt + config + respuesta en cuento y actividades; y que `mock`
      no loguea prompt.
- [ ] ❌ Docs: nota de desviación PII en `cumplimiento-menores.md` (C-5); entrada en
      `packages/backend/CHANGELOG.md` (`## [Unreleased]`).
- [ ] ❌ Gate verde (`pnpm check`) y cierre con `cerrar-feature` (versión + CHANGELOG fechado + docs;
      **detener antes del `finish`** para confirmación del usuario).

## Notas / riesgos

- **PII en logs**: a `info` el nombre del niño queda en consola por defecto (desviación asumida, TFM).
- **DRY**: el log vive en `generate`/`chat` (un sitio por provider) para no duplicar en cada método.
- No tocar el comportamiento de generación: el log es efecto lateral; la respuesta no cambia.
