# Plan — Feature 64: ajustes post-lote nº2 (cabecera, i18n, muestra de prompts)

> Coordinación del lote en [coordinacion-mejoras-paralelo-2.md](coordinacion-mejoras-paralelo-2.md);
> alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md).

Rama: `feature/64-ajustes-prompts-doc` (worktree). Tres ajustes pequeños que rematan el lote nº2,
**sin** abrir features nuevas: un retoque de presentación en las cabeceras (US-58), una simplificación
de i18n (US-57) y un **documento de muestra de prompts** con resultados reales (US-60, tooling).

## Historias de usuario

- **US-58** (cabeceras por pantalla) — ajuste de presentación: la imagen se muestra **completa**
  (`contain`) en vez de recortada (`cover`).
- **US-57** (i18n del app) — ajuste: se **quita `expo-localization`**; el idioma lo elige el usuario y
  por defecto es `es`; la detección del idioma del dispositivo sobra.
- **US-60** (muestra de prompts, NUEVA) — documento on-demand con los **prompts reales** y sus
  **resultados** (Groq para texto, Gemini para imagen); es tooling, no entra en el gate.

## Fase 1 — Andamiaje (docs) ✅

- [x] Crear **US-60** en [../historias-usuario/epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md)
      (Gherkin, ancla `#us-60`) + fila de trazabilidad en `README.md` (Could · Mejoras · "— (tooling)" · F) + alta en el listado de épica F.
- [x] Ajustar **US-58** (nota: cabecera con imagen completa) y **US-57** (nota: sin `expo-localization`).
- [x] Escribir este plan.
- [x] Dejar `## [Unreleased]` listo en los CHANGELOG de backend y app.

## Fase 2 — Implementación ✅

### (0) Cabecera: imagen completa (US-58) ✅

- [x] En [`packages/app/src/presentation/components/Screen.tsx`](../../packages/app/src/presentation/components/Screen.tsx)
      cambiar `resizeMode="cover"` → `contain` y darle al contenedor una proporción acorde a las
      imágenes (~1000×1026, casi cuadradas) para que se vea entera y bien encuadrada, con fondo del
      theme si queda espacio.
- [x] Ajustar el test de `Screen` si hace falta.

### (1) Quitar `expo-localization` (US-57) ✅

- [x] En [`packages/app/src/i18n/index.ts`](../../packages/app/src/i18n/index.ts) eliminar el uso de
      `expo-localization`/`detectDeviceLanguage`; dejar default/fallback `es` fijo y el cambio manual
      vía `appLanguage`/selector existente.
- [x] Quitar la dependencia `expo-localization` de `package.json` (y de `app.json` plugins) y del
      lockfile (`pnpm install`).
- [x] Borrar el stub `packages/app/test/expo-localization-stub.ts` y su alias en `vitest.config.ts`.
- [x] Verificar que i18n sigue inicializando y los tests pasan.

### (2) Documento de muestra de prompts (US-60) ✅

- [x] Script on-demand `packages/backend/scripts/dump-prompts.ts` (estilo `smoke-cloud.ts`), con script
      `prompts:dump` en `packages/backend/package.json`.
- [x] Recorre un conjunto **representativo** (cada tema una vez, cada estilo una vez, ambos idiomas
      ES/EN, 1-2 edades) — no el producto cartesiano.
- [x] CUENTOS/ACTIVIDADES: construye el prompt real con `buildStoryPrompt`/`buildActivitiesPrompt` y
      obtiene el resultado real llamando a **Groq** (`CloudProvider`).
- [x] PORTADAS: construye `buildImagePrompt` y llama a **Gemini** (`GeminiImageProvider`); registra el
      prompt y si devolvió imagen (tamaño/ok, sin incrustar el base64).
- [x] Escribe `Docs/muestra-prompts.md` (sobrescribible).
- [x] Requiere `GROQ_API_KEY` y `GEMINI_API_KEY`; si faltan, aborta con mensaje claro. NO entra en el
      gate (como `ai:smoke`).
- [x] Test unitario del **formateador** del documento (datos deterministas en memoria, sin red).

## Definition of Done

- `pnpm install` + `pnpm check` verde (el script real NO se corre en el gate).
- Plan ✅, entradas en `## [Unreleased]`, docs (US) al día. Sin tocar `version` (versionado diferido).
- Sin `git flow feature finish`/merge sin confirmación.
