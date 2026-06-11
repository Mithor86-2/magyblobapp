# magyblobapp

App infantil bilingüe (ES/EN) que crea perfiles de niño y genera cuentos /
recomienda actividades usando un LLM **local** (Ollama + Gemma 2B), con
arquitectura limpia y tres modos de IA intercambiables (`mock | local | cloud`).

Proyecto de TFM. El plan por fases está en
[Docs/plan-ejecucion-master.md](Docs/plan-ejecucion-master.md) y la guía para
agentes en [CLAUDE.md](CLAUDE.md).

## Requisitos

- Node.js ≥ 24 y pnpm (vía `corepack enable`)
- Docker + Docker Compose

## Arranque rápido (Docker)

```bash
cp .env.example .env          # ajusta valores si hace falta
docker compose up --build     # backend + PostgreSQL 16 + Chroma + Ollama
pnpm ollama:setup             # descarga gemma:2b dentro del contenedor de Ollama
```

El backend queda en http://localhost:3000 (healthcheck en `/health`).

> El modo de IA por defecto es `mock`, así que la app funciona sin GPU ni modelo
> descargado. Cambia `AI_PROVIDER=local` en `.env` para usar Ollama real.

## Desarrollo local (sin Docker)

```bash
pnpm install
pnpm dev            # backend en watch (tsx)
```

## Comandos del monorepo

| Comando                             | Qué hace                                              |
| ----------------------------------- | ----------------------------------------------------- |
| `pnpm check`                        | typecheck + lint + formato + tests (todo el monorepo) |
| `pnpm typecheck`                    | `tsc --noEmit` en cada paquete                        |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                                                |
| `pnpm format` / `pnpm format:check` | Prettier                                              |
| `pnpm test`                         | Vitest en cada paquete                                |

## Estructura

```
packages/
  backend/   API Fastify + Prisma + capa de IA (Clean Architecture)
  app/        App móvil Expo + Zustand (se construye en la Fase 4)
```
