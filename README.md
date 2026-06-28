# magyblobapp

App infantil bilingüe (ES/EN) que crea perfiles de niño y genera cuentos /
recomienda actividades usando un LLM **local** (Ollama + Gemma 2B), con
arquitectura limpia y modos de IA intercambiables: `mock` y `local` (el modo
base, por env) más un modo **`cloud` opcional** (opt-in, OFF por defecto,
conmutable desde la base de datos — ver más abajo).

Proyecto de TFM. El plan por fases está en
[Docs/plan-ejecucion-master.md](Docs/plan-ejecucion-master.md) y la guía para
agentes en [CLAUDE.md](CLAUDE.md).

## Requisitos

- Node.js ≥ 24 y pnpm (vía `corepack enable`)
- Docker + Docker Compose

## Arranque rápido (Docker)

```bash
cp .env.example .env          # ajusta valores si hace falta
docker compose up --build     # backend + PostgreSQL 16 + Ollama
```

Eso es todo: el backend **aplica las migraciones de la base de datos al arrancar**
(`prisma migrate deploy`) y queda en <http://localhost:3000> (healthcheck en `/health`).

Comprobación rápida:

```bash
curl http://localhost:3000/health         # -> {"status":"ok","service":"magyblob-backend"}
```

> **Modo de IA por defecto: `mock`** — la app funciona sin GPU ni modelo descargado,
> así que un evaluador puede correr todo el flujo tal cual. Para generar cuentos con el
> LLM local real, ver la sección siguiente.

**Atajos (scripts):** levantan la pila, esperan a `/health` y dejan todo listo en un
solo comando. El de local además descarga `gemma:2b` si falta.

| Comando         | Qué hace                                                            |
| --------------- | ------------------------------------------------------------------- |
| `pnpm up:mock`  | Pila completa en modo **mock** (sin GPU ni modelo).                 |
| `pnpm up:local` | Pila completa en modo **local**: descarga `gemma:2b` y usa IA real. |
| `pnpm down`     | Para la pila (los datos persisten en los volúmenes).                |

Para parar la pila: `docker compose down` o `pnpm down` (los datos persisten en los volúmenes).

## Cambiar a IA local (Ollama + `gemma:2b`)

> **Atajo:** `pnpm up:local` hace todo lo de esta sección por ti (descarga el modelo si
> falta y levanta el backend en modo local). Lo de abajo es el detalle manual equivalente.

El modo de IA lo resuelve el backend al arrancar según la variable `AI_PROVIDER`
(`mock | local`); **no hay que tocar código**. Para usar el LLM local hacen
falta dos cosas: descargar el modelo y poner `AI_PROVIDER=local`.

```bash
# 1) Descargar gemma:2b dentro del contenedor de Ollama (~1.7 GB, una sola vez).
#    Requiere que la pila (o al menos el servicio ollama) esté levantada.
pnpm ollama:setup
```

Luego, **una de estas dos formas**:

**a) Persistente (vía `.env`)** — queda fijado para próximos arranques:

```bash
# Edita .env y cambia:  AI_PROVIDER=mock  ->  AI_PROVIDER=local
docker compose up -d backend     # recrea el backend para tomar el nuevo valor
```

**b) Puntual (sin tocar `.env`)** — solo para este arranque:

```bash
AI_PROVIDER=local docker compose up -d backend
```

> - Docker Compose lee `.env` automáticamente (el compose usa `${AI_PROVIDER:-mock}`).
> - Si Ollama no responde o el modelo no está, el backend **cae automáticamente al
>   mock** (la petición nunca falla por la IA) — por eso conviene hacer `pnpm ollama:setup`
>   antes de cambiar a `local`.
> - La primera generación con `gemma:2b` tarda ~15 s; las siguientes van más rápidas
>   (el modelo ya queda cargado en memoria).
> - El modelo se puede cambiar con `OLLAMA_MODEL` en `.env` (por defecto `gemma:2b`).

## Modo cloud (ON por defecto)

