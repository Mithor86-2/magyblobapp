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

- [ ] ❌ **Andamiaje docs:** rama `feature/30-tests-componentes`, US-30 + trazabilidad, este plan,
      `## [Unreleased]` del CHANGELOG del app.
- [ ] ❌ **Infra de test de UI:** añadir `@testing-library/react-native` (+ dependencias de soporte
      para correr RN bajo Vitest) como `devDependencies` del app; `vitest.config.ts` del paquete con
      el entorno de render y el `setup` necesario. No romper el test node existente (`http.test.ts`).
- [ ] ❌ Test `BubblyButton` — rol `button`, nombre accesible, `onPress`, estados `disabled`/`loading`.
- [ ] ❌ Test `ParentalGate` — reto visible, acierto revela `children`, fallo no revela y regenera.
- [ ] ❌ Test `TextField` — localizable por etiqueta, `onChangeText`, mensaje de error visible.
- [ ] ❌ Test `SelectableChip` — `onPress`, estado seleccionado observable accesiblemente.
- [ ] ❌ Gate verde (`pnpm check`) y CHANGELOG del app actualizado.
- [ ] ❌ Pruebas con el usuario + confirmación → cierre con `cerrar-feature`.
