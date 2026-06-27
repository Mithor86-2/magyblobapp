# Feature 65 — Ajustes de cabecera y portadas

Dos **fixes** de mejoras ya entregadas (US-58 cabeceras de pantalla, US-59 portadas de imagen). No
introduce funcionalidad nueva ni historia nueva: corrige el aspecto de la cabecera y acota las
portadas a los cuentos.

**Ramas/Historias.** Rama `feature/65-ajustes-cabecera-portadas` (desde `develop`). Fixes de
**US-58** (épica F) y **US-59** (épica B). Solo se anota la nota de ajuste en esas historias.

## Motivación

1. **Cabecera demasiado alta.** El ajuste de la feature 64 dejó la cabecera de `Screen` con
   `aspectRatio` ~cuadrado (`1000/1026`), tomado del origen, y `resizeMode="contain"`. En pantallas
   normales la banda sale gigante (casi cuadrada) y desequilibra el layout.
2. **Portadas mal aplicadas a actividades.** Los respaldos locales (`assets/images/story/`) están
   organizados por **tema** (`animales|espacio|magia|aventuras|musica`), que es un concepto de
   **cuentos**. Las actividades se organizan por **categoría** (`arte|musica|logica`), no por tema:
   la portada por tema no les corresponde conceptualmente, y la F7 la cableó igual mapeando
   categoría→tema. Se revierte: las portadas quedan **solo para cuentos**.

## Fase 1 — Andamiaje (docs) ✅

- [x] Plan en `Docs/planes/feature-65-ajustes-cabecera-portadas.md` (este documento).
- [x] Nota de ajuste en **US-58** (`epic-f-plataforma.md`): cabecera proporcionada (banda acotada).
- [x] Nota de ajuste en **US-59** (`epic-b-cuentos.md`): portada solo para cuentos, no actividades.
- [x] `## [Unreleased]` (Fixed) en `packages/app/CHANGELOG.md` y `packages/backend/CHANGELOG.md`.
- [x] Commit `docs(planes): plan y fixes de cabecera/portadas (feature 65)`.

## Fase 2 — Implementación ✅

### (1) Cabecera proporcionada (app) ✅

- [x] `Screen.tsx`: sustituir el `aspectRatio: 1000/1026` por una **banda de alto proporcional**
      (~22% del alto de pantalla con `useWindowDimensions`, acotado a `[170, 200]`), centrada, con
      `resizeMode="contain"` y `backgroundColor: colors.surface` rellenando el espacio sobrante. La
      imagen se ve **completa y encuadrada**, sin recorte y sin banda gigante.
- [x] Ajustar el test de `Screen` si hace falta (sigue verificando render/no-render de cabecera).

### (2) Portadas solo para cuentos ✅

**App:**

- [x] `ActivityCard.tsx`: quitar `<StoryCover>` y volver al aspecto previo (icono por categoría).
      Quitar imports y estilo `cover` ya no usados.
- [x] No tocar `StoryCover` ni su uso en `StoryReaderScreen` / `StoryGeneratorScreen` (cuentos sí
      llevan portada por tema).
- [x] Dejar de leer `activity.imagen` en la tarjeta (queda sin render en el app). El campo del tipo
      `Activity` puede permanecer pero ya no se consume en la UI.

**Backend:**

- [x] `RecommendActivities.ts`: quitar la llamada best-effort a `generateImage` (y el helper
      `generarImagen`); ya no se rellena `imagen` en las actividades. Los cuentos (`GenerateStory`)
      siguen generando `portada`.
- [x] La columna `Activity.imagen` queda **nullable y en desuso** (documentado; sin migración nueva
      para no acumular cambios de esquema). `Story.portada` intacto.

**Tests:**

- [x] `ActivityCard.test.tsx`: sin imagen (no se asume portada).
- [x] `recommend-activities.test.ts`: aserción de que ya **no** se llama a `generateImage`.

## Cierre (sin cerrar la rama)

- [x] `pnpm install` + `pnpm check` verde (exit 0).
- [x] Entradas `## [Unreleased]` (Fixed) en ambos CHANGELOG, **sin** tocar `version` (versionado
      diferido).
- [ ] **NO** `git flow feature finish` / merge — se difiere a confirmación del usuario.