El modo **`cloud`** genera con un proveedor de IA en la nube **compatible con OpenAI** (Groq, Gemini,
OpenRouter, Cerebras…) y viene **activado por defecto** (target `groq`): el AppSetting `ai.cloud` se
**siembra activo** mediante una migración que se aplica al arrancar. La activación **no** depende de
`AI_PROVIDER` (que sigue fijando el modo base `mock`/`local` de _fallback_), sino de ese registro en
la BD, conmutable en caliente.

> ⚠️ **Desviación de privacidad asumida (TFM).** Con una API key presente, el modo cloud **saca datos
> minimizados del perfil a un tercero** (edad, intereses, idioma; nunca nombre ni identificadores) y
> rompe la privacidad por diseño; los _free tiers_ pueden entrenar con ellos. **Sin key, el backend
> cae al modo base** (mock/local) y no sale nada. Ver
> [Docs/cumplimiento-menores.md](Docs/cumplimiento-menores.md) (C-5) y
> [ADR 0002](Docs/ADR/0002-tres-modos-de-ia.md).

Para **usarlo** solo necesitas la API key del target por defecto (`groq`) en `.env`:

```bash
echo 'GROQ_API_KEY=gsk_...' >> .env
docker compose up -d backend          # recrea el backend para tomar la key
```

El registro `ai.cloud` ya queda cargado en una BD nueva (`docker compose up`); en una BD previa se
puede sembrar con `pnpm prisma:seed` (idempotente).

**Cambiar de target o desactivarlo** (conmutable en caliente, aplica en la siguiente generación):

```bash
docker exec magyblobapp-postgres-1 psql -U magyblob -d magyblob -c \
  "UPDATE app_settings SET value = '{\"activo\":false,\"target\":\"groq\",\"model\":\"llama-3.3-70b-versatile\"}', \"actualizadoEn\" = now() WHERE key = 'ai.cloud';"
```

Targets y su variable de entorno: `groq` (`GROQ_API_KEY`), `gemini` (`GEMINI_API_KEY`), `openrouter`
(`OPENROUTER_API_KEY`), `cerebras` (`CEREBRAS_API_KEY`). Si el proveedor falla o falta la key, el
backend **cae al modo base** (mock/local).

Smoke test directo contra el proveedor real (sin BD, lee la key de `.env`):

```bash
pnpm ai:smoke:cloud                                          # target groq por defecto
SMOKE_CLOUD_TARGET=gemini SMOKE_CLOUD_MODEL=gemini-2.0-flash pnpm ai:smoke:cloud
```

## Probar la API

Los endpoints, parámetros y ejemplos `curl` están en **[Docs/api.md](Docs/api.md)**. Las rutas de
datos exigen un **access token JWT** (US-45): el alta y el login lo emiten y se envía como
`Authorization: Bearer`. Flujo mínimo (alta → crear perfil → generar cuento):

```bash
BASE=http://localhost:3000
# El alta es pública y devuelve la sesión (auto-login): capturamos id y accessToken.
ALTA=$(curl -s -X POST $BASE/guardians -H "Content-Type: application/json" -d '{
  "nombre":"Ana","apellidos":"García","email":"ana@example.com",
  "parentesco":"madre","consentimientoAceptado":true,"consentimientoVersion":"v1"
}')
GID=$(echo "$ALTA" | jq -r .id); TOKEN=$(echo "$ALTA" | jq -r .accessToken)
PID=$(curl -s -X POST $BASE/profiles \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{
  \"guardianId\":\"$GID\",\"nombre\":\"Mateo\",\"edad\":4,\"idioma\":\"es\",
  \"avatar\":\"a1\",\"intereses\":[\"animales\"]
}" | jq -r .id)
curl -s -X POST $BASE/stories \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{
  \"profileId\":\"$PID\",\"temas\":[\"animales\"],\"estilos\":[\"aventura\"]
}" | jq
```

