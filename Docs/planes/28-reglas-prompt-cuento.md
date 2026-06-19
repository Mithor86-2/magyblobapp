# Plan — Reglas narrativas del cuento / prompt maestro (US-28)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md) (Fase de mejoras). Aquí va el **cómo**.

## Contexto

US-26 ya personaliza el cuento (nombre/edad/intereses/estilo, tono por edad, formato al azar,
longitud configurable). Falta dar **reglas generales de creación de texto** (el "prompt maestro"
que pidió el usuario): estructura narrativa, tono tierno, onomatopeyas suaves, sin miedo/violencia/
peligro real y final feliz y tranquilo, con **enseñanza final**.

Qué existe ya (✅):

- ✅ `prompts.ts`: `INSTRUCCION_SEGURIDAD` (system por idioma) + plantilla por defecto + tono por
  edad + intereses + formato (US-26). Overrides en caliente desde `AppSetting`.
- ✅ Seed `AppSetting` con `prompt.story.system` / `prompt.story.template` / `prompt.story.params`.

### Decisiones (con el usuario)

- **Las reglas van en el `system` prompt**, no en la plantilla por petición: son "cómo contar"
  (aplican siempre) y así **no interfieren** con la personalización del template (US-26). La
  longitud sigue gobernada por `prompt.story.params`, no se fija aquí.
- **Precedencia del override (clave):** en `local`/`cloud`, `AppSetting.prompt.story.system`
  **sobreescribe** el default de código. Por eso hay que tocar **los dos**: `INSTRUCCION_SEGURIDAD`
  (código) **y** el seed (`prompt.story.system`). El `MockProvider` no usa prompts → sin efecto en
  `mock` (correcto).
- **Estructura condicionada por redacción:** la estructura de 6 pasos se enuncia "cuando escribas un
  cuento o una fábula…" para no forzarla en `poema`/`adivinanza`.

## Historias cubiertas

- **US-28** — Reglas narrativas del cuento (prompt maestro)
  ([épica B](../historias-usuario/epic-b-cuentos.md#us-28)). Amplía
  [US-26](../historias-usuario/epic-b-cuentos.md#us-26).

## Tareas

- [x] ✅ `prompts.ts`: `INSTRUCCION_SEGURIDAD` (ES/EN) con las reglas: tono tierno, frases cortas,
      onomatopeyas suaves, sin miedo/violencia/peligro real, final feliz y tranquilo, y estructura
      (presentación · situación · conflicto seguro · amigo que ayuda · resolución · enseñanza final)
      condicionada a cuento/fábula.
- [x] ✅ Seed `prisma/seed.ts`: el system del cuento **se retira del seed** (vive en código, por
      idioma); se quitó "conflicto seguro" y se corrigió el idioma (`{idiomaNombre}`).
- [x] ✅ Tests (`test/infrastructure/prompts.test.ts`): el `system` incluye las reglas en ES y EN, el
      override las reemplaza, idioma legible y personalización (US-26) intacta. 126 tests verdes.
- [x] ✅ Docs: CHANGELOG backend, phases.md, memory.md, modelo-datos.md, lecciones.
- [x] ✅ Verificación con cuentos reales: 10 por cloud (cumplen) + local (gemma:2b/llama3.2:3b). Fix
      de idioma; en `local` se asume español (limitación de modelos 2-3B).
- [x] ✅ Cierre `cerrar-feature`: versión backend 0.8.0 / raíz 0.11.0, CHANGELOG fechado (2026-06-19),
      docs. Pendiente solo `git flow feature finish` tras confirmación.

## DoD

El system prompt del cuento incorpora las reglas del prompt maestro (estructura, tono, onomatopeyas,
enseñanza y final feliz) en ES/EN, en código y en el seed, sin romper la personalización de US-26 ni
el contrato HTTP. `pnpm check` verde y pruebas con el usuario.
