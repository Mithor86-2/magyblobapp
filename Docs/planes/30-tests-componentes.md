# Plan — Feature 30: Pruebas user-centric de componentes de la app

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

- ✅ La app (`packages/app`) tiene componentes con props de accesibilidad
  (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`): `BubblyButton`,
  `ParentalGate`, `TextField`, `SelectableChip`, etc.
- ✅ Vitest ya está en el paquete, pero **solo en modo node** y con un único test de lógica
  (`infrastructure/http.test.ts`). No hay entorno de render ni librería de testing de UI.
- ❌ No existían pruebas que ejercitaran los componentes como lo haría una persona usuaria.

**Decisión (con el usuario):** introducir **React Native Testing Library** sobre **Vitest**
siguiendo la _Query Priority_ de Testing Library (rol → etiqueta → texto → `testID` como último
recurso). Cubrir en esta tanda 4 componentes: `BubblyButton`, `ParentalGate`, `TextField`,
`SelectableChip`. La dependencia es **solo de desarrollo** (sin red ni SDK de tercero en runtime,
compatible con [../cumplimiento-menores.md](../cumplimiento-menores.md)).

## Historias cubiertas

- US-30 — Pruebas user-centric de componentes de la app ([épica F](../historias-usuario/epic-f-plataforma.md#us-30))

## Tareas

- [x] ✅ **Andamiaje docs:** rama `feature/30-tests-componentes`, US-30 + trazabilidad, este plan,
      `## [Unreleased]` del CHANGELOG del app.
- [x] ✅ **Infra de test de UI:** la vía idiomática (`@testing-library/react-native` +
      `react-test-renderer`) bajo Vitest exige transformar el Flow de `react-native` y mockear muchos
      módulos nativos (frágil en clon limpio). **Decisión:** alias `react-native` → `react-native-web` + `@testing-library/react` + `jsdom`. RN-web es JS plano y traduce las props de accesibilidad a
      ARIA (`accessibilityRole`→`role`, `accessibilityLabel`→`aria-label`...), justo lo que consultan
      las queries. `devDependencies`: `react-native-web`, `react-dom` (versión exacta de `react`),
      `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`. `vitest.config.ts` con entorno
      `node` por defecto (test de `http` intacto) y docblock `@vitest-environment jsdom` por test de
      componente; `vitest.setup.ts` carga los matchers de `jest-dom`.
- [x] ✅ Test `BubblyButton` — rol `button`, nombre accesible, `onPress`, `disabled` (no dispara),
      `loading` (muestra `progressbar` y no dispara).
- [x] ✅ Test `ParentalGate` — reto visible, acierto revela `children`, fallo avisa y no revela.
- [x] ✅ Test `TextField` — etiqueta visible, rol `textbox`, `value`, `onChangeText`, `placeholder`.
      _(El componente no tiene prop `error`; criterio de US ajustado a la realidad.)_
- [x] ✅ Test `SelectableChip` — `onPress` y localizable por rol+texto en ambos estados. _(El estado
      `selected` no se proyecta a `aria-selected` en RN-web; se documenta como limitación del arnés
      web, el `accessibilityState` es correcto en nativo.)_
- [ ] 🔄 Gate verde (`pnpm check`) y CHANGELOG del app actualizado.
- [ ] ❌ Pruebas con el usuario + confirmación → cierre con `cerrar-feature`.
