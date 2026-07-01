---
name: documentar
description: Fuente única del estándar de documentación de código de magyblobApp — cómo se escribe la doc (bloque /** */ en prosa española sobre el símbolo exportado o como cabecera de módulo, con refs US-NN/C-N; sin TSDoc formal) y cómo se hace verificable (regla ESLint jsdoc/require-jsdoc en el backend, dentro de pnpm check). Úsala al documentar código nuevo, al revisar cobertura de documentación o al tocar la regla de lint de doc.
---

# Documentar

**Fuente única** del estándar de documentación de código de **magyblobApp**. Si cambia el estándar,
se cambia aquí.

## Principio

El código se documenta para explicar el **qué/por qué**, no la firma. La unidad documentada es el
_propósito_ del símbolo o del módulo, en el lenguaje ubicuo del proyecto (español) y con trazabilidad
a las historias y al cumplimiento. La documentación es **verificable en el gate** (no depende de
disciplina manual) allí donde hay linter.

## Cómo se escribe la doc (convención)

- **Formato:** bloque `/** … */` (JSDoc/TSDoc _de bloque_), nunca `//` para la doc de un símbolo.
- **Idioma:** **prosa en español** para la descripción. El **andamiaje** técnico (nombres de clases,
  interfaces, funciones, tipos) va en **inglés**; el **vocabulario de dominio** (`Guardian`,
  `ChildProfile`, `nombre`, `edad`, `idioma`, `intereses`, `tema`, `estilo`…) en **español**.
- **Dónde se coloca** (una de estas, según el caso):
  - **Sobre el símbolo exportado** — clase, función, o interfaz relevante: el bloque va _pegado_
    encima del `export`. Es la posición correcta (la que exige el linter).
  - **Cabecera de módulo** — al inicio del fichero (antes de los imports) cuando lo que aporta
    contexto es el _fichero entero_ (p. ej. un grupo de rutas Fastify, un adaptador HTTP).
- **Qué dice:** el **propósito** en 1–3 frases. Añade el _por qué_ o las decisiones no obvias
  (fallback, best-effort, degradación, invariantes) cuando aporten. Referencia la historia (`US-NN`)
  y/o el requisito de **cumplimiento** (`C-N`) cuando aplique — es lo que hace navegable el código
  ↔ historias de usuario ↔ cumplimiento de menores.
- **NO** se usa **TSDoc formal** (`@param`, `@returns`, `@throws`): documentamos el qué/por qué, no la
  firma (que ya está en los tipos). No añadas tags salvo que aporten algo que el tipo no dice.
- **Sin comentarios triviales** que repiten el nombre (`/** El id. */ id: string`) ni `//` colgando.

### Ejemplos modélicos (en el repo)

- Puerto documentado: `packages/backend/src/domain/ai/AIProvider.ts` (interfaz + modos).
- Provider con propósito y triple papel: `packages/backend/src/infrastructure/ai/MockProvider.ts`.
- Cabecera de módulo con contexto: `packages/app/src/infrastructure/http.ts`.
- Función exportada, doc de una línea: `buildStoryPrompt` en
  `packages/backend/src/infrastructure/ai/prompts.ts`.

### Plantillas

```ts
/**
 * <Propósito en una o dos frases>. <Decisión/matiz no obvio si lo hay>. US-NN[, C-N].
 */
export class GenerateStory {
  /* … */
}

/** <Qué hace y qué devuelve conceptualmente, sin repetir la firma>. */
export function toStoryOutput(story: Story): StoryOutput {
  /* … */
}
```

```ts
/**
 * Cabecera de módulo: <qué agrupa este fichero y bajo qué condición>. US-NN.
 */
import { … } from '…';
```

## Cómo se hace verificable (enforce con lint)

- **Alcance: backend.** La regla corre sobre `packages/backend/src/**` dentro de `pnpm lint` (y por
  tanto en el gate `pnpm check`). El **app Expo no tiene ESLint** todavía → su estándar es
  **convención** (documentar a mano); extenderlo es un follow-up de tooling.
- **Regla:** `jsdoc/require-jsdoc` de `eslint-plugin-jsdoc`, configurada en
  [../../eslint.config.mjs](../../eslint.config.mjs). Exige bloque de doc en **exports públicos**:
  `ClassDeclaration` + `FunctionDeclaration`, con `publicOnly`.
- **Solo `require-jsdoc`, NO el preset `flat/recommended`:** el preset activa `require-param`,
  `require-returns`, etc. — TSDoc formal que **choca** con la convención de prosa. Solo exigimos la
  _presencia_ del bloque.
- **Exclusiones:** `**/*.test.ts` y el código generado (`packages/backend/src/generated/**`, ya en el
  `ignores` global). Las **interfaces no** se exigen (evita ruido en los «bags» de opciones triviales
  `XxxOptions`/`XxxDeps`); documenta a mano las interfaces que aporten (puertos, entidades).

## Flujo de trabajo

1. **Al escribir/tocar un export público** (clase, función, ruta, provider, caso de uso): añade su
   bloque `/** */` siguiendo la convención de arriba **en el mismo cambio**.
2. **Para medir cobertura o encontrar huecos**, la **fuente de verdad es la regla**, no un `grep` de
   `/**` (los ficheros generados de Prisma tienen bloques y falsean el conteo):

   ```bash
   pnpm lint    # jsdoc/require-jsdoc marca los exports públicos sin doc
   ```

3. **Arregla lo que marque** (documenta el símbolo) hasta dejar `pnpm lint` en verde. No desactives la
   regla para «pasar» el gate: si molesta, es que falta doc.
4. **App (Expo):** al añadir una pantalla/componente, documenta su cabecera a mano (la regla no llega
   ahí todavía). La skill `nueva-pantalla` debería dejar el hueco de doc listo.

## Checklist

- [ ] Los exports nuevos/tocados llevan `/** */` en prosa española, con refs `US-NN`/`C-N` si aplica.
- [ ] La doc va sobre el símbolo exportado o como cabecera de módulo (no `//`, no TSDoc formal).
- [ ] `pnpm lint` en verde (la regla `jsdoc/require-jsdoc` no marca exports sin doc en el backend).
- [ ] Si cambiaste el estándar o la regla de lint, actualizaste **esta skill** (fuente única).
