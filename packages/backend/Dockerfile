# Multi-stage build del backend dentro del monorepo pnpm.
# Contexto de build = raíz del repo (ver docker-compose.yml).

FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
# Manifiestos primero para cachear la instalación.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/backend/package.json packages/backend/
RUN pnpm install --frozen-lockfile --filter "@magyblob/backend..."
# Código y compilación.
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
EXPOSE 3000
CMD ["node", "dist/index.js"]
