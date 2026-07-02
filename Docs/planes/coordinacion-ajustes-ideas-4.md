# Coordinación — Lote de ajustes 4 de `ideas.txt` (3 ajustes)

Tercera tanda de feedback tras probar el lote 3 en dev. Se ejecuta sobre la **misma rama**
`feature/87-ajustes-ideas-3` (el lote 3 sigue sin integrar a `develop`; estos ajustes se apoyan en sus
cambios: `SelectableChip`, `BookPages`, avatar), con **commits por feature**, gate verde e integración
**sin release** (con confirmación antes del `finish`).

Historias nuevas: **US-89…US-91** (épica F). Versionado **diferido**.

Decisiones confirmadas: **#3** número de página impreso en cada hoja (además del indicador existente);
**#1** colores+iconos por categoría también en el Dashboard.

Leyenda: ✅ hecho · 🔄 en curso · ⬜ pendiente

## Features (secuenciales: F1/F2 comparten pantallas)

| Feature                                 | Ajuste | US    | Plan                                                               |
| --------------------------------------- | ------ | ----- | ------------------------------------------------------------------ |
| F3 — Nº de página impreso en cada hoja  | #3     | US-91 | [feature-95-numero-pagina.md](feature-95-numero-pagina.md)         |
| F1 — Chips por categoría: color + icono | #1     | US-89 | [feature-93-chips-color-icono.md](feature-93-chips-color-icono.md) |
| F2 — Animación suave del avatar         | #2     | US-90 | [feature-94-avatar-animado.md](feature-94-avatar-animado.md)       |

## Cierre

Gate `pnpm check` verde (backend + app) + `expo export` OK → actualizar `phases.md`, historias
US-89…US-91 + trazabilidad, CHANGELOG del app (`## [Unreleased]`). **Sin release.** No `finish`/merge
sin confirmación del usuario tras sus pruebas en dev (dev build).
