# Plan — Feature 14: Proveedor de IA en la nube (CloudProvider) configurable por BD

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Reintroduce el **tercer modo de IA** (`cloud`) que se había retirado del alcance el 2026-06-12
([ADR 0002](../ADR/0002-tres-modos-de-ia.md), commit `317e351`). La decisión se reabre a petición
del usuario: poder usar un proveedor de IA en la nube **conmutable en caliente** para iterar la
calidad de cuentos/actividades, empezando por **proveedores gratuitos** (Groq primero).

Decisiones tomadas con el usuario (y su porqué):

- **Adaptador único compatible con OpenAI**, no uno por proveedor. Groq, Gemini, OpenRouter,
  Cerebras… exponen todos el dialecto `/chat/completions`, así que un solo cliente HTTP sirve para
  todos cambiando `baseUrl + model + apiKey`. (YAGNI: una abstracción, no N.)
- **Selección por BD, no solo por env.** Se reusa la tabla existente `AppSetting`
  ([schema.prisma](../../packages/backend/prisma/schema.prisma)) con **una clave JSON** `ai.cloud`
  = `{"activo": bool, "target": "groq", "model": "..."}`. Atómica, sin estados inconsistentes.
  Se descarta crear una tabla nueva (`AppSetting` se diseñó para esto; tabla nueva = migración +
  repo + doc, *gold-plating*).
- **Secretos siempre en env, nunca en BD.** La BD guarda solo selectores no secretos
  (`target`, `model`, `activo`). El `target` mapea en **código** (registro de presets) a su
  `baseUrl` y a la **variable de entorno** que contiene la API key. Coherente con la regla de
  `AppSetting` ("secretos NO van aquí") y con US-18.
- **Opt-in, OFF por defecto.** El defecto del proyecto sigue siendo `mock`/`local` (privacidad por
  diseño). `cloud` solo se activa si `AppSetting.ai.cloud.activo = true` **y** hay key en env; si
  no, se cae al proveedor por defecto. Preserva el argumento de cumplimiento del TFM.
- **Fallback a mock** ante fallo del cloud (timeout/error/JSON inválido), reutilizando el
  `FallbackProvider` ya existente.

Qué existe ya y se reutiliza:

- ✅ Interfaz `AIProvider` en `/domain` (la "puerta abierta" que cita el ADR 0002).
- ✅ `FallbackProvider` (envuelve al proveedor activo y cae a `MockProvider`).
- ✅ `SettingsRepository` + tabla `AppSetting` (config en caliente; ya la lee `OllamaProvider`).
- ✅ `createAIProvider` (factoría por env `mock | local`) y `config.ts`.

Qué falta (❌): el adaptador `cloud`, el registro de presets, la lectura/validación de la clave
`ai.cloud`, el cableado en la factoría y la config, y la documentación (ADR, cumplimiento, modelo de
datos si aplica, historias).

## Historias cubiertas

- **US-14 — Proveedor cloud opcional** (reactivada; antes *Descartada*)
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-14))
- Apoyo: **US-18** (configuración editable vía `AppSetting`) y **US-05** (modo de IA configurable).

## Cumplimiento (app de menores) — condición de la feature

Ver [../cumplimiento-menores.md](../cumplimiento-menores.md). El modo `cloud` **rompe C-5**
("los datos del menor no salen de la máquina"), por lo que:

- Queda **OFF por defecto** y documentado como opt-in (no es el camino conforme por defecto).
- Solo se envían **datos minimizados** del perfil (edad, intereses, idioma) — nunca nombre ni
  identificadores (C-3, C-4).
- Los **tiers gratuitos suelen entrenar con los datos** (p. ej. Gemini free): se documenta el
  riesgo; el uso recomendado para datos reales exigiría proveedor con DPA/no-entrenamiento.
- Cambiar de proveedor es **acción sensible del adulto** → se registra en `AuditLog`.

