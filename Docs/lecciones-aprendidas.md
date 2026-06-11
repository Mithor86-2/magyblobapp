# Lecciones aprendidas

Trampas concretas encontradas durante el desarrollo y cómo se resolvieron. Pensado
para que una futura sesión (humana o de Claude) **no tropiece dos veces** con lo mismo.

> Formato: síntoma → causa → solución. Añadir entradas cuando algo cueste más de lo
> esperado o cuando la solución no sea obvia.

---

## Fase 0

### `pnpm deploy` falla en el Dockerfile (pnpm v10+)

- **Síntoma:** `docker compose build backend` falla con
  `ERR_PNPM_DEPLOY_NONINJECTED_WORKSPACE` en el paso `pnpm deploy --prod`.
- **Causa:** desde pnpm v10, `deploy` solo funciona sobre workspaces con
  `inject-workspace-packages=true`; si no, hay que optar explícitamente.
- **Solución:** añadir `--legacy` →
  `pnpm --filter @magyblob/backend deploy --prod --legacy /app/deploy`.

### El healthcheck del backend en compose usa `fetch` nativo

- Node 24 trae `fetch` global, así que el healthcheck de Docker no necesita `curl`
  dentro de la imagen alpine:
  `node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1))..."`.

### Tests de rutas sin abrir puerto

- Usar `app.inject({ method, url })` de Fastify en lugar de `listen()` + `fetch`.
  Los tests no compiten por el puerto y corren más rápido. `buildServer()` construye
  la app pero **no** la arranca; `index.ts` es quien hace `listen()`.

### Prettier vs. Markdown: URLs desnudas

- El linter de Markdown (MD034) marca URLs sueltas. Envolver en `<...>`:
  `<http://localhost:3000/health>`.

## Fase 1

### Puertos deterministas en los casos de uso

- Los casos de uso reciben `IdGenerator` (`() => string`) y `Clock` (`() => Date`) por
  inyección (`src/application/ports.ts`). En tests se usan un id secuencial y un reloj
  fijo → resultados deterministas sin tocar el dominio. En Fase 3 se inyectan
  `crypto.randomUUID` y `() => new Date()`.

### `pnpm typecheck` NO cubre los tests

- El `tsconfig.json` del backend excluye `test/`, así que `tsc --noEmit` no
  typecheckea los tests; Vitest los corre con esbuild (sin chequeo de tipos). Un error
  de tipos en un test no lo caza el DoD actual. Si se quiere cubrir, añadir un
  `tsconfig` aparte para `test/` (pendiente; no se hizo en Fase 1 por YAGNI).

### Frontera de capas en ESLint

- `no-restricted-imports` bloquea que `/domain` importe de application/infra/frameworks
  y que `application` importe de infraestructura. Si el lint corta un import, el diseño
  está mal, no el lint. Mantener los imports del dominio como relativos `.js`.
