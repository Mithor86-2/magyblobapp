# Plan — Feature 42: Monitorización de errores y crashes con Sentry (US-40)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

El asistente `@sentry/wizard` se lanzó manualmente sobre la app Expo y **falló la instalación** con
`ERR_PNPM_IGNORED_BUILDS: @sentry/cli` (pnpm 11 bloquea los _build scripts_ no aprobados; el wizard
dejó un placeholder inválido `'@sentry/cli': set this to true or false` en `pnpm-workspace.yaml`).

La integración es una **desviación de cumplimiento asumida (TFM)**: `@sentry/react-native` es un SDK
de terceros que transmite informes de error a sentry.io, lo que **rompe C-2/C-5** y es incompatible
con Apple Kids (ver [../cumplimiento-menores.md](../cumplimiento-menores.md)). Se acepta
conscientemente, como C-5 (cloud) y C-11 (ElevenLabs), con mitigaciones e **inicialización condicional
al DSN** (sin DSN no se inicializa → nada sale; el modo por defecto/dev/E2E sigue conforme).

Estado de partida:

- ✅ `@sentry/react-native` añadido a `packages/app/package.json` (por el wizard).
- ✅ `'@sentry/cli': true` corregido en `pnpm-workspace.yaml` → `pnpm install` pasa (postinstall OK).
- ❌ Sentry sin inicializar en la app (init condicional + `beforeSend` de redacción de PII).
- ❌ Desviación sin documentar (fila C-12 en `cumplimiento-menores.md`).
- ❌ Variables de entorno (DSN) sin documentar en `.env.example` / config de la app.

## Historias cubiertas

- US-40 — Monitorización de errores y crashes con Sentry ([épica F](../historias-usuario/epic-f-plataforma.md#us-40))

## Decisiones

- **Init condicional al DSN.** Sin `SENTRY_DSN` (modo por defecto, desarrollo, E2E en `mock`) Sentry
  **no** se inicializa; con DSN (builds de producción/preview) sí. Mantiene conforme el arranque por
  defecto (US-06) y los E2E.
- **PII fuera.** `sendDefaultPii: false` + `beforeSend` que redacta nombre del niño y email del adulto.
- **Sin ADR propio.** Se sigue el precedente de C-11 (ElevenLabs): US + fila de cumplimiento, sin ADR
  dedicado. (La decisión de privacidad marco ya vive en [ADR 0002](../ADR/0002-tres-modos-de-ia.md).)
- **Solo app.** No toca el backend.

## Tareas

- [x] ✅ Arreglar el gate de pnpm: `'@sentry/cli': true` en `pnpm-workspace.yaml`; `pnpm install` verde.
- [x] ✅ Inicializar Sentry en la app. Lógica pura testeable en `src/infrastructure/sentry.ts`
      (gating por DSN, `buildSentryOptions`, `scrubEvent`); efecto aislado en
      `src/infrastructure/sentry.bootstrap.ts` (`Sentry.init`, porque `@sentry/react-native` no carga
      bajo Vitest). `initSentry()` + `Sentry.wrap(App)` en `index.ts`. `sendDefaultPii: false`,
      `tracesSampleRate: 0`, **sin Session Replay**.
- [x] ✅ Config de entorno: DSN por `EXPO_PUBLIC_SENTRY_DSN` (clave pública), documentado como
      **opcional** en `.env.example` (sin DSN → desactivado). E2E forzado sin DSN
      (`EXPO_PUBLIC_SENTRY_DSN=` en el script `test:e2e`) para que el export web no active Sentry.
- [x] ✅ Documentar la desviación: fila **C-12** en [../cumplimiento-menores.md](../cumplimiento-menores.md) + nota en "Notas" con mitigaciones.
- [x] ✅ Tests: 8 casos en `sentry.test.ts` (gating, opciones, `scrubEvent`); `sentry.ts` al **100%**
      de cobertura (nivel CORE en `vitest.config.ts`); `sentry.bootstrap.ts` excluido (bootstrap).
- [x] ✅ CHANGELOG `packages/app` (`Added` + `Security`): entrada de la integración Sentry.
- [x] ✅ Verificar E2E (Playwright, `mock`, sin DSN) verdes y Sentry inactivo — suite con Docker en
      verde (CI corre sin `.env`, así que Sentry queda inactivo allí por construcción).
- [x] ✅ Pruebas con el usuario + cierre con `cerrar-feature` (SemVer app, CHANGELOG fechado, merge tras
      confirmación del usuario). Cerrada y mergeada a `develop`.

## Decisión sobre el prebuild nativo (2026-06-25)

Durante la sesión, el asistente de Sentry / `expo prebuild` generó `packages/app/ios/`, añadió
`expo-build-properties` y cambió los scripts `android`/`ios` a `expo run:*`. El build nativo de iOS
**falló** en `EXConstants` (fricción conocida de `expo-constants` + monorepo pnpm, **ajena a Sentry**;
el pod `RNSentry` sí autolinkó). Por decisión del usuario, US-40 se mantiene **solo a nivel JS**
(funciona en Expo Go y web, sin build nativo): se revirtieron `app.json`, los scripts y
`expo-build-properties`, y se eliminaron `ios/` y `.expo/` (carpetas nativas generadas, gitignored, el
repo es CNG). Si en el futuro se quiere capturar crashes nativos con symbolication, va en su propia
rama (arreglar `EXConstants` + plugin `@sentry/react-native/expo` + metro wrapping + token de subida).

## Cierre

Al terminar, ejecutar el gate (`pnpm check`), pedir pruebas al usuario y cerrar con la skill
**cerrar-feature** (versión + CHANGELOG fechado + merge a `develop` **solo tras confirmación**).
