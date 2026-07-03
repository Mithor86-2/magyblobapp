# Multi-stage build del backend dentro del monorepo pnpm.
# Contexto de build = raíz del repo (ver docker-compose.yml).

FROM node:26-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
# Manifiestos + esquema Prisma primero: el `postinstall` (prisma generate) necesita
# el schema, y así se cachea la instalación. El cliente se genera DENTRO de la imagen
# (engine linux/musl); el del host queda excluido por .dockerignore (**/generated).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/backend/package.json packages/backend/
COPY packages/backend/prisma packages/backend/prisma
# Prisma 7: el `postinstall` (prisma generate) carga prisma.config.ts (schema +
# datasource); debe estar antes del install.
COPY packages/backend/prisma.config.ts packages/backend/
RUN pnpm install --frozen-lockfile --filter "@magyblob/backend..."
# Código y compilación (build copia src/generated -> dist/generated).
COPY tsconfig.base.json ./
COPY packages/backend ./packages/backend
RUN pnpm --filter @magyblob/backend build
# Genera un directorio autocontenido solo con dependencias de producción.
# --legacy: desde pnpm v10 el deploy no-inyectado requiere optar explícitamente.
RUN pnpm --filter @magyblob/backend deploy --prod --legacy /app/deploy

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/deploy/node_modules ./node_modules
COPY --from=build /app/deploy/dist ./dist
COPY --from=build /app/deploy/package.json ./package.json
# Esquema + migraciones para aplicar `migrate deploy` al arrancar (sin pasos ocultos).
COPY --from=build /app/packages/backend/prisma ./prisma
# Prisma 7: la config (schema + datasource url desde DATABASE_URL) que lee `migrate deploy`.
COPY --from=build /app/packages/backend/prisma.config.ts ./prisma.config.ts
EXPOSE 3000
# Aplica migraciones pendientes y arranca. Si la DB no está lista, el depends_on
# de compose (postgres healthy) ya lo cubre.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
