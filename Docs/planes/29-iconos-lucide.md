# Plan — Feature 29: Iconografía consistente con lucide-react-native

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Hoy la app (`packages/app`) usa **exclusivamente emojis Unicode** como iconografía, renderizados
como `<Text>{emoji}</Text>` dispersos por pantallas y componentes (✅ funciona). Cada SO dibuja el
emoji a su manera, sin control de tamaño, color ni grosor, y desalineado del design system
(`theme/tokens.ts`) (❌ inconsistencia visual).

Se introduce **`lucide-react-native`** para los iconos **funcionales** mediante un **wrapper `Icon`
central** que mapea nombres semánticos a iconos Lucide y consume los tokens de tema.

**Decisiones tomadas con el usuario:**

- **Alcance:** funcionales + categorías de actividad + badges de proveedor de IA. Los **avatares de
  animales** (`AvatarPicker`) y el avatar por defecto `✨` se quedan en **emoji** (calidez infantil).
- **Estructura:** wrapper `Icon` central; las pantallas usan `<Icon name="play" />`, desacopladas de
  la librería.
- **Rama:** `feature/29-iconos-lucide` creada desde `develop` (Git Flow).

**Cumplimiento.** Lucide empaqueta los datos SVG en el bundle JS en build-time: **sin red en runtime
ni SDK de tercero activo**. Compatible con [../cumplimiento-menores.md](../cumplimiento-menores.md).

**Referencia (Context7, lucide-react-native 0.547):** requiere `react-native-svg` (12–15) como peer;
uso `<Camera color="red" size={48} strokeWidth={2} />`.

## Historias cubiertas

- US-29 — Iconografía consistente con lucide-react-native ([épica F](../historias-usuario/epic-f-plataforma.md#us-29))

## Tareas

- [x] ✅ Dependencias: `react-native-svg@15.15.4` (vía `expo install`, en rango 12–15) +
      `lucide-react-native`.
- [x] ✅ Tokens de icono en [../../packages/app/src/presentation/theme/tokens.ts](../../packages/app/src/presentation/theme/tokens.ts)
      (`iconSize: { sm, md, lg }`), reutilizando `colors` y `tapTarget`.
- [x] ✅ Wrapper [../../packages/app/src/presentation/components/Icon.tsx](../../packages/app/src/presentation/components/Icon.tsx):
      mapa `name → componente Lucide`; props `name`, `size?`, `color?`, `strokeWidth?`, `fill?`,
      `accessibilityLabel?`. `BubblyButton` admite `icon` y botón solo-icono.
- [x] ✅ Sustituir emojis funcionales por `<Icon />` (patrón: `<Text>{emoji}</Text>` → `<Icon />`):
  - `App.tsx` — tabs 🏠🎨📖📚 (usar `{ color, size }` de `tabBarIcon`).
  - `components/NarrationControls.tsx` — ▶⏸⏹.
  - `components/StarRating.tsx` — ⭐☆ (Star con/sin `fill`).
  - `screens/HistoryScreen.tsx` — flecha →.
  - `screens/HomeScreen.tsx` — 👤 (zona adultos). **Mantener `✨` emoji.**
  - `components/ActivityCard.tsx` — categorías 🎨🎵🧩.
  - `labels.ts` + `components/AuthorBadge.tsx` — badges proveedor 🎭🖥️☁️.
  - **Fuera de alcance (emoji):** `AvatarPicker.tsx` (animales) y `✨` de HomeScreen.
- [x] ✅ Gate verde: `pnpm check` (typecheck + lint + format:check + 12 tests app + 122 backend).
- [ ] 🔄 Prueba manual con el usuario (arrancar app, verificar iconos en Inicio/Actividades/
      Historial/Lector y narración/rating operativos).
- [x] ✅ CHANGELOG `[Unreleased]` del paquete app. ❌ Cierre con `cerrar-feature` (tras confirmación).

## Estado

🔄 Implementación completa y gate verde. Pendiente: prueba manual del usuario y, tras su
confirmación, cierre con `cerrar-feature` (versionado + CHANGELOG fechado + `git flow feature finish`).
