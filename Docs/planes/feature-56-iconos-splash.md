# Plan — Feature 56: Icono de la app y splash de marca (US-52)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Rama: `feature/56-iconos-splash` (desde `develop`). Pulido visual post-1.0.0. Solo app.

## Contexto

Qué existe ya (✅):

- ✅ App Expo SDK 56 (managed; `android/ios` se generan por prebuild y están gitignored).
- ✅ Assets de icono en `packages/app/assets/` y config en `app.json` (`icon`, `android.adaptiveIcon`).

Qué se cambia (este trabajo):

- El usuario ajustó la imagen del icono; los assets adaptativos estaban **mal separados** (el mismo
  fichero para foreground/background/monochrome) y el `icon.png` tenía **transparencia** (esquinas
  negras en iOS). El splash usaba el fondo blanco por defecto del prebuild.

## Historias cubiertas

- **US-52 — Icono de la app y splash de marca** ([épica F](../historias-usuario/epic-f-plataforma.md#us-52))

## Tareas

- [x] ✅ Refinar assets (PIL): `android-icon-foreground.png` (logo en zona segura ~66%, transparente),
      `android-icon-background.png` (color plano `#fff8f6`), `android-icon-monochrome.png` (silueta),
      `icon.png` (logo sobre fondo sólido `#fff8f6`, opaco → iOS sin esquinas negras). Respaldo del logo
      transparente original en `logo-source.png`.
- [x] ✅ Splash con `expo-splash-screen` (instalado, plugin en `app.json`): `backgroundColor` **`#ccc4b9`**,
      `image` `splash-icon.png`, `imageWidth 200`, `resizeMode contain`.
- [x] ✅ **Verificación visual con el usuario** en el emulador Android (prebuild --clean + run + reinstalar).
- [ ] ❌ Gate (`pnpm check`) verde.
- [ ] ❌ Docs (CHANGELOG app) + cierre con `cerrar-feature` (versión + merge, tras confirmación).

## Verificación (DoD)

- `pnpm check` verde (cambios de assets/config no afectan typecheck/lint/test).
- Icono adaptativo y splash `#ccc4b9` visibles en el emulador tras `npx expo prebuild --clean` +
  `npx expo run:android` (reinstalando la app para limpiar el icono cacheado del launcher).
- `docker compose up` y el arranque reproducible no se ven afectados (cambio solo de app).
