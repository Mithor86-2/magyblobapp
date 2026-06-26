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

- [x] ✅ `AILogger` extendido con `info(meta, msg)` **opcional** (no rompe a `FallbackProvider` ni a
      sus tests con `{ warn }`).
- [x] ✅ `logger?: AILogger` inyectado en `OllamaProvider` y `CloudProvider`; pasado desde
      `createAIProvider`/`buildBase` (Ollama) y `HotSwapAIProvider.resolver` (Cloud).
- [x] ✅ Log a `info` en el punto único de cada provider (`generate`/`chat`): prompt (system+user) +
      config (op, plantilla `appsetting`/`defecto`, params, temperatura, modelo, cantidad/categoría) y
      respuesta cruda. Helper compartido `aiLog.ts` (DRY).
- [x] ✅ Tests `test/infrastructure/ai-logging.test.ts` (4 casos): prompt+config+respuesta en cuento
      (Ollama y Cloud), cantidad en actividades, y compatibilidad con `AILogger` sin `info`.
- [x] ✅ Docs: nota de desviación PII en `cumplimiento-menores.md` (C-5) y entrada en el CHANGELOG.
- [x] ✅ Gate verde (`pnpm check`). Cierre: versión (backend 0.13.0, raíz 0.17.0) + CHANGELOG fechado;
      **pendiente** pruebas con el usuario → confirmación → `finish`.

## Notas / riesgos

- **PII en logs**: a `info` el nombre del niño queda en consola por defecto (desviación asumida, TFM).
- **DRY**: el log vive en `generate`/`chat` (un sitio por provider) para no duplicar en cada método.
- No tocar el comportamiento de generación: el log es efecto lateral; la respuesta no cambia.
