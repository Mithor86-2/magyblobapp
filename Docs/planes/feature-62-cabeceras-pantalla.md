# Plan — Feature 62: Cabeceras por pantalla (US-58)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md); coordinación del lote en
> [coordinacion-mejoras-paralelo-2.md](coordinacion-mejoras-paralelo-2.md) (F6). Aquí va el **cómo** se
> trocea y ejecuta.
>
> Rama: `feature/62-cabeceras-pantalla` (desde `develop`). Solo app. Mejora **F6** del lote nº 2.

## Contexto

El lienzo base [Screen](../../packages/app/src/presentation/components/Screen.tsx) ya fija fondo crema,
márgenes seguros, `ScrollView`, footer fijo y `KeyboardAvoidingView` (US-53), pero las pantallas no
tenían **cabecera ilustrada**. Esta historia añade una **variante opcional** de `Screen` con la prop
`headerImageName` que pinta la imagen correspondiente de
[assets/images/headers/](../../packages/app/assets/images/headers/) en la parte superior, dentro del
área segura y por encima del contenido desplazable, conservando scroll, footer y
`KeyboardAvoidingView`.

**Restricciones técnicas:**

- Metro no resuelve `require` dinámicos → el mapeo nombre → imagen usa un **objeto con `require`
  estáticos**.
- Las 5 imágenes pesan ~2 MB cada una → se **optimizan** (redimensionado a ancho razonable +
  recompresión) a ~200-400 KB sin degradación visible, con dimensiones consistentes.
- Solo reciben cabecera las pantallas con imagen disponible (`Welcome`, `Home`, `Dashboard`, generador
  de cuentos y actividades); el resto se queda sin ella.

**Coordinación:** F6 reescribe pantallas igual que F5 (i18n) → van **secuenciales** (F6 → F5). Esta
feature toca también `Screen.tsx`, que F1 (US-53) modificó con `KeyboardAvoidingView` y footer fijo:
se respeta lo añadido por F1.

## Historias cubiertas

- **US-58 — Cabeceras por pantalla** ([épica F](../historias-usuario/epic-f-plataforma.md#us-58))

## Fases y tareas

### Fase 1 — Andamiaje (docs) ✅

- [x] ✅ US-58 en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md#us-58) (Gherkin,
      ancla `#us-58`) + listado de la épica F.
- [x] ✅ Fila de trazabilidad en [README.md](../historias-usuario/README.md) (Could · Mejoras ·
      "Cabeceras" · F).
- [x] ✅ Este plan en `Docs/planes/feature-62-cabeceras-pantalla.md` (fases → tareas con estado).
- [x] ✅ `## [Unreleased]` listo en [packages/app/CHANGELOG.md](../../packages/app/CHANGELOG.md).
- [x] ✅ Commit: `docs(planes): plan y US-58 de la feature 62 (cabeceras por pantalla)`.

### Fase 2 — Implementación ✅

- [x] ✅ **Optimizar las 5 imágenes** de `assets/images/headers/` (~2 MB → ~200-400 KB) con PIL
      (redimensionar a ancho ≤1200 + recompresión), dimensiones consistentes, sin degradación visible.
- [x] ✅ **Variante `Screen`:** prop opcional `headerImageName` (uno de cinco nombres lógicos:
      welcome/home/dashboard/cuentos/actividades); cuando llega, renderiza un `<Image>` de cabecera
      (altura ~170, `resizeMode="cover"`) arriba del `ScrollView`, dentro del `SafeAreaView` y
      respetando el `KeyboardAvoidingView` (US-53) y el footer fijo. Mapa nombre → `require` **estático**.
- [x] ✅ **Pasar `headerImageName`** desde cada pantalla con imagen: `WelcomeScreen` → `welcome`,
      `HomeScreen` → `home`, `DashboardScreen` → `dashboard`, `StoryGeneratorScreen` → `cuentos`,
      `ActivitiesScreen` → `actividades`. El resto sin cabecera.
- [x] ✅ **Tests** co-localizados: `Screen.test.tsx` (renderiza la cabecera cuando se pasa el nombre;
      no la renderiza cuando se omite) y alguna pantalla con cabecera.

### Fase 3 — Gate y cierre 🔄

- [ ] 🔄 `pnpm install` + `pnpm check` en verde (typecheck + lint + format:check + test).
- [ ] ❌ Entradas en `## [Unreleased]` del CHANGELOG del app (sin asignar `version` en la rama).
- [ ] ❌ Pruebas con el usuario (manual o verificación ofrecida) antes de proponer el cierre.
- [ ] ❌ `git flow feature finish` **solo** tras confirmación explícita del usuario.

## Decisiones

- **`require` estáticos por nombre** (no dinámicos): requisito de Metro; el mapa vive en `Screen.tsx`.
- **Cabecera dentro del `ScrollView`** (se desplaza con el contenido) frente a fija: una cabecera fija
  comería altura útil en pantallas con teclado/scroll; se prefiere que acompañe al contenido y deje el
  footer (acción principal) siempre fijo abajo.
- **Solo pantallas con imagen disponible** reciben cabecera; no se fuerzan imágenes inexistentes.

## Cumplimiento

Sin impacto: las imágenes van **empaquetadas en build-time** (assets locales), sin red, SDK de tercero
ni datos del menor. Conforme a [cumplimiento-menores.md](../cumplimiento-menores.md).
