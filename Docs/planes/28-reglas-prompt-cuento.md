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

- [ ] ❌ `prompts.ts`: enriquecer `INSTRUCCION_SEGURIDAD` (ES/EN) con las reglas: tono tierno, frases
      cortas, onomatopeyas suaves, sin miedo/violencia/peligro real, final feliz y tranquilo, y
      estructura (presentación · situación · conflicto seguro · amigo que ayuda · resolución ·
      enseñanza final) condicionada a cuento/fábula.
- [ ] ❌ Seed `prisma/seed.ts`: alinear `prompt.story.system` con el mismo texto (para `local`/`cloud`
      con DB seedada). Reseed idempotente (`pnpm --filter @magyblob/backend prisma:seed`).
- [ ] ❌ Tests (`test/infrastructure/prompts.test.ts`): el `system` de `buildStoryPrompt` incluye las
      reglas (estructura, onomatopeya, enseñanza, final feliz) en ES y EN; la personalización
      (US-26) del `prompt` sigue intacta y la salida `titulo`/`cuerpo` no cambia de contrato.
- [ ] ❌ Docs: CHANGELOG backend (Unreleased), phases.md, memory.md.
- [ ] ❌ Gate `pnpm check` verde + (opcional) smoke `local` + cierre con `cerrar-feature`
      (versión, CHANGELOG, merge tras confirmación y pruebas).

## DoD

El system prompt del cuento incorpora las reglas del prompt maestro (estructura + tono + onomatopeyas

- enseñanza + final feliz) en ES/EN, en código y en el seed, sin romper la personalización de US-26
  ni el contrato HTTP. `pnpm check` verde + pruebas con el usuario.
