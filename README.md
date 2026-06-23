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

## Modo cloud (opt-in, opcional)

Además de `mock`/`local`, existe un modo **`cloud`** que genera con un proveedor de IA en la nube
**compatible con OpenAI** (Groq, Gemini, OpenRouter, Cerebras…). Está **apagado por defecto** y, por
diseño de privacidad, **no se activa con `AI_PROVIDER`** sino desde la base de datos: así nadie lo
enciende por accidente por una variable de entorno.

> ⚠️ El modo cloud **saca datos del perfil a un tercero** (rompe la privacidad por diseño). Solo se
> envían datos minimizados (edad, intereses, idioma; nunca nombre ni identificadores), pero los
> _free tiers_ pueden entrenar con ellos. Es una función de iteración/calidad, no el modo recomendado
> para datos reales de menores. Ver [Docs/cumplimiento-menores.md](Docs/cumplimiento-menores.md).

Activarlo (ejemplo con **Groq**):

```bash
# 1) Pon la API key del proveedor en .env (solo secretos; nunca van en la BD).
echo 'GROQ_API_KEY=gsk_...' >> .env
docker compose up -d backend          # recrea el backend para tomar la key

# 2) Activa el proveedor en la BD (clave AppSetting `ai.cloud`). Conmutable en
#    caliente: el cambio aplica en la siguiente generación, sin reiniciar.
#    INSERT ... ON CONFLICT crea la fila si no existe (BD antigua) o la actualiza.
docker exec magyblobapp-postgres-1 psql -U magyblob -d magyblob -c \
  "INSERT INTO app_settings (id, key, value, descripcion, \"actualizadoEn\")
   VALUES (gen_random_uuid(), 'ai.cloud', '{\"activo\":true,\"target\":\"groq\",\"model\":\"llama-3.3-70b-versatile\"}', 'Modo cloud (opt-in)', now())
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, \"actualizadoEn\" = now();"
```

> Alternativa: `pnpm prisma:seed` (idempotente) crea la fila `ai.cloud` desactivada; luego solo
> tendrías que cambiar `"activo"` a `true`.

Targets disponibles y su variable de entorno: `groq` (`GROQ_API_KEY`), `gemini` (`GEMINI_API_KEY`),
`openrouter` (`OPENROUTER_API_KEY`), `cerebras` (`CEREBRAS_API_KEY`). Para desactivar, pon
`"activo":false`. Si el proveedor falla o falta la key, el backend **cae al modo base** (mock/local).

Smoke test directo contra el proveedor real (sin BD, lee la key de `.env`):

```bash
pnpm ai:smoke:cloud                                          # target groq por defecto
SMOKE_CLOUD_TARGET=gemini SMOKE_CLOUD_MODEL=gemini-2.0-flash pnpm ai:smoke:cloud
```

## Probar la API

Los endpoints, parámetros y ejemplos `curl` están en **[Docs/api.md](Docs/api.md)**.
Flujo mínimo (alta de adulto → crear perfil → generar cuento):

```bash
BASE=http://localhost:3000
GID=$(curl -s -X POST $BASE/guardians -H "Content-Type: application/json" -d '{
  "nombre":"Ana","apellidos":"García","email":"ana@example.com",
  "parentesco":"madre","consentimientoAceptado":true,"consentimientoVersion":"v1"
}' | jq -r .id)
PID=$(curl -s -X POST $BASE/profiles -H "Content-Type: application/json" -d "{
  \"guardianId\":\"$GID\",\"nombre\":\"Mateo\",\"edad\":4,\"idioma\":\"es\",
  \"avatar\":\"a1\",\"intereses\":[\"animales\"]
}" | jq -r .id)
curl -s -X POST $BASE/stories -H "Content-Type: application/json" -d "{
  \"profileId\":\"$PID\",\"tema\":\"animales\",\"estilo\":\"aventura\"
}" | jq
```

| Método y ruta                 | Descripción                                    |
| ----------------------------- | ---------------------------------------------- |
| `GET /health`                 | Estado del servicio                            |
| `POST /guardians`             | Alta del adulto responsable (+ consentimiento) |
| `GET /guardians/:id/profiles` | Lista los perfiles de un adulto                |
| `POST /profiles`              | Crea el perfil de un niño                      |
| `POST /stories`               | Genera y persiste un cuento para un perfil     |

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

| Comando                             | Qué hace                                              |
| ----------------------------------- | ----------------------------------------------------- |
| `pnpm check`                        | typecheck + lint + formato + tests (todo el monorepo) |
| `pnpm typecheck`                    | `tsc --noEmit` en cada paquete                        |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (+ SonarJS: bugs y code smells en el backend)  |
| `pnpm format` / `pnpm format:check` | Prettier                                              |
| `pnpm test`                         | Vitest en cada paquete                                |

## Estructura

```
packages/
  backend/   API Fastify + Prisma + capa de IA (Clean Architecture)
  app/       App móvil Expo + React Navigation + Zustand (slice vertical del HITO 1)
```
