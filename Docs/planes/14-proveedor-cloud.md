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
  repo + doc, _gold-plating_).
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

- **US-14 — Proveedor cloud opcional** (reactivada; antes _Descartada_)
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

- [x] ✅ B1 · `CloudProvider` (compatible OpenAI `/chat/completions`, `response_format: json_object`,
      `AbortSignal`) implementando `AIProvider`, reutilizando `prompts.ts` y el parseo/saneo
      compartido `parseResponse.ts` (extraído de `OllamaProvider` para no duplicar). + test con doble
      de `fetch`.
- [x] ✅ B2 · Registro de **presets** en `cloudPresets.ts` (`groq`, `gemini`, `openrouter`,
      `cerebras`): `{ baseUrl, apiKeyEnv }`. La key se lee de `process.env[apiKeyEnv]`.
- [x] ✅ B3 · `cloudSettings.ts`: `parseCloudSetting`/`readCloudSetting` de la clave `ai.cloud`
      (JSON `{activo,target,model}`), devuelve `null` si falta/ inválida/target desconocido. + test.
- [x] ✅ B4 · `createAIProvider` con `HotSwapAIProvider`: resuelve `cloud` **por petición** (cambio en
      caliente). **Decisión refinada:** cloud NO se activa por `AI_PROVIDER` sino solo por BD
      (`ai.cloud.activo`), para preservar privacidad por defecto. `config.ts` añade `cloudApiKeys`
      (keys por target leídas de env). + tests de la factoría (hot-swap, sin key, fallback).
- [x] ✅ B5 · `.env.example` documenta las `<TARGET>_API_KEY` (solo secretos) y que el modo se activa
      en BD. Seed idempotente de `ai.cloud` **desactivado** por defecto.
- [ ] 🔜 B6 · `AuditLog` al cambiar el proveedor: **diferido a la sub-feature de UI admin** (en esta
      fase el cambio es manual por SQL/seed, sin endpoint que auditar). Anotado en "Fuera de alcance".

### Fase C — Verificación y cierre

- [x] ✅ C1 · Tests en verde: `cloud-provider` (5), `cloud-settings` (4), `create-ai-provider`
      ampliado (7). Gate `pnpm check` verde (92 tests backend + app, typecheck, lint, formato).
- [x] ✅ C2 · Smoke `pnpm ai:smoke:cloud` (script `scripts/smoke-cloud.ts`, key en env) ejecutado
      contra **Groq** real (`llama-3.3-70b-versatile`): cuento en español + 3 actividades con
      categorías válidas. Fallback a mock (sin key / HTTP error) cubierto por los tests de la
      factoría.
- [ ] ❌ C3 · `pnpm check` verde + `docker compose up` levanta la pila (con `cloud` OFF por defecto).
- [ ] ❌ C4 · Docs + `CHANGELOG.md` (backend) + versión SemVer + cierre con **`cerrar-feature`**.
- [ ] ❌ C5 · Pruebas con el usuario (regla de seguridad) → confirmación → `git flow feature finish`.

## Fuera de alcance (posibles sub-features posteriores)

- **UI admin de cambio en caliente** (app, tras puerta parental) para editar `ai.cloud` sin SQL.
  Implicaría endpoint admin + pantalla + `AuditLog` del cambio. Se difiere; esta feature deja la
  base por BD lista para ello.
- Proveedores de pago con DPA/no-entrenamiento (Claude/OpenAI) para datos reales de menores.
