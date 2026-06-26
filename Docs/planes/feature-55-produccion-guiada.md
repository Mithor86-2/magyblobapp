# Plan — Feature 55: Ambiente de producción guiado (US-51)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Coordinación del lote de mejoras en paralelo en
> [coordinacion-mejoras-paralelo.md](coordinacion-mejoras-paralelo.md) (feature **F-F**, depende de
> **F-A** = config Zod, US-46, ya integrada en `develop`). Aquí va el **cómo** se trocea y ejecuta.
>
> Rama: `feature/55-produccion-guiada` (desde `develop`). Historia: **US-51** (épica F, plataforma).

## Contexto

Ambiente de producción decidido con el usuario (2026-06-26):

- **Backend en [Render](https://render.com)** — _web service_ Docker, contexto de build = **raíz del
  repo**, dockerfile [`packages/backend/Dockerfile`](../../packages/backend/Dockerfile), rama
  `main` → producción, health check `/health`, Root Directory vacío.
- **DB en [Neon](https://neon.tech)** — PostgreSQL 16 gestionado, _connection string_ con
  `sslmode=require` y host `-pooler`.
- **IA cloud con [Groq](https://groq.com)** (free tier) — reutiliza el `CloudProvider` (US-14).
  **Ollama NO va a producción** (plan free sin GPU).
- **`JWT_SECRET` obligatorio en producción** (valor largo y aleatorio en el panel de Render).
- **La app** apunta a la URL de Render vía `EXPO_PUBLIC_API_URL`.

Qué existe ya (✅):

- ✅ **Config validada con Zod** ([config.ts](../../packages/backend/src/config.ts), US-46): en
  `NODE_ENV=production` **exige `DATABASE_URL`** y avisa de `JWT_SECRET` inseguro. El runtime de
  producción ya está soportado; F-F **no toca código de runtime**.
- ✅ **Dockerfile multi-stage** con `CMD ["sh","-c","prisma migrate deploy && node dist/index.js"]`:
  las migraciones corren solas al arrancar (sin pasos ocultos). Contexto de build = raíz del repo.
- ✅ **`CloudProvider` + presets** (US-14): Groq es uno de los targets; la key se lee de env
  (`GROQ_API_KEY`), nunca de BD.
- ✅ **`getBaseUrl()`** en la app ([http.ts](../../packages/app/src/infrastructure/http.ts)):
  `EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'`.

Qué falta (❌):

- ❌ **Infra como código**: no hay `render.yaml` (Blueprint) que declare el servicio y sus variables.
- ❌ **Guía de despliegue reproducible** (Neon + Render + Groq).
- ❌ **Parametrización documentada de `EXPO_PUBLIC_API_URL`** hacia producción en el `.env.example`
  del app.
- ❌ **Excepción de cumplimiento de Groq en producción** documentada en `cumplimiento-menores.md`.

## Historias cubiertas

- **US-51 — Ambiente de producción guiado**
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-51))

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha.

### Fase 0 — Andamiaje (apertura de feature) ✅

- [x] ✅ Rama `feature/55-produccion-guiada` desde `develop` (worktree).
- [x] ✅ **Historia US-51** en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md#us-51)
      (Gherkin) + fila en la trazabilidad y listado de la épica F en
      [historias-usuario/README.md](../historias-usuario/README.md).
- [x] ✅ Este **plan** en `Docs/planes/feature-55-produccion-guiada.md`.
- [x] ✅ `CHANGELOG` backend (y app) con `## [Unreleased]` listo.
- [x] ✅ Commit de docs: `docs(planes): plan y US-51 de la feature 55 (producción guiada)`.

### Fase 1 — `render.yaml` (Blueprint IaC) ✅

- [ ] ✅ `render.yaml` en la **raíz**: un `services:` web Docker con
      `dockerfilePath: packages/backend/Dockerfile`, `dockerContext: .`, `branch: main`,
      `healthCheckPath: /health`, `region: frankfurt`, `plan: free`.
- [ ] ✅ Variables de entorno: **secretos** `sync: false` (`DATABASE_URL`, `JWT_SECRET`,
      `GROQ_API_KEY`); valores fijos para el resto (`NODE_ENV=production`, `AI_PROVIDER=mock`,
      `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `AI_TIMEOUT_MS`, `LOG_LEVEL`). **Sin secretos reales** en el
      fichero.

### Fase 2 — Guía `Docs/despliegue.md` ✅

- [ ] ✅ Guía reproducible: Neon (proyecto PG16, _connection string_ `sslmode=require` + `-pooler`),
      Render (_web service_ Docker, Root Directory vacío, contexto raíz, env vars), Groq (API key).
- [ ] ✅ Notas: migraciones que corren solas en el arranque (`CMD` del Dockerfile); **cold start** del
      plan free; **probar contra una rama de Neon** antes de `main`.

### Fase 3 — App `EXPO_PUBLIC_API_URL` a producción ✅

- [ ] ✅ Documentar/parametrizar `EXPO_PUBLIC_API_URL` hacia el backend de Render en
      [`packages/app/.env.example`](../../packages/app/.env.example) (comentado, sin romper el default
      local `http://localhost:3000`). No se tocan `.env` reales (gitignored).

### Fase 4 — Cumplimiento (Groq en producción) ✅

- [ ] ✅ En [cumplimiento-menores.md](../cumplimiento-menores.md): documentar la **excepción de Groq**
      en producción (el texto del cuento sale a un tercero) como **desviación asumida del TFM**,
      coherente con C-5 (modo cloud). Sin key → modo base (mock/local), conforme.

### Fase 5 — Verificación y cierre ❌

- [ ] ✅ Verificar que la **config Zod (US-46) no rompe** `docker compose up` ni el arranque en Render
      con los valores del blueprint (`DATABASE_URL` presente; `JWT_SECRET` requerido en prod por el
      blueprint, no por la validación que solo avisa).
- [ ] ✅ `pnpm install` + `pnpm check` verde (typecheck + lint + format:check + tests).
- [ ] ✅ Entradas en `## [Unreleased]` del CHANGELOG backend (y app).
- [ ] ❌ **Pruebas con el usuario** (despliegue real o revisión del blueprint/guía) — último paso.
- [ ] ❌ Cierre con la skill **`cerrar-feature`** (versionado **diferido** vía `versionar`). **No**
      ejecutar `git flow feature finish` sin confirmación explícita del usuario.

## Definition of Done (feature)

- `render.yaml` y `Docs/despliegue.md` creados, sin secretos reales.
- `EXPO_PUBLIC_API_URL` parametrizable a producción sin romper el default local.
- Excepción de Groq documentada en `cumplimiento-menores.md` (coherente con C-5).
- `pnpm check` verde; arranque reproducible local ([US-06](../historias-usuario/epic-f-plataforma.md#us-06))
  intacto.
- US-51 creada + trazabilidad en `historias-usuario/README.md` (hecho en Fase 0).
- Pruebas con el usuario antes del cierre; `finish` solo tras confirmación explícita.
