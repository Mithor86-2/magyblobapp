# Plan — Feature 79: ajustar el tema oscuro al diseño "cielo nocturno"

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

- ✅ El tema claro/oscuro reactivo ya existe (US-66, feature 77 mergeada en `develop`):
  `ThemeProvider` + `themes.light`/`themes.dark` en
  [../../packages/app/src/presentation/theme/tokens.ts](../../packages/app/src/presentation/theme/tokens.ts).
- ✅ Se añadió el documento de diseño del tema oscuro
  [../Design/stitch_magyblob/DESIGN_Dark.md](../Design/stitch_magyblob/DESIGN_Dark.md) — paleta
  "cielo nocturno" (índigo cósmico), distinta de la implementada.
- ❌ La paleta `darkColors` actual es **cocoa cálida** (`surface: #1a1210`, coral salmón, menta,
  cielo). No coincide con el diseño aprobado.

**Decisión (con el usuario):** re-mapear `darkColors` a la paleta del `DESIGN_Dark.md`
manteniendo el **contrato de claves** `ColorTokens` (idéntico en claro y oscuro), la tipografía
**Quicksand** (no se migra a Plus Jakarta Sans) y los **tokens invariantes** (radios, espaciado,
tamaños). Solo cambian los valores de color del tema oscuro; el tema claro no se toca.

**Mapeo DESIGN_Dark.md → `ColorTokens`:**

| Token (`ColorTokens`)  | DESIGN_Dark.md                         | Valor     |
| ---------------------- | -------------------------------------- | --------- |
| `surface`              | surface / background                   | `#111125` |
| `surfaceContainer`     | surface-container                      | `#1e1e32` |
| `surfaceContainerHigh` | surface-container-high                 | `#28283d` |
| `primary`              | primary (coral)                        | `#ffb4a7` |
| `onPrimary`            | on-primary                             | `#640c04` |
| `primaryContainer`     | primary-container                      | `#ff7f6a` |
| `primaryBorder`        | inverse-primary (lip coral más oscuro) | `#a43b2c` |
| `secondary`            | secondary (púrpura suave)              | `#d3bcfc` |
| `onSecondary`          | on-secondary                           | `#38265b` |
| `secondaryContainer`   | secondary-container                    | `#523f76` |
| `tertiary`             | tertiary (aqua suave)                  | `#76d5e1` |
| `onTertiary`           | on-tertiary                            | `#00363c` |
| `tertiaryContainer`    | tertiary-container                     | `#52b2be` |
| `onSurface`            | on-surface                             | `#e2e0fc` |
| `onSurfaceVariant`     | on-surface-variant                     | `#dec0bb` |
| `outline`              | outline                                | `#a58b86` |
| `error`                | error                                  | `#ffb4ab` |
| `errorContainer`       | error-container                        | `#93000a` |
| `onErrorContainer`     | on-error-container                     | `#ffdad6` |

## Historias cubiertas

- US-66 — Tema claro/oscuro (sistema + manual) ([épica config](../historias-usuario/epic-e-config.md)).
  Refinamiento: la paleta oscura debe seguir el diseño "cielo nocturno" del `DESIGN_Dark.md`.

## Tareas

- [ ] ❌ Re-mapear `darkColors` en `tokens.ts` a la paleta del `DESIGN_Dark.md` y actualizar su
      bloque de documentación (de "cocoa cálida" a "índigo cósmico / cielo nocturno").
- [ ] ❌ Comprobar que `ThemeProvider`/`makeSoftShadow` siguen coherentes con la nueva paleta (sin
      cambios de API; el `shadowColor` pasa a teñir con el coral del cielo nocturno).
- [ ] ❌ Registrar el `DESIGN_Dark.md` en git (hasta ahora estaba sin trackear).
- [ ] ❌ CHANGELOG (`packages/app`): entrada bajo `## [Unreleased] → Changed`.
- [ ] ❌ Gate verde: `pnpm check` (typecheck + lint + format:check + test).
- [ ] ❌ Pruebas con el usuario (visual del tema oscuro) → confirmación → cierre con `cerrar-feature`.
