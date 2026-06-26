# Despliegue de producción (guía reproducible)

Ambiente de producción **guiado** del backend de magyblob (US-51). Decidido con el usuario:

- **Backend** → [Render](https://render.com) (web service Docker, plan free).
- **Base de datos** → [Neon](https://neon.tech) (PostgreSQL 16 gestionado, plan free).
- **IA en la nube** → [Groq](https://groq.com) (free tier), reutilizando el modo cloud (US-14).

La infraestructura está declarada como código en [`render.yaml`](../render.yaml) (Blueprint de
Render). Esta guía es el **cómo** paso a paso, sin pasos ocultos.

> **Local sigue igual.** Esto **no** cambia el arranque reproducible local
> ([US-06](historias-usuario/epic-f-plataforma.md#us-06)): `cp .env.example .env && docker compose up`
> levanta backend + PostgreSQL + Ollama como siempre. Producción es un camino aparte.

## Arquitectura del despliegue

```
  App Expo  ──HTTPS──>  Render (backend Docker)  ──TLS──>  Neon (PostgreSQL 16)
 EXPO_PUBLIC_API_URL         /health, /stories, …          DATABASE_URL (sslmode=require)
                                   │
                                   └──HTTPS──> Groq (modo cloud, opcional)  GROQ_API_KEY
```

- **Ollama no va a producción** (el plan free de Render no tiene GPU). En producción `AI_PROVIDER=mock`
  y la calidad real se obtiene con el **modo cloud** (Groq), que se activa desde la BD (`AppSetting`
  `ai.cloud`) y solo necesita la `GROQ_API_KEY` en el entorno.
- **Migraciones automáticas:** el `CMD` del [`Dockerfile`](../packages/backend/Dockerfile) ejecuta
  `prisma migrate deploy && node dist/index.js`, así que al arrancar el servicio aplica las migraciones
  pendientes contra la BD y luego levanta el servidor. No hay paso manual de migración.

## 1. Base de datos en Neon (PostgreSQL 16)

1. Crea una cuenta en [neon.tech](https://neon.tech) y un **proyecto** nuevo; elige **PostgreSQL 16** y
   una región cercana a la del backend (Render Frankfurt → región europea de Neon).
2. Neon crea una base `neondb` por defecto (sirve). En **Connection Details** copia la _connection
   string_ del rol de la base.
3. Usa la variante **pooled** (host con sufijo `-pooler`) y asegúrate de que lleva `sslmode=require`.
   Queda algo así:

   ```
   postgresql://<usuario>:<password>@ep-xxxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require
   ```

   - El sufijo **`-pooler`** usa el _connection pooler_ de Neon (PgBouncer), adecuado para un servicio
     web con conexiones cortas.
   - **`sslmode=require`** es obligatorio (Neon solo acepta TLS). Sin él, Prisma/Postgres rechazan la
     conexión.

4. Esta _connection string_ es el secreto **`DATABASE_URL`** que se introduce en Render (paso 3).

### Probar primero contra una rama de Neon (recomendado)

Antes de tocar la base que sirve `main`, **prueba contra una rama de Neon**: Neon permite crear una
**rama** de la base (copia copy-on-write) con su propia _connection string_. Despliega/prueba el
backend apuntando a la rama, valida que las migraciones aplican y el flujo funciona, y solo entonces
apunta producción a la base principal. Así un error de migración no daña los datos reales.

## 2. Backend en Render (web service Docker)

Hay dos formas; el Blueprint es la reproducible.

### Opción A — Blueprint (recomendada, IaC)

1. Sube la rama `main` con el [`render.yaml`](../render.yaml) en la raíz al repositorio.
2. En Render: **New → Blueprint**, conecta el repositorio y selecciona la rama `main`. Render lee
   `render.yaml` y propone el servicio `magyblob-backend`.
3. Render pedirá los **secretos** declarados con `sync: false`: `DATABASE_URL` (paso 1), `JWT_SECRET`
   (genera uno largo y aleatorio, p. ej. `openssl rand -base64 48`) y `GROQ_API_KEY` (paso 4).
4. Crea el Blueprint. Render construye con el Dockerfile (contexto = raíz) y despliega.

### Opción B — Web service manual (mismos valores)

**New → Web Service**, conecta el repo y configura:

- **Language/Runtime:** Docker.
- **Branch:** `main`.
- **Root Directory:** _vacío_ (el contexto de build es la **raíz del repo**, igual que
  `docker compose`; el Dockerfile referencia rutas desde la raíz).
- **Dockerfile Path:** `packages/backend/Dockerfile`.
- **Health Check Path:** `/health`.
- **Region:** Frankfurt. **Instance Type:** Free.
- **Environment variables** (ver tabla abajo).

### Variables de entorno (producción)

| Variable          | Valor                                                      | Origen              |
| ----------------- | ---------------------------------------------------------- | ------------------- |
| `DATABASE_URL`    | _connection string_ de Neon (`-pooler`, `sslmode=require`) | **Secreto** (panel) |
| `JWT_SECRET`      | valor largo y aleatorio                                    | **Secreto** (panel) |
| `GROQ_API_KEY`    | API key de Groq                                            | **Secreto** (panel) |
| `NODE_ENV`        | `production`                                               | fijo (blueprint)    |
| `PORT`            | `3000`                                                     | fijo (blueprint)    |
| `LOG_LEVEL`       | `info`                                                     | fijo (blueprint)    |
| `AI_PROVIDER`     | `mock`                                                     | fijo (blueprint)    |
| `AI_TIMEOUT_MS`   | `60000`                                                    | fijo (blueprint)    |
| `JWT_ACCESS_TTL`  | `15m`                                                      | fijo (blueprint)    |
| `JWT_REFRESH_TTL` | `7d`                                                       | fijo (blueprint)    |

- **`JWT_SECRET` es obligatorio en producción.** La validación Zod (US-46) no aborta si falta (para no
  romper el `docker compose up` local), pero **degrada a un secreto de desarrollo inseguro con un
  WARNING**. En producción **debes** fijarlo a un valor real, por eso el blueprint lo marca `sync:
false`.
- **`DATABASE_URL` es requerida y validada:** en `NODE_ENV=production` la config Zod **aborta el
  arranque** (`exit 1`) con un mensaje claro si falta o está vacía. Por eso conviene tenerla puesta
  antes del primer deploy.

## 3. IA en la nube con Groq

1. Crea una API key en [console.groq.com](https://console.groq.com) (free tier).
2. Ponla como secreto **`GROQ_API_KEY`** en Render.
3. El modo cloud (Groq como `target`) ya viene **activo por defecto** en la BD (`AppSetting`
   `ai.cloud`, sembrado por migración, US-14). Con la key presente, los cuentos y actividades se
   generan con Groq; **sin la key**, el backend cae al modo base (`mock`) automáticamente.
4. Es **conmutable en caliente** desde la BD (`ai.cloud.activo=false` restaura mock/local).

> **Cumplimiento.** Usar Groq en producción implica que el **texto del cuento sale a un tercero** en la
> nube: es una **desviación de privacidad asumida del TFM**, coherente con la del modo cloud
> ([cumplimiento-menores.md](cumplimiento-menores.md), C-5). Salen **datos minimizados** (edad,
> intereses, idioma; nunca nombre ni identificadores), los free tiers pueden entrenar con los datos, y
> es incompatible con la categoría Kids de Apple. **Sin `GROQ_API_KEY` no sale nada** (modo conforme).

## 4. Apuntar la app al backend de producción

La app lee la URL base del backend de `EXPO_PUBLIC_API_URL` (ver
[`packages/app/.env.example`](../packages/app/.env.example) y `getBaseUrl()`). Para un build/preview
que apunte a producción, define la variable con la URL pública de Render, p. ej.:

```
EXPO_PUBLIC_API_URL=https://magyblob-backend.onrender.com
```

Sin la variable, la app usa el default local (`http://localhost:3000`), así que el desarrollo no se ve
afectado. Las `EXPO_PUBLIC_*` se **inlinean en el bundle** en build-time: la URL no es secreta, pero
recuerda que **no** debe contener secretos.

## Notas operativas

- **Cold start (plan free).** El web service free de Render **se duerme tras inactividad** y tarda
  ~30-60 s en volver a arrancar en la siguiente petición (incluido `/health`). Es esperable en el plan
  free; para evitarlo haría falta un plan de pago o un ping periódico. El primer cuento tras un cold
  start también suma el arranque del proceso y la conexión a Neon.
- **Logs.** El backend usa pino (logs estructurados); se ven en el panel de Render. `LOG_LEVEL=info`
  registra los prompts de IA (incluye el nombre del niño — desviación documentada, C-5); para
  endurecer en un despliegue real, bajar a `debug`/`warn`.
- **Migraciones.** Cada deploy aplica `prisma migrate deploy` al arrancar. Si una migración falla
  (p. ej. `DATABASE_URL` mal), el contenedor no llega a servir y el health check falla: revisa los
  logs del deploy.
- **Verificación rápida tras el deploy.** `GET https://<servicio>.onrender.com/health` debe responder
  200 (puede tardar por el cold start). Luego prueba el flujo (alta → login → perfil → cuento).
