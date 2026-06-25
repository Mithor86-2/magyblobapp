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

- [ ] ❌ `seed.ts`: `story.temperature` 0.8→0.7; `prompt.story.params` 50/120 → 150/200; **eliminar**
      la entrada `prompt.story.template`.
- [ ] ❌ Default de código de temperatura 0.8→0.7 en `OllamaProvider` y `CloudProvider`.
- [ ] ❌ Reforzar `instruccionFormato` (ES/EN) en `prompts.ts`: "al menos {min} palabras (entre {min}
      y {max} palabras), en varios párrafos, sin quedarte corto".
- [ ] ❌ Migración de datos: cargar `story.temperature` y `prompt.story.params` al arrancar
      (`ON CONFLICT DO NOTHING`, como la de `ai.cloud`), para que un `docker compose up` en limpio
      quede con los nuevos defaults sin correr el seed.
- [ ] ❌ Tests: ajustar/añadir en `prompts.test.ts` (el refuerzo mantiene el substring esperado);
      verificar gate.
- [ ] ❌ Docs: CHANGELOG backend. Cierre con versión (backend minor) y `cerrar-feature`
      (**detener antes del `finish`** para confirmación).

## Notas

- La BD del usuario ya tiene estos valores (hot). La migración usa `DO NOTHING`, así que no los pisa.
- No se toca el modelo de datos (sin cambios de esquema). `prompt.story.template` sigue siendo
  configurable por un adulto; solo se deja de **sembrar** por defecto.
