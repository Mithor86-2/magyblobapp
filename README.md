# magyblobapp

App infantil bilingüe (ES/EN) que crea perfiles de niño y genera **cuentos** y
**actividades** personalizados con IA, con arquitectura limpia y modos de IA
intercambiables: un **modo base por env** (`mock` | `local` con Ollama + Gemma 2B)
más un modo **`cloud`** (proveedor compatible con OpenAI, p. ej. Groq) que viene
**ON por defecto** y es conmutable en caliente desde la base de datos; si falta la
API key, cae automáticamente al modo base (ver más abajo).

Proyecto de TFM. El plan por fases está en
[Docs/plan-ejecucion-master.md](Docs/plan-ejecucion-master.md) y la guía para
agentes en [CLAUDE.md](CLAUDE.md).

## Descargar la app (Android)

**APK lista para instalar:** [Releases → v1.4.0](https://github.com/Mithor86-2/magyblobapp/releases/latest)
→ descarga **`magyblob-v1.4.0.apk`** ([enlace directo](https://github.com/Mithor86-2/magyblobapp/releases/download/v1.4.0/magyblob-v1.4.0.apk)).

En el móvil: abre el `.apk` y permite «instalar apps de orígenes desconocidos»; o por cable
`adb install magyblob-v1.4.0.apk`. La app apunta al **backend de producción**; la primera
petición tras un rato de inactividad tarda ~50 s (_cold start_ del plan gratuito de Render).

> El build se genera con **EAS Build** (perfil `preview`, ver [Desplegar la app (Expo)](#desplegar-la-app-expo)).

## Funcionalidades

- **Onboarding y sesión** — alta del adulto con consentimiento, **login** por email
  y **sesión JWT** (access + refresh); **multi-perfil** de niños bajo un mismo adulto.
- **Cuentos con IA** — generación personalizada por perfil (tema + estilo) en el idioma
  del niño, con **portada** ilustrada (Gemini/Imagen, con respaldo local por tema).
- **Actividades con IA** — recomendaciones por edad/intereses con instrucciones paso a
  paso; marcado de "Realizado" con valoración.
- **Narración (TTS)** — escucha del cuento con ElevenLabs (con respaldo a la voz nativa
  del dispositivo).
- **Historial** — cuentos leídos y actividades completadas, con fecha de generación,
  **búsqueda de texto** (título, cuerpo, descripción, tema, estilo, categoría) y **filtros**
  por tema/estilo/categoría y "solo favoritos"; relectura de cuentos.
- **Favoritos** — marca cuentos y actividades con una **estrella** (desde la lectura, el
  historial y la tarjeta de actividad).
- **Modo anónimo** — probar cuentos y actividades sin cuenta (rate-limited por IP).
- **Bilingüe ES/EN** — toda la interfaz; el idioma lo elige el adulto (no el dispositivo).
- **Privacidad y menores** — gate parental, minimización de datos a terceros y modos de IA
  que por defecto no sacan datos (ver [Docs/cumplimiento-menores.md](Docs/cumplimiento-menores.md)).

## Requisitos

- Node.js ≥ 24 y pnpm (vía `corepack enable`)
- Docker + Docker Compose

## Despliegue: mapa rápido

Los pasos completos están repartidos por escenario. Esta tabla es el índice; cada celda
enlaza a la sección con el detalle paso a paso.

| Componente  | Desarrollo (local)                                                                                                                 | Producción                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Backend** | [Arranque rápido (Docker)](#arranque-rápido-docker) · [Dev con `tsx`](#desarrollo-del-backend-con-tsx-sin-la-pila-docker-completa) | [Desplegar el backend en producción](#desplegar-el-backend-en-producción-neon--render--groq) (Neon + Render + Groq) |
| **App**     | [App móvil (Expo)](#app-móvil-expo)                                                                                                | [Desplegar la app (Expo)](#desplegar-la-app-expo) (web export / EAS Build)                                          |

> **Local funciona sin nada externo:** `cp .env.example .env && docker compose up` levanta
> backend + PostgreSQL + Ollama en modo `mock` (sin GPU, sin claves). Producción es un camino
> aparte (BD gestionada + IA cloud). La guía de producción ampliada vive en
> [Docs/despliegue.md](Docs/despliegue.md).

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

| Método y ruta                          | Auth | Descripción                                   |
| -------------------------------------- | ---- | --------------------------------------------- |
| `GET /health`                          | —    | Estado del servicio                           |
| `POST /guardians`                      | —    | Alta del adulto (+ consentimiento) + sesión   |
| `POST /guardians/login`                | —    | Login por email → sesión (access + refresh)   |
| `POST /guardians/refresh`              | —    | Renueva el access token con el refresh token  |
| `GET /guardians/:id/profiles`          | 🔒   | Lista los perfiles de un adulto               |
| `POST /profiles`                       | 🔒   | Crea el perfil de un niño                     |
| `POST /stories`                        | 🔒   | Genera y persiste un cuento para un perfil    |
| `POST /stories/:id/read`               | 🔒   | Marca un cuento como leído                    |
| `POST /stories/:id/favorite`           | 🔒   | Marca/desmarca un cuento como favorito        |
| `GET /stories/:id/narration`           | 🔒   | Narración del cuento (`audio/mpeg`, US-22)    |
| `POST /activities/recommend`           | 🔒   | Recomienda actividades para un perfil         |
| `POST /activities/:id/complete`        | 🔒   | Marca una actividad como hecha (+ valoración) |
| `POST /activities/:id/favorite`        | 🔒   | Marca/desmarca una actividad como favorita    |
| `GET /profiles/:profileId/history`     | 🔒   | Historial (cuentos + actividades) del perfil  |
| `POST /stories/anonymous`              | —    | Cuento sin cuenta (rate-limited por IP)       |
| `POST /activities/recommend/anonymous` | —    | Actividades sin cuenta (rate-limited por IP)  |
| `GET /settings/tts/voices`             | —    | Voces de narración configuradas por idioma    |

> Rutas principales; el detalle (parámetros, esquemas y más ejemplos) vive en Docs/api.md.

> **Secreto JWT:** se firma con `JWT_SECRET` (env). Si se deja vacío hay un secreto **solo de
> desarrollo** (arranque reproducible sin pasos extra); en producción fíjalo a un valor aleatorio.
> Vida de tokens: `JWT_ACCESS_TTL` (def. `15m`) / `JWT_REFRESH_TTL` (def. `7d`).

## Desplegar el backend en producción (Neon + Render + Groq)

El backend se despliega como **web service Docker en [Render](https://render.com)** (rama `main`), con
PostgreSQL gestionado en **[Neon](https://neon.tech)** e IA cloud en **[Groq](https://groq.com)** (todo
en plan free). La infraestructura está declarada como código en [`render.yaml`](render.yaml). Pasos
(guía ampliada con notas operativas en [Docs/despliegue.md](Docs/despliegue.md)):

**1) Base de datos en Neon (PostgreSQL 16).** Crea un proyecto, elige PostgreSQL 16 y una región
cercana a la del backend (Render Frankfurt → región europea). Copia la _connection string_ del rol;
usa la variante **pooled** (host con sufijo `-pooler`) y asegúrate de que incluye `sslmode=require`:

```text
postgresql://<usuario>:<password>@ep-xxxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require
```

Esa cadena es el secreto `DATABASE_URL` del paso 2. _Recomendado:_ prueba primero contra una **rama de
Neon** (copia copy-on-write) y solo apunta producción a la base principal cuando las migraciones apliquen
bien.

**2) Backend en Render (Blueprint, IaC).** Con [`render.yaml`](render.yaml) en la raíz de `main`: en
Render **New → Blueprint**, conecta el repo y selecciona `main`. Render propone el servicio
`magyblob-backend` y pedirá los **secretos** marcados `sync: false`. Rellénalos y crea el Blueprint
(build con el Dockerfile, contexto = raíz). Variables:

| Variable                             | Valor                                                      | Origen              |
| ------------------------------------ | ---------------------------------------------------------- | ------------------- |
| `DATABASE_URL`                       | _connection string_ de Neon (`-pooler`, `sslmode=require`) | **Secreto** (panel) |
| `JWT_SECRET`                         | valor largo y aleatorio (`openssl rand -base64 48`)        | **Secreto** (panel) |
| `GROQ_API_KEY`                       | API key de Groq                                            | **Secreto** (panel) |
| `ELEVENT_LABS_API`                   | API key de ElevenLabs (narración, US-22). **Opcional**     | **Secreto** (panel) |
| `GEMINI_API_KEY`                     | API key de Gemini para portadas (US-59). **Opcional**      | **Secreto** (panel) |
| `NODE_ENV` / `PORT` / `LOG_LEVEL`    | `production` / `3000` / `info`                             | fijos (blueprint)   |
| `AI_PROVIDER` / `AI_TIMEOUT_MS`      | `mock` / `60000`                                           | fijos (blueprint)   |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | `15m` / `7d`                                               | fijos (blueprint)   |

> En `NODE_ENV=production`, `DATABASE_URL` es **obligatoria**: la validación Zod aborta el arranque si
> falta. `JWT_SECRET` también debe fijarse (sin él degrada a un secreto inseguro con WARNING). Ollama
> **no** va a producción (plan free sin GPU): de ahí `AI_PROVIDER=mock` + modo cloud para la calidad real.
> `ELEVENT_LABS_API` y `GEMINI_API_KEY` son **opcionales**: con la primera `GET /stories/:id/narration`
> devuelve audio de ElevenLabs (sin ella, voz nativa del dispositivo); con la segunda los cuentos llevan
> **portada** generada por Gemini/Imagen (sin ella, respaldo local por tema — además, Imagen requiere un
> plan de pago de Google). La voz por idioma se afina con `ELEVENLABS_VOICE_ID_ES` / `ELEVENLABS_VOICE_ID_EN`
> (ver [.env.example](.env.example)).

**3) IA cloud con Groq.** Crea una API key en [console.groq.com](https://console.groq.com) y ponla como
secreto `GROQ_API_KEY`. El modo cloud (`target` Groq) ya viene **activo por defecto** en la BD (AppSetting
`ai.cloud`, sembrado por migración): con la key, cuentos y actividades se generan con Groq; **sin la key**,
el backend cae al modo base (`mock`) automáticamente. Es conmutable en caliente desde la BD.

**4) Migraciones.** No hay paso manual: el `CMD` del [Dockerfile](packages/backend/Dockerfile) ejecuta
`prisma migrate deploy && node dist/index.js`, así que cada deploy aplica las migraciones pendientes al
arrancar. Míralo en los **Logs** de Render.

> _(Alternativa sin Blueprint: **New → Web Service**, runtime Docker, branch `main`, Root Directory
> **vacío**, Dockerfile Path `packages/backend/Dockerfile`, Health Check Path `/health`, region
> Frankfurt, plan Free, y las mismas variables a mano.)_

### Validar el backend en producción

La forma más rápida de comprobar que un despliegue está sano es con los **endpoints públicos** (sin
token), que ejercitan toda la pila (Fastify → Neon → Groq):

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

## Desarrollo del backend con `tsx` (sin la pila Docker completa)

Para iterar el backend sin levantar toda la pila en contenedores, córrelo con `tsx` en watch y usa
**solo un PostgreSQL**. Lo más cómodo es levantar **únicamente ese servicio** con Docker (también vale
un Postgres instalado en local o el de Neon, ajustando `DATABASE_URL`):

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

La app `@magyblob/app` ("Aprendizaje Mágico", Expo + React Navigation + Zustand) cubre el
producto completo, no solo el slice del HITO 1. Navegación en dos niveles:

- **Onboarding / sesión:** bienvenida → **alta o login** del adulto → selección o creación de
  perfil. La sesión (JWT) se persiste y soporta **multi-perfil**.
- **Pestañas principales** (con perfil activo): **Inicio · Actividades · Cuentos · Historial**.
- **Extras:** **modo anónimo** (probar sin cuenta), **zona de adultos tras gate parental**,
  **lector de cuentos** (relectura desde el historial), **narración** por voz, **portadas** de
  imagen e interfaz **bilingüe ES/EN** (idioma elegido por el adulto).

```bash
pnpm up:local                                    # backend + PostgreSQL + Ollama (AI_PROVIDER=local)
# (una vez) pnpm ollama:setup                     # baja gemma:2b al contenedor de Ollama

cp packages/app/.env.example packages/app/.env   # ajusta EXPO_PUBLIC_API_URL si usas móvil físico
pnpm --filter @magyblob/app start                # Expo (i = iOS sim, a = Android, w = web)
```

> En simulador iOS `localhost` sirve. Desde un **móvil físico** (Expo Go) pon la IP LAN
> del ordenador en `EXPO_PUBLIC_API_URL`. Detalle en [packages/app/README.md](packages/app/README.md).
>
> **Variables opcionales de la app** (`packages/app/.env`): `EXPO_PUBLIC_SENTRY_DSN` activa el
> reporte de errores (sin DSN no se inicializa). Ver [packages/app/.env.example](packages/app/.env.example).

## Desplegar la app (Expo)

La app es un cliente que apunta al backend por **`EXPO_PUBLIC_API_URL`** (se _inlinea_ en build-time).
Para producción, en `packages/app/.env` apúntala a tu backend de Render:

```bash
EXPO_PUBLIC_API_URL=https://magyblobapp.onrender.com
```

**Web** (lo más simple para una demo) — export estático que se sube a cualquier hosting
(Vercel / Netlify / Render Static / GitHub Pages):

```bash
pnpm --filter @magyblob/app exec expo export --platform web   # genera packages/app/dist
```

**APK / IPA nativo con EAS Build** (incluye el icono y el splash propios):

```bash
cd packages/app
npx eas-cli login                                  # una vez
npx eas-cli build:configure                        # una vez (crea eas.json)
npx eas-cli build -p android --profile preview     # APK instalable en el emulador/dispositivo
npx eas-cli build -p ios --profile preview         # requiere cuenta de Apple Developer
```

**Ver el icono/splash en un build local** (sin EAS): `npx expo prebuild --clean && npx expo run:android`.

> Fija `EXPO_PUBLIC_API_URL` **antes** de exportar/compilar: el valor se incrusta en el bundle. La app
> no descarga recursos en runtime; iconos, imágenes y traducciones van empaquetados (cumplimiento de
> menores). El idioma de la interfaz lo elige la persona adulta (por defecto español); no depende del
> dispositivo.

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