| Método y ruta                 | Auth | Descripción                                  |
| ----------------------------- | ---- | -------------------------------------------- |
| `GET /health`                 | —    | Estado del servicio                          |
| `POST /guardians`             | —    | Alta del adulto (+ consentimiento) + sesión  |
| `POST /guardians/login`       | —    | Login por email → sesión (access + refresh)  |
| `POST /guardians/refresh`     | —    | Renueva el access token con el refresh token |
| `GET /guardians/:id/profiles` | 🔒   | Lista los perfiles de un adulto              |
| `POST /profiles`              | 🔒   | Crea el perfil de un niño                    |
| `POST /stories`               | 🔒   | Genera y persiste un cuento para un perfil   |

> **Secreto JWT:** se firma con `JWT_SECRET` (env). Si se deja vacío hay un secreto **solo de
> desarrollo** (arranque reproducible sin pasos extra); en producción fíjalo a un valor aleatorio.
> Vida de tokens: `JWT_ACCESS_TTL` (def. `15m`) / `JWT_REFRESH_TTL` (def. `7d`).

## Validar el backend en producción

El backend se despliega en **Render** (rama `main`) con PostgreSQL en **Neon** e IA cloud en **Groq**
(guía completa en **[Docs/despliegue.md](Docs/despliegue.md)**). La forma más rápida de comprobar que un
despliegue está sano es con los **endpoints públicos** (sin token), que ejercitan toda la pila
(Fastify → Neon → Groq):

```bash
BASE=https://magyblobapp.onrender.com   # tu URL de Render

# 1) Salud: debe responder 200. La 1ª petición tras inactividad tarda ~50 s (cold start del plan free).
curl -s $BASE/health
# → {"status":"ok","service":"magyblob-backend"}

# 2) Cuento anónimo (texto real por Groq). 201 + proveedor "cloud" = IA cloud OK.
curl -s -X POST $BASE/stories/anonymous -H "Content-Type: application/json" \
  -d '{"edad":5,"idioma":"es","temas":["magia"],"estilos":["divertido"]}' | jq '{titulo, proveedor}'

# 3) Actividades anónimas: deben traer "instrucciones" y proveedor "cloud".
curl -s -X POST $BASE/activities/recommend/anonymous -H "Content-Type: application/json" \
  -d '{"edad":5,"idioma":"es","cantidad":1}' | jq '.[0] | {titulo, instrucciones, proveedor}'
```

Señales de que **todo funciona**: `/health` → `200`; el cuento y las actividades llegan con
`"proveedor":"cloud"` (Groq activo) y las actividades incluyen `instrucciones`. Si `proveedor` fuese
`mock`, falta o es inválida la `GROQ_API_KEY` en Render (cae al modo base). El **rate-limit anónimo** es
3 cuentos + 3 actividades por IP: un `429` significa que se agotó (esperado).

Comprobaciones adicionales (requieren configuración):

- **Migraciones:** se aplican solas al arrancar (`prisma migrate deploy` en el `CMD` del contenedor);
  míralo en los **Logs** de Render.
- **Flujo con sesión** (alta con contraseña → perfil → cuento con portada): igual que el ejemplo de
  _Probar la API_ pero con `BASE` apuntando a Render.
- **Narración (ElevenLabs, US-22):** `GET /stories/:id/narration` devuelve `audio/mpeg` solo si
  `ELEVENT_LABS_API` está configurada en Render; si no, responde error y la app usa la voz nativa.
- **Portadas (Gemini/Imagen, US-59):** requieren `GEMINI_API_KEY` **y un plan de pago** de Google
  (Imagen no está en el _free tier_); sin ello la app usa el respaldo local por tema.

## Desarrollo local (sin Docker)

Necesitas una base de datos PostgreSQL. Lo más cómodo es levantar solo ese servicio
con Docker y correr el backend con `tsx`:

```bash
pnpm install                                  # instala y genera el cliente Prisma (postinstall)
docker compose up -d postgres                 # PostgreSQL en localhost:5432

# Prepara la base de datos (una vez):
pnpm --filter @magyblob/backend prisma:migrate   # aplica las migraciones
pnpm --filter @magyblob/backend prisma:seed      # opcional: carga AppSetting (prompts, params)

pnpm dev                                      # backend en watch (tsx) en :3000
```

