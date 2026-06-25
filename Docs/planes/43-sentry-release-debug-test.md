# Plan — Feature 43: Adaptaciones compatibles de Sentry (extensión US-40)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

La integración base de Sentry quedó cerrada en la [feature 42](42-sentry-monitorizacion-errores.md)
(US-40): init condicional al DSN, `sendDefaultPii: false`, `beforeSend` que redacta PII, sin Session
Replay / `setUser` / performance tracing. Validación end-to-end del DSN: OK (evento aceptado, HTTP 200).

A raíz de una **lección de referencia** (PDF «Lección 14: Sentry Implementation», orientada a
`@sentry/react` + Vite en e-commerce) se revisó qué de esa guía es **adaptable** a este proyecto
(`@sentry/react-native` + Expo, app de menores). La mayor parte **se descarta por cumplimiento**
(Session Replay, `setUser`/email, performance tracing, widget de feedback: rompen
[../cumplimiento-menores.md](../cumplimiento-menores.md) C-2/C-5 y ya están excluidos por diseño).

Quedan **tres adaptaciones seguras** (release, debug, disparador dev-only) y, además, una
**revisión de la política de PII** que aflora al validar el scrubbing actual.

**Política de PII revisada (decisión con el usuario).** El `beforeSend` actual solo redacta **emails**
(= PII del adulto) y **no toca el nombre del niño** (texto libre), justo lo contrario de lo que exige
hoy la US-40. Se acuerda una política nueva:

- **El adulto (administrador) SÍ puede salir** a Sentry → se **retira la redacción de email**.
- **El niño NUNCA sale** → se **registra el nombre del perfil activo** (desde el store) y `scrubEvent`
  lo reemplaza por `[child]` en `message`, `exception` y `breadcrumbs`. Cubre el caso real: el nombre
  del niño aparece dentro de los **cuentos generados**, que pueden colarse en un evento de error.

Estado de partida:

- ✅ Sentry base operativo (feature 42): init condicional, `beforeSend`, `sendDefaultPii: false`.
- ⚠️ Scrubbing al revés: redacta email del adulto pero **no** el nombre del niño (incumple US-40).
- ❌ `release` no se envía → en el dashboard no se sabe en qué versión del app ocurre cada error.
- ❌ `debug` no se activa en desarrollo → no hay logs de verificación del setup.
- ❌ No hay forma in-app (dev-only) de disparar un error de prueba para validar la tubería.

## Historias cubiertas

- US-40 — Monitorización de errores y crashes con Sentry ([épica F](../historias-usuario/epic-f-plataforma.md#us-40))
  — se **amplían** sus criterios (release/versión, debug en dev, disparador de prueba dev-only).

## Decisiones

- **Política de PII: proteger al niño, permitir al adulto.** Se retira la redacción de email; se añade
  redacción del **nombre del perfil activo** (`[child]`). Mecanismo: el store registra el nombre vía un
  setter en el módulo de Sentry (`setActiveChildName`) y `scrubEvent` lo usa. `delete event.user` y
  `device.name` se mantienen por minimización (no aportan al diagnóstico del adulto).
- **`release` desde la versión del app.** Se etiqueta cada evento con la versión (vía
  `expo-constants` → `Constants.expoConfig?.version`, alineando `app.json` con la versión del paquete).
  Beneficio puro de diagnóstico, sin PII.
- **`debug: isDev()`.** Logs de Sentry en consola **solo** en desarrollo (equivalente a los
  `[Sentry] initialized` del PDF). No afecta a producción.
- **Disparador de prueba dev-only.** Equivalente RN del `TestErrorButton` del PDF: solo visible bajo
  `__DEV__`, llama a `Sentry.captureException(new Error(...))`. **Sin** datos del niño.
- **Lo que NO se adapta** (rompe cumplimiento, ya excluido): Session Replay, performance/profiling
  tracing (`tracesSampleRate` sigue en `0`), `feedbackIntegration`, tunnel proxy (web/Vite, no móvil).
- **Source maps fuera de alcance.** La subida de source maps (plugin Expo + `SENTRY_AUTH_TOKEN`) se
  evalúa aparte (implica un token secreto): no entra en esta feature.

## Tareas

- [x] ✅ **PII**: `scrubEvent` redacta el nombre del niño (`[child]`) y deja de redactar emails; añadir
      `setActiveChildName` y registrarlo desde el store del perfil activo.
- [x] ✅ Añadir `expo-constants` y alinear `app.json` `version` con la versión del paquete.
- [x] ✅ `buildSentryOptions`: añadir `release` (versión) y `debug: isDev()` en `sentry.ts`.
- [x] ✅ Disparador de prueba dev-only (botón en ParentalScreen bajo `__DEV__`) que llame a `captureException`.
- [x] ✅ Tests (nivel CORE): nuevo scrubbing (niño redactado, adulto no), `release` y `debug` por entorno.
- [x] ✅ Ampliar/reescribir criterios de US-40 (PII niño-sí/adulto-no, release, debug, disparador dev).
- [x] ✅ Actualizar fila **C-12** en `cumplimiento-menores.md` con la política de PII revisada.
- [x] ✅ CHANGELOG `@magyblob/app` (Unreleased) + docs afectadas.
- [ ] 🔄 Gate verde (`pnpm check`) + pruebas con el usuario → cierre con `cerrar-feature`.
