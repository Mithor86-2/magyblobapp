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

- [ ] ❌ Añadir `AbortController` + timeout configurable a `request()` en
      [`infrastructure/http.ts`](../../packages/app/src/infrastructure/http.ts); al vencer, `ApiError`
      tipo `timeout` con mensaje amigable. Default global + override por llamada.
- [ ] ❌ Tests en `http.test.ts`: petición que excede el timeout → `ApiError('timeout')`; éxito
      antes del timeout no aborta.

### Fase B — Timeout en la narración

- [ ] ❌ Pasar `signal` con timeout (~15 s) al `fetch` de narración en
      [`useNarration`](../../packages/app/src/presentation/hooks/useNarration.ts); al vencer/fallar,
      degradar a voz nativa (comportamiento actual) sin colgarse.

### Fase C — Pulido de estados de carga/error

- [ ] ❌ `CreateProfileScreen`: estado de **carga** visible (spinner + texto) mientras crea el perfil;
      evitar envíos duplicados.
- [ ] ❌ `HistoryScreen`: **botón «Reintentar»** en el estado de error (patrón de `SelectProfileScreen`).

### Fase D — Tests de camino de error (pantalla)

- [ ] ❌ Test(s) de pantalla (`*.test.tsx`) que ejerciten el camino de error: una petición que falla/
      expira → la UI muestra el error/reintento y no rompe (al menos `StoryGenerator` o `Activities`).

### Fase E — Gate, docs y cierre

- [ ] ❌ Gate verde (`pnpm check`).
- [ ] ❌ Pruebas con el usuario (manual o verificación ofrecida).
- [ ] ❌ Docs + cierre con `cerrar-feature` (SemVer app, CHANGELOG fechado, phases/memory/lecciones,
      marcar el ítem de robustez de la Fase 6).

## Riesgos / pendientes

- El timeout no debe romper la narración: la ruta de fallback a voz nativa debe seguir siendo el
  camino feliz ante error/timeout.
- Diferido a otra rama: **C-7** (política de privacidad) y **C-9** (retención/purga) del checklist de
  cumplimiento; y mejoras de arquitectura opcionales (ESLint de capas en la app, abstraer infra del store).
