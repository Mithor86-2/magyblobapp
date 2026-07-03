# @magyblob/backend

API del proyecto (Fastify + Prisma + PostgreSQL) con Clean Architecture. El estado del proyecto,
la arquitectura y las reglas viven en la raíz ([CLAUDE.md](../../CLAUDE.md) y [Docs/](../../Docs/));
este README cubre el **día a día del backend en local**: arranque, comandos y limpieza de la BD.

## Arranque local

La forma reproducible es con Docker (levanta backend + PostgreSQL 16 + Ollama y aplica las
migraciones al arrancar):

```bash
cp .env.example .env      # desde la raíz del repo
docker compose up         # backend en http://localhost:3000/health
```

- La BD corre en el contenedor `postgres` (volumen `pgdata`), con el puerto **5432** publicado en el
  host. Credenciales de desarrollo por defecto: `magyblob` / `magyblob` / BD `magyblob`.
- `DATABASE_URL` local (host): `postgresql://magyblob:magyblob@localhost:5432/magyblob?schema=public`.
- El modo IA por defecto es `mock` (sin GPU ni claves). Para IA real, ver la raíz.

## Comandos útiles

Se ejecutan con `pnpm --filter @magyblob/backend <script>` (o dentro de `packages/backend`):

| Script             | Qué hace                                                                |
| ------------------ | ----------------------------------------------------------------------- |
| `dev`              | Arranca el backend con recarga (`tsx watch`).                           |
| `test`             | Tests unitarios + integración de rutas (Vitest, sin Docker).            |
| `test:coverage`    | Igual + cobertura (umbrales estratégicos, US-35).                       |
| `test:integration` | Integración de repos Prisma contra Postgres real (**requiere Docker**). |
| `test:e2e`         | E2E por HTTP real + Postgres real (**requiere Docker**).                |
| `prisma:migrate`   | Crea/aplica una migración en desarrollo (`prisma migrate dev`).         |
| `prisma:deploy`    | Aplica migraciones pendientes (`prisma migrate deploy`).                |
| `prisma:seed`      | Ejecuta el seed idempotente de `AppSetting` (`prisma/seed.ts`).         |

El gate completo (`pnpm check`) se corre desde la raíz.

## Limpiar la base de datos local

Tras probar a mano se acumulan cuentas, perfiles y cuentos de prueba. Para dejar la BD **local**
limpia hay tres opciones (de la más recomendada a la más agresiva). **Solo desarrollo**: nunca las
ejecutes contra producción (Neon usa otra `DATABASE_URL`).

### 1. Reset con re-seed (recomendado)

Vacía **todas** las tablas, reaplica las migraciones y **re-ejecuta el seed** (`prisma/seed.ts`), de
modo que los `AppSetting` (prompts, parámetros de IA, `ai.cloud`) quedan reconstruidos. Deja la BD
como recién instalada pero ya configurada:

```bash
# con la BD local (Docker) levantada, desde la raíz del repo:
DATABASE_URL='postgresql://magyblob:magyblob@localhost:5432/magyblob?schema=public' \
  pnpm --filter @magyblob/backend exec prisma migrate reset --force
```

> **Nota (agentes de IA):** Prisma bloquea `migrate reset` cuando lo invoca un agente de IA y exige
> consentimiento explícito vía la variable `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`. Ejecutándolo
> tú a mano en tu terminal, el comando de arriba funciona sin pasos extra.

### 2. Borrar solo los datos de prueba (conserva `AppSetting`)

Borra los datos de usuario sin tocar migraciones ni seed. Al borrar un `Guardian` se eliminan **en
cascada** sus perfiles, cuentos, actividades, eventos, logros y verificaciones de email; los
`AuditLog` quedan con `guardianId = NULL`:

```bash
docker exec -it magyblobapp-postgres-1 \
  psql -U magyblob -d magyblob -c "TRUNCATE TABLE guardians RESTART IDENTITY CASCADE;"
```

Para borrar solo una cuenta concreta:

```bash
docker exec -it magyblobapp-postgres-1 \
  psql -U magyblob -d magyblob -c "DELETE FROM guardians WHERE email = 'prueba@ejemplo.com';"
```

### 3. Recrear el volumen de Docker (nuke total)

Destruye por completo el volumen `pgdata` (toda la BD); al volver a levantar, el backend reaplica las
migraciones. Útil si el esquema quedó en un estado inconsistente:

```bash
docker compose down -v
docker compose up
```

### Comprobar el estado

```bash
docker exec -it magyblobapp-postgres-1 psql -U magyblob -d magyblob -c \
  "SELECT 'guardians' t, count(*) FROM guardians
   UNION ALL SELECT 'child_profiles', count(*) FROM child_profiles
   UNION ALL SELECT 'stories', count(*) FROM stories
   UNION ALL SELECT 'email_verifications', count(*) FROM email_verifications;"
```
