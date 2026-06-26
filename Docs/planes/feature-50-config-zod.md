# Plan — Feature 50: Configuración del backend validada con Zod (US-46)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Coordinación del lote de mejoras en paralelo en
> [coordinacion-mejoras-paralelo.md](coordinacion-mejoras-paralelo.md) (feature **F-A**). Aquí va el
> **cómo** se trocea y ejecuta.
>
> Rama: `feature/50-config-zod` (desde `develop`). Historia: **US-46** (épica F, plataforma).

## Contexto

Qué existe ya (✅):

- ✅ **Config centralizada por env** en [config.ts](../../packages/backend/src/config.ts):
  `loadConfig(env)` devuelve `Config` leyendo `process.env` de forma **imperativa** con _helpers_
  sueltos (`parsePort`, `parseAiProvider`, `loadCloudApiKeys`, `loadAuthConfig`, `loadTtsConfig`) y
  **defaults de desarrollo silenciosos** (p. ej. `JWT_SECRET` ausente → `dev-insecure-…`).
- ✅ **Arranque** en [index.ts](../../packages/backend/src/index.ts): `main()` llama a `loadConfig()`
  y levanta el servidor; no valida la config ni falla temprano.
- ✅ **Zod ya disponible** en el backend (introducido por **US-44**, validación de fronteras): se
  reutiliza la misma librería; no se añade dependencia nueva.
- ✅ **Test parcial** en [config.test.ts](../../packages/backend/test/config.test.ts): hoy **solo
  cubre la parte JWT** (`auth`: defaults, override y secreto en blanco).

Qué falta (❌):

- ❌ **Validación de frontera de la config**: las variables se leen sin esquema; un tipo/valor
  inválido (`PORT` no numérico, `AI_PROVIDER` fuera de `mock|local`) se silencia con el _fallback_.
- ❌ **Fallo temprano en producción**: con `NODE_ENV=production`, un `DATABASE_URL` vacío o un
  `JWT_SECRET` ausente **no abortan** el arranque — caen al default inseguro o fallan opacamente más
  tarde (Prisma, JWT).
- ❌ **Mensajes claros**: no hay agregación de errores que diga **qué** variable falta o está mal.
- ❌ **Cobertura de tests** del nuevo comportamiento (defaults dev, override, fallo en producción,
  normalización de tipos).

### Decisiones tomadas (notas técnicas F-A, doc de coordinación)

- **Reescribir `loadConfig()` sobre un esquema Zod** que normaliza y valida las variables, con una
  **regla condicional por entorno** (`superRefine`/`refine`): en `NODE_ENV=production` los
  secretos/URLs críticos (`DATABASE_URL`, `JWT_SECRET`, …) son **obligatorios** (sin caer a defaults
  de desarrollo); en desarrollo/test se conserva el comportamiento actual (defaults seguros).
- **Falla al arrancar** ([index.ts](../../packages/backend/src/index.ts)): si la validación falla, el
  proceso **aborta** (`exit ≠ 0`) imprimiendo los errores agregados de Zod.
- **Mismo contrato `Config`**: la forma del objeto devuelto no cambia; solo cambia el _cómo_ se valida
  y deriva.
- **Solo backend.** Zod es una librería pura (sin red/SDK/telemetría) → **no afecta** a C-2/C-5
  ([cumplimiento-menores.md](../cumplimiento-menores.md)) ni al arranque reproducible: el modo por
  defecto (`AI_PROVIDER=mock`, `NODE_ENV` no productivo) sigue arrancando con
  `cp .env.example && docker compose up` sin pasos ocultos.
- **Invariante de capas**: el esquema vive en config/infraestructura, **nunca** en `/domain`
  (`no-restricted-imports` debe seguir verde).

## Historias cubiertas

- **US-46 — Configuración del backend validada con Zod**
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-46))

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha. Cada fase incluye **crear test → ejecutar test
(`pnpm check` verde) → actualizar docs** según la regla del DoD.

### Fase 0 — Andamiaje (apertura de feature) ✅

- [x] ✅ Rama `feature/50-config-zod` desde `develop` (worktree).
- [x] ✅ **Historia US-46** en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md#us-46)
      (Gherkin) + fila en la tabla de trazabilidad y listado de la épica F en
      [historias-usuario/README.md](../historias-usuario/README.md).
- [x] ✅ Este **plan** en `Docs/planes/feature-50-config-zod.md`.
- [x] ✅ `CHANGELOG` backend con `## [Unreleased]` y los 6 grupos Keep a Changelog listos.

