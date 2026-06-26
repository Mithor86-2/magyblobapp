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

- [ ] ❌ Crear `presentation/components/AppErrorBoundary.tsx`: envuelve `Sentry.ErrorBoundary` con
      `fallback={({ resetError }) => <FallbackUI onRetry={resetError} />}`; prop `label?` →
      `beforeCapture` (`scope.setTag('boundary', label)`); **sin** `showDialog`.
- [ ] ❌ _Fallback UI_ en español (mensaje genérico, **sin** `error.message` ni _stack_), con tokens
      `errorContainer`/`onErrorContainer` y `BubblyButton` de «Reintentar».
- [ ] ❌ Colocación **global**: envolver `<NavigationContainer>` en [App.tsx](../../packages/app/App.tsx).
- [ ] ❌ Colocación **por zona**: envolver `StoryGeneratorScreen`, `ActivitiesScreen`, `StoryReaderScreen`
      con su `label`.
- [ ] ❌ Test `AppErrorBoundary.test.tsx`: hijo que lanza en render → renderiza _fallback_; `onRetry`
      resetea y remonta.

## Fase B — Breadcrumbs de telemetría (US-42)

- [ ] ❌ Crear helper `infrastructure/telemetry.ts` con _wrappers_ tipados (no-op sin Sentry activo):
      `trackNavigation(routeName)` (`navigation`), `trackApi({ method, path, status?, ok })` (`api`),
      `trackAction(name, data?)` (`ui`). Aceptan **solo** enums/ids/contadores.
- [ ] ❌ Instrumentar `request<T>()` en [http.ts](../../packages/app/src/infrastructure/http.ts):
      `trackApi` en éxito y en la rama `ApiError` (método, ruta, `status`/resultado; sin cuerpo).
- [ ] ❌ Navegación: `navigationRef = useNavigationContainerRef()` + `onStateChange` en
      [App.tsx](../../packages/app/App.tsx) → `trackNavigation(currentRouteName)`.
- [ ] ❌ Acciones de negocio: `trackAction` en `onGenerate` (cuentos/actividades: `tema/estilo/edad/idioma`),
      `onComplete` (actividad: `rating`), login/alta, selección/creación de perfil. **Sin** nombre del niño
      ni texto del cuento.
- [ ] ❌ Endurecer [sentry.ts](../../packages/app/src/infrastructure/sentry.ts): fijar `maxBreadcrumbs`,
      añadir `beforeBreadcrumb` defensivo y extender `scrubEvent` para redactar `breadcrumbs[].data`.
- [ ] ❌ Tests: `telemetry.test.ts` (categoría/nivel correctos, sin campos PII) y caso extra en
      `sentry.test.ts` (redacción del nombre del niño también en `breadcrumbs[].data`).

## Fase C — Verificación y cierre

- [ ] ❌ Gate verde: `pnpm check` (typecheck + lint de import-boundaries + format:check + test).
- [ ] ❌ Prueba manual con DSN: recorrido (Welcome→Login→SelectProfile→Main→Cuentos→generar) + disparador
      dev-only de `ParentalScreen` → en Sentry, ver _timeline_ de breadcrumbs y tag `boundary`, **sin PII
      del niño**; forzar error de render en una zona → _fallback_ + reintento sin tumbar la app.
- [ ] ❌ Solicitar pruebas al usuario (manual u ofrecer verificación automatizada).
- [ ] ❌ Docs: `CHANGELOG.md` de `app` (`## [Unreleased]`), `phases.md`, US-41/US-42 al día; revisar
      **C-12** (sin `showDialog`/feedback; breadcrumbs sin PII).
- [ ] ❌ Cierre con la skill **cerrar-feature** (SemVer + CHANGELOG fechado + merge tras confirmación).