## Tareas

### Fase A — Diseño y documentación de la decisión

- [x] ✅ A1 · Actualizar [ADR 0002](../ADR/0002-tres-modos-de-ia.md): nota fechada reintroduciendo
      el modo `cloud` como opt-in OFF por defecto, con selección por BD y secretos en env. (Se siguió
      el patrón de "Actualización" en el propio ADR; cuerpo y alternativas actualizados.)
- [x] ✅ A2 · Reactivar **US-14** en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md)
      con criterios Gherkin del diseño por BD + tabla de trazabilidad del
      [índice](../historias-usuario/README.md) actualizada (estado Could, fase 14, pantalla Config).
- [x] ✅ A3 · Revisar [cumplimiento-menores.md](../cumplimiento-menores.md): C-5 pasa de ✔ a
      "✔ por defecto / Cond. en `cloud`"; nota con el opt-in, datos minimizados, riesgo de
      entrenamiento de los free tiers e incompatibilidad con Apple Kids.

### Fase B — Backend: adaptador y configuración

- [ ] ❌ B1 · `CloudProvider` (compatible OpenAI `/chat/completions`) implementando `AIProvider`
      (`generateStory`, `recommendActivities`) con salida estructurada y `AbortSignal` (timeout),
      reutilizando prompts existentes. + test con doble de `fetch`/HTTP.
- [ ] ❌ B2 · Registro de **presets** en código (`groq`, `gemini`, `openrouter`, `cerebras`…):
      `{ baseUrl, apiKeyEnv }`. La key se lee de `process.env[apiKeyEnv]`.
- [ ] ❌ B3 · Lectura + **validación** de `AppSetting` clave `ai.cloud` (JSON `{activo,target,model}`)
      vía `SettingsRepository`, con valores por defecto/seguros si falta o es inválida. + test.
- [ ] ❌ B4 · Cablear `createAIProvider`: si `ai.cloud.activo` y hay key → `CloudProvider` envuelto
      en `FallbackProvider`; si no → comportamiento actual (`mock`/`local`). Ajustar `config.ts`
      (`aiProvider` admite `cloud`; presets/keys por env). + test de la factoría.
- [ ] ❌ B5 · `.env.example`: documentar `<TARGET>_API_KEY` (p. ej. `GROQ_API_KEY`) y el formato de
      la clave `ai.cloud`. Seed idempotente de `AppSetting` con `ai.cloud` desactivado por defecto.
- [ ] ❌ B6 · `AuditLog` al cambiar el proveedor (cuando exista el punto de cambio; si el cambio es
      manual por SQL/seed en esta fase, dejar anotado para la sub-feature de UI admin).

### Fase C — Verificación y cierre

- [ ] ❌ C1 · Tests (uno por unidad: `CloudProvider`, validación de `ai.cloud`, factoría) en verde.
- [ ] ❌ C2 · Smoke test manual contra **Groq** real (key en env, `ai.cloud.activo=true`): cuento en
      el idioma del perfil + actividades con categorías válidas; y verificar fallback a mock si la
      key falta o el proveedor falla.
- [ ] ❌ C3 · `pnpm check` verde + `docker compose up` levanta la pila (con `cloud` OFF por defecto).
- [ ] ❌ C4 · Docs + `CHANGELOG.md` (backend) + versión SemVer + cierre con **`cerrar-feature`**.
- [ ] ❌ C5 · Pruebas con el usuario (regla de seguridad) → confirmación → `git flow feature finish`.

## Fuera de alcance (posibles sub-features posteriores)

- **UI admin de cambio en caliente** (app, tras puerta parental) para editar `ai.cloud` sin SQL.
  Implicaría endpoint admin + pantalla + `AuditLog` del cambio. Se difiere; esta feature deja la
  base por BD lista para ello.
- Proveedores de pago con DPA/no-entrenamiento (Claude/OpenAI) para datos reales de menores.
