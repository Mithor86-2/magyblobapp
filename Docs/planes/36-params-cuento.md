# Plan — Feature 36: parámetros del cuento por defecto (temp 0.7, 150–200 palabras)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo**.
>
> Rama: `feature/36-params-cuento` (desde `develop`). Historias: **US-18** (config editable de
> prompts/IA) y **US-28** (reglas narrativas del prompt). Solo backend.

## Contexto

Origen: el usuario pidió bajar la temperatura a 0.7 y poner los cuentos en 150–200 palabras. Al
mirarlo (gracias al log de US-34) se vio que un `prompt.story.template` **seedeado antiguo**
hardcodeaba "4 a 6 frases" e **ignoraba** `prompt.story.params`. La BD del usuario ya se ajustó en
caliente (temp 0.7, params 150–200, plantilla vieja eliminada). Falta dejarlo como **default del
proyecto** y **reforzar la instrucción de longitud** (el LLM se quedaba corto: 85 palabras pidiendo
150–200).

## Decisiones (con el usuario)

- Defaults del proyecto: `story.temperature=0.7`, `prompt.story.params={palabrasMin:150,
palabrasMax:200,rima:false,formatos:[cuento,fabula,poema]}`.
- **Quitar `prompt.story.template` del seed**: el default de código (que sí respeta params, intereses,
  tono y formato) es mejor; la plantilla seedeada era un resto que hardcodeaba la longitud.
- **Reforzar la instrucción de longitud** en `prompts.ts` para subir el cumplimiento del LLM,
  manteniendo el substring `entre {min} y {max} palabras` (lo asertan los tests).

## Tareas

- [x] ✅ `seed.ts`: `story.temperature` 0.8→0.7; `prompt.story.params` 50/120 → 150/200; eliminada la
      entrada `prompt.story.template`.
- [x] ✅ Default de código de temperatura 0.8→0.7 en `OllamaProvider` y `CloudProvider`.
- [x] ✅ `instruccionFormato` (ES/EN) reforzada en `prompts.ts` ("al menos {min} palabras…").
- [x] ✅ Migración `20260623010000_params_cuento_por_defecto` (`ON CONFLICT DO NOTHING`); verificada
      con la integración (`migrate deploy`, 25/25).
- [x] ✅ Tests verdes (`prompts.test.ts` mantiene el substring; gate completo en verde).
- [x] ✅ CHANGELOG + versión (backend 0.14.0, raíz 0.18.0). **Pendiente**: confirmación del usuario →
      `finish`.

## Notas

- La BD del usuario ya tiene estos valores (hot). La migración usa `DO NOTHING`, así que no los pisa.
- No se toca el modelo de datos (sin cambios de esquema). `prompt.story.template` sigue siendo
  configurable por un adulto; solo se deja de **sembrar** por defecto.