> El **seed es opcional**: `AppSetting` solo guarda config ajustable en caliente
> (plantillas de prompt, modelo, parámetros). Si falta una clave, el backend usa el
> valor por defecto en código, así que el flujo funciona sin seed.

## App móvil (Expo)

La app `@magyblob/app` recorre el slice vertical del HITO 1:
**consentimiento del adulto → crear perfil → ver cuento generado**. Es agnóstica del
proveedor de IA (solo llama a `POST /stories`); la demo con IA local usa el backend en
modo `local`.

```bash
pnpm up:local                                    # backend + PostgreSQL + Ollama (AI_PROVIDER=local)
# (una vez) pnpm ollama:setup                     # baja gemma:2b al contenedor de Ollama

cp packages/app/.env.example packages/app/.env   # ajusta EXPO_PUBLIC_API_URL si usas móvil físico
pnpm --filter @magyblob/app start                # Expo (i = iOS sim, a = Android, w = web)
```

> En simulador iOS `localhost` sirve. Desde un **móvil físico** (Expo Go) pon la IP LAN
> del ordenador en `EXPO_PUBLIC_API_URL`. Detalle en [packages/app/README.md](packages/app/README.md).

## Comandos del monorepo

| Comando                             | Qué hace                                                  |
| ----------------------------------- | --------------------------------------------------------- |
| `pnpm check`                        | typecheck + lint + formato + tests (todo el monorepo)     |
| `pnpm typecheck`                    | `tsc --noEmit` en cada paquete                            |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (+ SonarJS: bugs y code smells en el backend)      |
| `pnpm format` / `pnpm format:check` | Prettier                                                  |
| `pnpm test`                         | Vitest en cada paquete (unitarios + integración de rutas) |
| `pnpm coverage`                     | Cobertura por tier (Strategic Coverage 100/80/0, US-35)   |

## Pruebas

El proyecto tiene tres niveles (unitario · integración · E2E). El detalle —qué cubre cada uno, cómo
se ejecutan y la guía de TDD— vive en [Docs/estrategia-pruebas.md](Docs/estrategia-pruebas.md).

El gate diario (`pnpm check`) no necesita Docker. La **integración de persistencia** y los **E2E**
sí (levantan un Postgres efímero con Testcontainers y, el E2E de app, Chromium):

| Comando                                            | Qué hace                                                     |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `pnpm --filter @magyblob/backend test:integration` | Repos Prisma contra Postgres real (Testcontainers)           |
| `pnpm --filter @magyblob/backend test:e2e`         | Backend real por HTTP + Postgres real (modo mock)            |
| `pnpm --filter @magyblob/app e2e:install`          | Descarga Chromium para Playwright (una vez)                  |
| `pnpm --filter @magyblob/app test:e2e`             | E2E de la app (Expo web + Playwright) contra el backend mock |

La **cobertura se gobierna por riesgo de negocio** (Strategic Coverage 100/80/0): `pnpm coverage`
exige **100%** en el código CORE y **80%** de baseline, con el tier INFRASTRUCTURE excluido. El
`pnpm check` local no la corre (sigue rápido); el umbral lo hace cumplir el CI. Detalle en
[Docs/estrategia-pruebas.md](Docs/estrategia-pruebas.md#strategic-coverage-100800-us-35).

En CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) se ejecutan los tres niveles en cada
push y pull request; el informe HTML de cobertura se sube como artefacto del job _gate_.

**Git hooks (Husky).** El gate se ejecuta también en local: `pre-commit` pasa `lint-staged` (ESLint
`--fix` + Prettier) sobre lo _staged_ y `pre-push` corre `pnpm check`. Se activan solos tras
`pnpm install` (script `prepare`); en una emergencia se saltan con `--no-verify`. Detalle en
[Docs/estrategia-pruebas.md](Docs/estrategia-pruebas.md#git-hooks-locales-husky).

## Estructura

```
packages/
  backend/   API Fastify + Prisma + capa de IA (Clean Architecture)
  app/       App móvil Expo + React Navigation + Zustand (slice vertical del HITO 1)
```