### Fase 1 — Esquema Zod y reescritura de `loadConfig()` ❌

- [ ] ❌ Definir el **esquema Zod** de la config en `config.ts` (o módulo adyacente de config):
      modela cada variable (`NODE_ENV`, `PORT`, `LOG_LEVEL`, `AI_PROVIDER`, `OLLAMA_*`,
      `AI_TIMEOUT_MS`, `DATABASE_URL`, claves cloud, TTS, `JWT_*`) con coerción/normalización
      (`z.coerce.number()` para puertos/timeouts, `z.enum([...])` para `AI_PROVIDER`, etc.) y defaults
      de desarrollo donde hoy los hay.
- [ ] ❌ **Regla condicional por entorno** (`superRefine`): si `NODE_ENV === 'production'`, exigir
      `DATABASE_URL` y `JWT_SECRET` (y demás críticos) presentes y no-vacíos, y **prohibir** el
      `JWT_SECRET` de desarrollo (`dev-insecure-…`).
- [ ] ❌ Reescribir `loadConfig(env)` para parsear con el esquema y **derivar** el mismo contrato
      `Config` (mantener la forma actual: `auth`, `tts`, `cloudApiKeys`, …). Conservar/absorber los
      _helpers_ que sigan aportando (o sustituirlos por el esquema).
- [ ] ❌ **Mensaje claro de fallo**: al fallar la validación, agregar los `issues` de Zod en un
      `Error` legible (qué variable falta o está mal). Considerar `z.prettifyError`/`flatten`.
- [ ] ❌ **Test:** ampliar [config.test.ts](../../packages/backend/test/config.test.ts) (hoy solo
      JWT): defaults de desarrollo, override por env, **fallo en producción** por `DATABASE_URL`/
      `JWT_SECRET` ausente (espera `toThrow`), y **normalización de tipos** (`PORT` no numérico cae al
      default; `AI_PROVIDER` inválido cae a `mock`).
- [ ] ❌ **Ejecutar test** (`pnpm check` verde) + verificar que `no-restricted-imports` sigue verde
      (Zod no entra en `/domain`).

### Fase 2 — Fallo al arrancar en `index.ts` ❌

- [ ] ❌ En [index.ts](../../packages/backend/src/index.ts), envolver `loadConfig()` para que, si
      lanza, el proceso **aborte** (`process.exit(1)`) imprimiendo el mensaje de error agregado
      **antes** de intentar levantar el servidor.
- [ ] ❌ Verificar manualmente que `NODE_ENV=production` sin `DATABASE_URL`/`JWT_SECRET` aborta con
      mensaje claro, y que el modo por defecto (`AI_PROVIDER=mock`) arranca igual que hoy.
- [ ] ❌ **Test/verificación** del arranque (si procede, test del agregador de errores; el arranque
      como tal se valida a mano / en el E2E existente).

### Fase 3 — Docs + cierre con `cerrar-feature` ❌

- [ ] ❌ Revisar `.env.example` y `docker-compose.yml`: documentar qué variables son **obligatorias en
      producción** (comentario), sin secretos reales versionados.
- [ ] ❌ Actualizar [phases.md](../phases.md) si procede (estado de la mejora F-A).
- [ ] ❌ Ajustar la US-46 y la trazabilidad si el alcance final difiere de lo planeado.
- [ ] ❌ **Pruebas con el usuario** (manual u ofrecer verificación automatizada) — último paso antes
      del cierre (regla del DoD).
- [ ] ❌ Cerrar con la skill **`cerrar-feature`** (gate verde con `pnpm check`, versionado **diferido**
      vía skill `versionar`, `CHANGELOG` por paquete, docs). **No** ejecutar `git flow feature finish`
      sin confirmación explícita del usuario.

## Definition of Done (feature)

- `pnpm check` verde (typecheck + lint + format:check + tests).
- `config.test.ts` ampliado: defaults dev, override, fallo en producción, normalización de tipos.
- US-46 creada + trazabilidad en `historias-usuario/README.md` (hecho en Fase 0).
- Arranque reproducible ([US-06](../historias-usuario/epic-f-plataforma.md#us-06)) intacto en modo por
  defecto; `no-restricted-imports` verde (Zod fuera de `/domain`).
- Pruebas con el usuario antes del cierre; `finish` solo tras confirmación explícita.
