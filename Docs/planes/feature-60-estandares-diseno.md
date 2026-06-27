# Plan — Feature 60: Estándares de diseño Android/iOS (US-56)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md); coordinación del lote en
> [coordinacion-mejoras-paralelo-2.md](coordinacion-mejoras-paralelo-2.md) (F4). Aquí va el **cómo** se
> trocea y ejecuta.
>
> Rama: `feature/60-estandares-diseno` (desde `develop`). Solo app. Mejora **F4** del lote nº 2.

## Contexto

El design system "Aprendizaje Mágico" ([theme/tokens.ts](../../packages/app/src/presentation/theme/tokens.ts))
ya fija paleta pastel saturada, tipografía Quicksand, formas redondeadas y tap targets ≥64px. Faltan
mejoras de **bajo riesgo** conformes a **Material 3** (Android) y **Human Interface Guidelines** (iOS):

- Los `Pressable` de los componentes base (`BubblyButton`, `SelectableChip`) no dan **feedback táctil**
  conforme a Android (sin `android_ripple`) ni **háptica** al pulsar.
- Algunos pares de color del theme no se han auditado contra el **contraste AA** (WCAG 2.1).
- La cabecera del stack (`stackScreenOptions` en `App.tsx`) puede afinarse para una vuelta atrás
  conforme a la HIG en iOS.

**Restricción de coordinación (importante):** se actúa **solo sobre componentes y theme**, **no** sobre
el contenido/strings de `presentation/screens/*`, para no chocar con **F5 (i18n, US-57)** y
**F6 (cabeceras, US-58)**, que reescriben las pantallas después.

## Historias cubiertas

- **US-56 — Estándares de diseño Android/iOS** ([épica F](../historias-usuario/epic-f-plataforma.md#us-56))

## Fases y tareas

### Fase 1 — Andamiaje (docs) ✅

- [x] ✅ US-56 en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md#us-56) (Gherkin,
      ancla `#us-56`) + listado de la épica F.
- [x] ✅ Fila de trazabilidad en [README.md](../historias-usuario/README.md) (Should · Mejoras ·
      "Toda la app" · F) y US-56 añadida al listado de la épica F.
- [x] ✅ Este plan en `Docs/planes/feature-60-estandares-diseno.md` (fases → tareas con estado).
- [x] ✅ `## [Unreleased]` listo en [packages/app/CHANGELOG.md](../../packages/app/CHANGELOG.md).
- [x] ✅ Commit: `docs(planes): plan y US-56 de la feature 60 (estándares de diseño)`.

### Fase 2 — Implementación (Material 3 / HIG, bajo riesgo) ❌

- [ ] ❌ **Feedback táctil:** `android_ripple` + estado `pressed` en los `Pressable` de los componentes
      base (`BubblyButton`, `SelectableChip`).
- [ ] ❌ **Háptica:** instalar `expo-haptics` (`expo install expo-haptics`) y disparar un háptico suave
      (`ImpactFeedbackStyle.Light`) al pulsar `BubblyButton` (no deshabilitado/cargando). Degradación
      segura en web (sin háptica).
- [ ] ❌ **Contraste:** auditar pares de color de [tokens.ts](../../packages/app/src/presentation/theme/tokens.ts)
      contra WCAG 2.1 AA (4.5:1 texto normal / 3:1 grande) y ajustar los que no cumplan, documentando
      el cambio en el CHANGELOG y aquí.
- [ ] ❌ **iOS back / cabecera:** revisar `stackScreenOptions` en `App.tsx` (etiqueta/título atrás) y
      dejar una navegación conforme; cambios mínimos.
- [ ] ❌ **Tests:** ampliar/ajustar las pruebas user-centric de los componentes tocados
      (`BubblyButton.test.tsx`, `SelectableChip.test.tsx`), sin probar estilos.
- [ ] ❌ Gate (`pnpm install` + `pnpm check`) verde (exit 0).
- [ ] ❌ Entradas en `## [Unreleased]` del CHANGELOG del app (sin tocar `version`).
- [ ] ❌ Pruebas con el usuario → confirmación → cierre con `cerrar-feature` (versión + merge).

## Verificación (DoD)

- `pnpm check` verde (typecheck + lint + format:check + test).
- Ripple/háptica observables en Android; degradación segura en web/iOS sin háptica.
- Pares de color auditados y ajustados a AA donde no cumplían (documentado).
- Sin tocar el cuerpo/strings de `presentation/screens/*` (no choca con F5/F6).

## Notas de alcance

- **Dentro:** `theme/tokens.ts`, `BubblyButton.tsx`, `SelectableChip.tsx`, opciones de navegación en
  `App.tsx` (solo `stackScreenOptions`), y los tests de los componentes tocados.
- **Fuera:** contenido/strings de pantallas (F5 i18n), imágenes/cabeceras por pantalla (F6), backend.
