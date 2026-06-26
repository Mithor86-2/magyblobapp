# Plan — Feature 31: Análisis estático de calidad con SonarJS

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

- ✅ ESLint 9 con **flat config** en [../../eslint.config.mjs](../../eslint.config.mjs): `@eslint/js`
  recomendado + `typescript-eslint` recomendado + reglas de **frontera de capas**
  (`no-restricted-imports` en `/domain` y aplicación) + `eslint-config-prettier`.
- ✅ El lint raíz ignora `packages/app/**`; el backend lintea `src test`.
- ❌ No hay análisis de calidad/complejidad (bugs, code smells, complejidad cognitiva, duplicados).

**Decisión (con el usuario):** "SonarJS" = [`eslint-plugin-sonarjs`](https://github.com/SonarSource/SonarJS)
v4 (reglas JS/TS de SonarQube como plugin de ESLint), **no** SonarQube/SonarCloud (sin servicio
externo ni CI nuevo). Dependencia **solo de desarrollo**; sin runtime, red ni SDKs de terceros
(coherente con [../cumplimiento-menores.md](../cumplimiento-menores.md)). Se integra en la flat config
existente vía `sonarjs.configs.recommended`. Alcance: backend (`packages/backend/src` y `test`).

**Notas técnicas (doc oficial, ESLint 9):**

- Uso: `import sonarjs from 'eslint-plugin-sonarjs'` → `sonarjs.configs.recommended` en el array de
  config. Habilita la mayoría de reglas con severidad `error`.
- Varias reglas requieren **información de tipos** (💭) vía `@typescript-eslint/parser` +
  `parserOptions.project`. Hay que decidir en implementación si activar _typed linting_ o limitar el
  scope de SonarJS a las reglas sin tipos (ver Tarea 2).
- Hay que **preservar el orden** de la flat config: `eslint-config-prettier` (`prettier`) al final, y
  las reglas de frontera de capas no deben quedar relajadas por SonarJS.

## Historias cubiertas

- US-31 — Análisis estático de calidad con SonarJS ([épica F](../historias-usuario/epic-f-plataforma.md#us-31))

## Tareas

- [x] ✅ **T1 · Instalar dependencia.** `eslint-plugin-sonarjs@^4.1.0` como `devDependency` raíz.
- [x] ✅ **T2 · Integrar en la flat config.** Añadido `sonarjs.configs.recommended` a
      [../../eslint.config.mjs](../../eslint.config.mjs), tras las recomendadas de typescript-eslint y
      antes de `prettier`. El `ignores` raíz ya acota el análisis al backend (`packages/app/**` y
      `*.config.*` quedan fuera), por lo que **no** hizo falta un `files` extra. **Decisión _typed
      linting_:** opción (b) — **sin** `parserOptions.project`. La config `recommended` no lo exige; las
      ~50 reglas que requieren tipos simplemente no analizan (no lanzan error) y las ~268 restantes
      cubren el grueso de bugs/code smells. Evita acoplar el lint al `tsconfig` y mantener un segundo
      _type-check_ en cada lint (YAGNI).
- [x] ✅ **T3 · Sanear el backend.** 18 incidencias resueltas:

  - **Refactor (genuinas):** `single-character-alternation` / `no-misleading-character-class` en
    `sanitizeForSpeech` (alternación de combinadores ZWJ/VS con supresión justificada, una clase
    sería engañosa); `prefer-specific-assertions` → `toHaveLength` en el test de actividades.
  - **Supresión en línea (seguridad, regla activa global):** `super-linear-regex` en el email de
    `Guardian` (patrón anclado, un único `\.`, longitud acotada → sin ReDoS real).
  - **Desactivadas en config con justificación escrita** (chocan con idiomas deliberados):
    `todo-tag` (los TODO son marcadores de planificación), `void-use` (patrón elegido para promesa
    flotante: bootstrap y errorHandler de Fastify), `no-nested-conditional` (ternario bilingüe ES/EN
    consistente; aplanarlo tocaría la lógica de prompts, fuera de alcance).
  - **Solo en tests:** `no-clear-text-protocols` off (URLs `http://` a servicios internos simulados).

- [x] ✅ **T4 · Verificar el gate.** `pnpm check` verde (typecheck + lint + format + 126 tests backend +
      41 app). `eslint --print-config` confirma 268 reglas `sonarjs/*` activas (`cognitive-complexity`
      en `error`) y la frontera de capas (`no-restricted-imports`) intacta.
- [ ] 🔄 **T5 · Docs + CHANGELOG.** `packages/backend/CHANGELOG.md` (`[Unreleased] → Added`) anotado.
      Pendiente: cierre con la skill **cerrar-feature** (versión SemVer, changelog fechado, pruebas al
      usuario, Git Flow finish con confirmación).

## Verificación / DoD

- `pnpm check` verde.
- `pnpm lint` ejecuta reglas `sonarjs/*` (comprobable forzando un smell temporal y viendo el report).
- Frontera de capas intacta (los `no-restricted-imports` siguen disparando).
- Sin dependencias de runtime nuevas (solo `devDependencies`).
