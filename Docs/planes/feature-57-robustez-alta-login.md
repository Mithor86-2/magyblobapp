# Plan — Feature 57: Robustez de producción + alta/login (US-53)

> Rama `feature/57-robustez-alta-login` (desde `develop`). Coordinación del lote en
> [coordinacion-mejoras-paralelo-2.md](coordinacion-mejoras-paralelo-2.md) (F1). Historia
> [US-53](../historias-usuario/epic-f-plataforma.md#us-53).

Cubre 4 mejoras del lote nº2: (1) timeouts y reintentos para el cold start de Render, (1.2) teclado
que tapa los campos, (1.3) email único con validación temprana, (1.4) contraseña segura.

## Fase 1 — Andamiaje (docs primero)

- [x] US-53 en `epic-f-plataforma.md` (Gherkin, ancla `#us-53`).
- [x] Fila de trazabilidad en `historias-usuario/README.md` (Should · Mejoras · "Alta/Login + red" · F)
      y US-53 en el listado de la épica F.
- [x] Plan en `Docs/planes/feature-57-robustez-alta-login.md` (este fichero).
- [x] `## [Unreleased]` con los 6 grupos en `packages/app/CHANGELOG.md` y `packages/backend/CHANGELOG.md`
      (ya presentes; sin tocar `version`).
- [x] Commit `docs(planes): plan y US-53 de la feature 57 (robustez alta/login)`.

## Fase 2 — Implementación

### (1) Timeout en prod + reintento + warm-up

- [x] `infrastructure/http.ts`: `DEFAULT_TIMEOUT_MS` 15000→30000, `GENERATION_TIMEOUT_MS` 30000→90000.
- [x] `useNarration.ts`: `NARRATION_TIMEOUT_MS` 15000→30000.
- [x] Reintento con backoff (máx 2) ante `ApiError` tipo `timeout`/`network` en `request()`.
- [x] Ping de warm-up a `/health` al arrancar (`composition.ts`), sin romper tests.
- [x] Tests del reintento en `http.test.ts`.

### (1.2) Teclado tapa campos

- [x] `presentation/components/Screen.tsx`: envolver el contenido en `KeyboardAvoidingView`
      (`padding` iOS / `height` Android), conservando `ScrollView` y footer.

### (1.3) Email único

- [x] `routes/guardians.ts`: email del alta de `z.string().min(3)` a `z.string().email()` (400 temprano).
      El 409 por duplicado no se toca.
- [x] Test de ruta para el email inválido en alta.

### (1.4) Contraseña segura

- [x] Backend (`guardians.ts`): `.refine` ≥8 con al menos una letra y un número.
- [x] App (`ConsentScreen`): validación sincronizada + ayuda visual del requisito.
- [x] Tests backend (ruta) y app (componente, si aplica).

## Cierre (sin finalizar la feature)

- [x] Plan marcado.
- [x] Entradas en `## [Unreleased]` de ambos CHANGELOG (sin tocar `version`).
- [x] `pnpm install` + `pnpm check` en verde.
- [ ] Commits Conventional Commits; pruebas con el usuario; `finish` solo tras confirmación.
