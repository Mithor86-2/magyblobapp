# Configuración del app (`AppSetting`) — cómo subir los cambios a la BD

La configuración ajustable en caliente (prompts, modelo, parámetros de generación, modo cloud) se
declara en **[`packages/backend/prisma/app-settings.json`](../packages/backend/prisma/app-settings.json)**
(fuente única, **sin secretos**) y se aplica a la tabla `AppSetting` con un **sync versionado** (US-70).
El código del sync vive en
[`src/infrastructure/config/appSettings.ts`](../packages/backend/src/infrastructure/config/appSettings.ts)
(lógica pura) y [`syncAppSettings.ts`](../packages/backend/src/infrastructure/config/syncAppSettings.ts)
(escritura en BD). Modelo del campo en [modelo-datos.md](modelo-datos.md).

## Regla de oro (versionado)

El sync **solo** aplica una clave cuando su `version` en el JSON es **mayor** que la aplicada en la BD
(o la clave no existe). Por lo tanto:

> **Para que un cambio suba a la BD hay que EDITAR el `value` Y SUBIR la `version` de esa clave.**
> Si cambias el `value` pero dejas la misma `version`, el sync la **omite** (no pisa lo que haya en la
> BD, p. ej. cambios hechos en caliente). Las claves de la BD que ya no estén en el JSON se
> **conservan** (se listan como "huérfanas" en el log; no se borran).

`value` admite `string | number | boolean | objeto` (los objetos/arrays se serializan a texto al
guardar). Los saltos de línea en un `value` de texto van como `\n`, y las comillas dobles como `\"`.

## Desarrollo (BD local)

Backend + Postgres locales con `docker compose` (Postgres en `localhost:5432`).

**Opción A — script `config:sync` (a demanda, no necesita reiniciar):**

```bash
DATABASE_URL='postgresql://magyblob:magyblob@localhost:5432/magyblob?schema=public' \
  pnpm --filter @magyblob/backend config:sync
```

Salida esperada (ejemplo): `config sync (AppSetting): 0 creadas, 1 actualizadas, 9 omitidas, 0 huérfanas.`
El backend lee `AppSetting` **en caliente** (por petición), así que el cambio queda activo sin reiniciar.

**Opción B — al arrancar el backend** (aplica el sync automáticamente si hay `DATABASE_URL`):

```bash
docker compose up -d --build backend     # reconstruye desde el código actual y sincroniza al iniciar
# o, en modo dev con la BD levantada:
DATABASE_URL='postgresql://magyblob:magyblob@localhost:5432/magyblob?schema=public' \
  pnpm --filter @magyblob/backend dev
```

**Verificar:**

```bash
docker exec magyblobapp-postgres-1 \
  psql -U magyblob -d magyblob -c "select key, version from app_settings order by key;"
```

## Producción (Neon + Render)

En producción **no se corre el comando a mano**: se sube por el flujo de despliegue.

1. Commitea el cambio de `app-settings.json` (con la `version` subida) e **intégralo en `develop`**.
2. **Promociona `develop` → `main`** (el release; ver [despliegue.md](despliegue.md) y la skill
   `versionar`).
3. **Render redespliega desde `main`.** En el arranque, el contenedor ejecuta en orden:
   - `prisma migrate deploy` — aplica migraciones pendientes (incl. la columna `AppSetting.version` si
     faltara), y
   - el **sync de `AppSetting`** dentro de `buildProductionDeps` — aplica el JSON a la BD de Neon.

   No hay pasos ocultos: un despliegue limpio queda configurado solo.

> **Requisito:** el mecanismo (US-70) debe estar en `main`. Si aún no se ha promocionado `develop`, la
> producción no aplicará el JSON hasta el primer despliegue que incluya US-70.

**Aplicar a Neon sin desplegar** (puntual, avanzado): apunta `DATABASE_URL` a la cadena de Neon y corre
`config:sync`. Requiere que la migración de `version` ya esté aplicada en esa BD.

```bash
DATABASE_URL='postgresql://…usuario:password…@…neon.tech/…?sslmode=require' \
  pnpm --filter @magyblob/backend config:sync
```

## Resolución de problemas

- **"N omitidas" y mi cambio no aparece** → no subiste la `version` de esa clave. Súbela y re-ejecuta.
- **`config sync omitido: sin DATABASE_URL`** → arrancaste el backend/script sin `DATABASE_URL`
  (p. ej. `pnpm dev` sin la variable). Expórtala/pásala y repite.
- **`EADDRINUSE :3000` al hacer `pnpm dev`** → el backend de docker ya ocupa el puerto; párralo
  (`docker stop magyblobapp-backend-1`) o usa la Opción A (solo `config:sync`, no levanta servidor).
- **Error de validación (Zod)** → el JSON tiene una entrada mal formada (clave vacía, `version` no
  entera ≥ 1, o `value` de tipo no admitido). El sync **falla** sin escribir; corrige y repite.
- **Secretos** → nunca van en `app-settings.json`. Las API keys y `DATABASE_URL` viven en variables de
  entorno; `ai.cloud` solo guarda selectores no secretos (`activo`/`target`/`model`).
