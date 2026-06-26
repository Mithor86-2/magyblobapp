# Plan — Feature 44: Observabilidad de errores (ErrorBoundary + breadcrumbs)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Extiende la integración Sentry de US-40/US-43 (planes [42](42-sentry-monitorizacion-errores.md) y
> [43](43-sentry-release-debug-test.md)). Solo toca el paquete `app`. Fase 6 (Calidad y robustez).

## Contexto

Estado actual (✅ ya existe · ❌ falta):

- ✅ Sentry init condicional al DSN ([sentry.bootstrap.ts](../../packages/app/src/infrastructure/sentry.bootstrap.ts)),
  con `tracesSampleRate: 0`, `sendDefaultPii: false`, `beforeSend: scrubEvent` (redacta el nombre del niño
  en `message`/excepciones/`breadcrumbs[].message`).
- ✅ Boundary raíz vía `Sentry.wrap(App)` ([index.ts:16](../../packages/app/index.ts)) — **sin _fallback_
  propia** (pantalla nativa por defecto).
- ✅ Punto central HTTP `request<T>()` ([http.ts](../../packages/app/src/infrastructure/http.ts)) que cubre
  los 9 endpoints; tokens de tema y `BubblyButton` para construir la _fallback UI_.
- ❌ No hay `Sentry.ErrorBoundary` granular ni _fallback UI_ propia.
- ❌ No hay ningún `addBreadcrumb` propio; navegación _vanilla_ (sin `navigationRef`/`onStateChange`).
- ❌ `scrubEvent` redacta `breadcrumbs[].message` pero **no** `breadcrumbs[].data`.

Decisiones tomadas con el usuario:

- **Alcance del boundary: global + por zona** (un crash en una pantalla no tumba la app).
- **Excluir `showDialog`/`feedbackIntegration`** (rompe C-12; se usa el `DialogProvider` propio).
- **Breadcrumbs solo con enums/ids/contadores**; jamás nombre del niño ni texto generado.

## Historias cubiertas

- US-41 — Degradación elegante ante errores de render (ErrorBoundary) ([épica F](../historias-usuario/epic-f-plataforma.md#us-41))
- US-42 — Telemetría del recorrido del usuario (breadcrumbs) ([épica F](../historias-usuario/epic-f-plataforma.md#us-42))

## Fase A — `AppErrorBoundary` (US-41)

- [x] ✅ Crear `presentation/components/AppErrorBoundary.tsx`: envuelve `Sentry.ErrorBoundary` con
      `fallback={({ resetError }) => <ErrorFallback onRetry={resetError} />}`; prop `label?` →
      `beforeCapture` (`scope.setTag('boundary', label)`); **sin** `showDialog`. Excluido de cobertura
      (importa `@sentry/react-native`, no carga bajo Vitest), como `Icon.tsx`.
- [x] ✅ _Fallback UI_ `ErrorFallback.tsx` en español (mensaje genérico, **sin** `error.message` ni
      _stack_), con tokens `errorContainer`/`onErrorContainer` y `BubblyButton` de «Reintentar».
- [x] ✅ Colocación **global**: `AppErrorBoundary` envolviendo `<NavigationContainer>` en
      [App.tsx](../../packages/app/App.tsx).
- [x] ✅ Colocación **por zona**: wrappers `CuentosScreen`/`ActividadesScreen`/`LecturaScreen` con su
      `label` (cuentos/actividades/lectura).
- [x] ✅ Test `ErrorFallback.test.tsx`: muestra el _fallback_ sin detalle técnico y `onRetry` se invoca
      al pulsar «Reintentar» (la parte con lógica; el catch lo aporta `Sentry.ErrorBoundary`).

## Fase B — Breadcrumbs de telemetría (US-42)

- [x] ✅ Crear helper `infrastructure/telemetry.ts` con _wrappers_ tipados (no-op sin Sentry activo, vía
      _sink_ inyectado): `trackNavigation` (`navigation`), `trackApi` (`api`), `trackAction` (`ui`).
      Aceptan **solo** enums/ids/contadores (tipo `SafeData`).
- [x] ✅ Instrumentar `request<T>()` en [http.ts](../../packages/app/src/infrastructure/http.ts):
      `trackApi` en éxito/no-ok (con `status`) y en fallo de red (sin `status`); sin cuerpo. (CORE 100%.)
- [x] ✅ Navegación: `navigationRef = useNavigationContainerRef()` + `onStateChange` en
      [App.tsx](../../packages/app/App.tsx) → `trackNavigation(getCurrentRoute().name)`.
- [x] ✅ Acciones de negocio: `trackAction` en `story.generate` (tema/estilo), `activities.recommend`
      (categoría), `activity.complete` (valoración), `guardian.login` y `profile.create` (edad/idioma/nº
      intereses). **Sin** nombre del niño ni texto del cuento. _(YAGNI: alta/selección de perfil quedan
      cubiertas por los breadcrumbs `navigation` + `api`; no se añade `trackAction` redundante.)_
- [x] ✅ Endurecer [sentry.ts](../../packages/app/src/infrastructure/sentry.ts): `maxBreadcrumbs: 50`,
      `beforeBreadcrumb: scrubBreadcrumb` (redacta message y `data`), y `scrubEvent` extendido a
      `breadcrumbs[].data`. Sink cableado en `sentry.bootstrap.ts` solo con DSN activo.
- [x] ✅ Tests: `telemetry.test.ts` (categoría/nivel, no-op sin sink, sin PII) y casos extra en
      `sentry.test.ts` (`scrubBreadcrumb` y redacción en `breadcrumbs[].data`).

## Fase C — Verificación y cierre

- [x] ✅ Gate verde: `pnpm check` (typecheck + lint + format:check + test). Backend 192/192, app 83/83.
      Cobertura app: `http.ts`/`sentry.ts`/`telemetry.ts` al 100%, global 99.88%.
- [ ] 🔄 Prueba manual con DSN: recorrido (Welcome→Login→SelectProfile→Main→Cuentos→generar) + disparador
      dev-only de `ParentalScreen` → en Sentry, ver _timeline_ de breadcrumbs y tag `boundary`, **sin PII
      del niño**; forzar error de render en una zona → _fallback_ + reintento sin tumbar la app.
- [ ] ❌ Solicitar pruebas al usuario (manual u ofrecer verificación automatizada).
- [ ] ❌ Docs: `CHANGELOG.md` de `app` (`## [Unreleased]`), `phases.md`, US-41/US-42 al día; revisar
      **C-12** (sin `showDialog`/feedback; breadcrumbs sin PII).
- [ ] ❌ Cierre con la skill **cerrar-feature** (SemVer + CHANGELOG fechado + merge tras confirmación).
