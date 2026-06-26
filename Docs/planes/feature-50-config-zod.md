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

#### Decisión: preservar `docker compose up` (requisito duro del DoD)

El `docker-compose.yml` arranca el backend con `NODE_ENV=production` y `JWT_SECRET` **vacío por
defecto** (`${JWT_SECRET:-}`). Si la validación tratara un `JWT_SECRET` ausente/inseguro como **error
fatal** en producción, la pila **no levantaría en limpio** (`clone → cp .env.example .env →
docker compose up`), rompiendo el requisito reproducible.

Por eso la regla estricta de producción se aplica **solo a `DATABASE_URL`** (genuinamente requerida:
sin BD el backend no funciona y `docker-compose` siempre la inyecta). El **secreto JWT inseguro/vacío
sigue degradando al default de desarrollo con un WARNING** (no aborta) — exactamente el comportamiento
previo, ahora con aviso explícito. `loadConfig(env, warn?)` recibe un sumidero de avisos inyectable
(`ConfigWarn`, por defecto `console.warn` con prefijo `WARNING`) para no acoplar la config a pino y
para poder espiarlo en los tests. La validación estricta se reserva, pues, a **variables genuinamente
requeridas** (`DATABASE_URL`) y a los **formatos** (enums, números coaccionados), no a los secretos
que tienen un default de arranque.

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

### Fase 1 — Esquema Zod y reescritura de `loadConfig()` ✅

- [x] ✅ Definir el **esquema Zod** de la config en `config.ts` (`envSchema`): modela cada variable
      (`NODE_ENV`, `PORT`, `LOG_LEVEL`, `AI_PROVIDER`, `OLLAMA_*`, `AI_TIMEOUT_MS`, `DATABASE_URL`,
      claves cloud, TTS, `JWT_*`) con coerción/normalización (`z.coerce.number().int().positive()`
      tolerante para puertos/timeouts vía helper `enteroPositivoConDefecto`, `z.enum(['mock','local'])`
      para `AI_PROVIDER`, `cadenaConDefecto`/`cadenaOpcional` para el resto) y defaults de desarrollo
      donde hoy los hay.
- [x] ✅ **Regla condicional por entorno** (`superRefine`): si `NODE_ENV === 'production'`, exigir
      `DATABASE_URL` presente y no-vacía (fallo fatal con mensaje claro). **Matiz de diseño** (ver
      "Decisión: preservar `docker compose up`" abajo): `JWT_SECRET` ausente/inseguro **no** es fatal
      ni en producción — degrada al secreto de desarrollo con **WARNING**, para no romper el arranque
      reproducible. Lo estrictamente requerido en producción es `DATABASE_URL`.
- [x] ✅ Reescribir `loadConfig(env, warn?)` para parsear con el esquema y **derivar** el mismo
      contrato `Config` (forma intacta: `auth`, `tts`, `cloudApiKeys`, …). Helpers imperativos
      (`parsePort`, `parseAiProvider`, `loadCloudApiKeys`, `loadAuthConfig`, `loadTtsConfig`) sustituidos
      por el esquema + `leerClavesCloud`/`resolverSecretoJwt`.
- [x] ✅ **Mensaje claro de fallo**: `ConfigError` envuelve el detalle agregado de
      `z.prettifyError(result.error)` (qué variable falta o está mal, con `path`).
- [x] ✅ **Test:** ampliado [config.test.ts](../../packages/backend/test/config.test.ts) (19 casos):
      defaults de desarrollo, override por env, recorte, claves cloud, **normalización de tipos**
      (`PORT`/`AI_TIMEOUT_MS` inválido cae al default; `AI_PROVIDER` fuera de `mock|local` cae a
      `mock`), auth JWT, y **producción**: `DATABASE_URL` ausente/vacía ⇒ `toThrow(ConfigError)`;
      degradación de `JWT_SECRET` con WARNING (espía `warn`); no aborta fuera de producción.
- [x] ✅ **`pnpm check` verde** (typecheck + lint + format:check + 219 tests backend / 98 app);
      `no-restricted-imports` sigue verde (Zod vive en config/infraestructura, no en `/domain`).

### Fase 2 — Fallo al arrancar en `index.ts` ✅

- [x] ✅ En [index.ts](../../packages/backend/src/index.ts), `loadConfigOrExit()` envuelve
      `loadConfig()`: si lanza `ConfigError`, imprime el mensaje agregado por `console.error` y
      **aborta** (`process.exit(1)`) **antes** de construir el servidor; cualquier otro error se
      re-lanza.
- [x] ✅ Comportamiento verificado por los tests de producción de `config.test.ts` (la validación que
      dispara el `exit` se prueba a nivel de `loadConfig`); el arranque real en `mock` se cubre con el
      E2E existente y el `docker compose up`.

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
