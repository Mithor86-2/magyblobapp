# Plan — Feature 44: Robustez de red/IA en la app (Fase 6, US-43)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta. Cierra con `cerrar-feature`.

## Contexto

Cierra el ítem de **robustez** de la Fase 6 y su DoD (_"la app no rompe ante fallos de IA o red"_),
detectado en la auditoría de Fase 6 (2026-06-25). **Solo app**, no toca backend ni el arranque
reproducible (US-06).

Estado de partida:

- ✅ La mayoría de pantallas ya muestran carga + error: `StoryGeneratorScreen`, `ActivitiesScreen`,
  `SelectProfileScreen`, `HistoryScreen` (error sin reintento), `LoginScreen`.
- ✅ La narración (`useNarration`) degrada a voz nativa on-device si ElevenLabs falla.
- ✅ Capa HTTP (`http.ts`) mapea errores de red y HTTP a `ApiError` (con tests).
- ❌ `http.ts` usa `fetch` **sin timeout/AbortController**: si el backend no responde, el spinner
  queda indefinido (agujero del DoD).
- ❌ La narración no tiene timeout explícito (depende del timeout del SO, ~300 s).
- ❌ `CreateProfileScreen` no muestra spinner de carga mientras crea el perfil.
- ❌ `HistoryScreen` muestra el error sin **botón de reintento**.
- ❌ No hay tests de pantalla que ejerciten el camino de error.

Decisiones con el usuario (2026-06-25):

- Alcance **robustez de red/IA**; **C-7/C-9** (políticas de privacidad y retención) se difieren a otra rama.
- Timeout configurable por tipo de petición (p. ej. 30 s generación, 15 s narración); al vencer →
  `ApiError` de tipo `timeout`, tratado como el resto de errores (no se inventa un canal nuevo).

## Historias cubiertas

- US-43 — Robustez de red/IA en la app: timeouts y estados de error
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-43))

## Tareas

### Fase A — Timeout en la capa HTTP

- [x] ✅ Añadido `AbortController` + timeout configurable a `request()` en
      [`infrastructure/http.ts`](../../packages/app/src/infrastructure/http.ts): default 15 s, 30 s en
      generación de cuento/actividades; al vencer, `ApiError` tipo `timeout` con mensaje amigable.
- [x] ✅ Tests en `http.test.ts`: petición que excede el timeout → `ApiError('timeout')` (fake timers + `fetch` que rechaza al recibir `abort`); éxito antes del timeout no aborta y pasa el `signal`.

### Fase B — Timeout en la narración

- [x] ✅ `signal` con timeout (~15 s) en el `fetch` de narración de
      [`useNarration`](../../packages/app/src/presentation/hooks/useNarration.ts); al vencer/fallar,
      degrada a la **voz nativa** (comportamiento actual) sin colgarse. `clearTimeout` en `finally`.

### Fase C — Pulido de estados de carga/error

- [x] ✅ `CreateProfileScreen`: **ya** mostraba carga (el botón del footer recibe `loading={submitting}`
      y `disabled` evita envíos duplicados). No requería cambio; se verifica y se deja constancia.
- [x] ✅ `HistoryScreen`: **botón «Reintentar»** en el estado de error (caja `errorContainer` + acción
      `load`, patrón de `SelectProfileScreen`).

### Fase D — Tests de camino de error

- [x] ✅ Camino de error/timeout **unit-testeado donde vive la lógica** (`http.ts`): mapeo a `ApiError`
      (`network`/`http`/`timeout`). **Decisión:** no se añade test unitario de pantalla porque
      `src/presentation/screens/**` está **excluido de cobertura a propósito** (Strategic Coverage
      100/80/0, US-35) y se verifica por **E2E** (`e2e/onboarding.spec.ts`, multinavegador). Un test de
      pantalla aquí rompería la convención y exigiría mockear navegación/composition (sin precedente).

### Fase E — Gate, docs y cierre

- [x] ✅ Gate verde (`pnpm check`).
- [ ] 🔄 Pruebas con el usuario (manual o verificación ofrecida).
- [ ] ❌ Docs + cierre con `cerrar-feature` (SemVer app, CHANGELOG fechado, phases/memory/lecciones,
      marcar el ítem de robustez de la Fase 6).

## Riesgos / pendientes

- El timeout no debe romper la narración: la ruta de fallback a voz nativa debe seguir siendo el
  camino feliz ante error/timeout.
- Diferido a otra rama: **C-7** (política de privacidad) y **C-9** (retención/purga) del checklist de
  cumplimiento; y mejoras de arquitectura opcionales (ESLint de capas en la app, abstraer infra del store).
