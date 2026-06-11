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

## Fase 2

### `noUncheckedIndexedAccess` marca el acceso por índice a una tupla `as const`

- **Síntoma:** `tsc` falla en `CATEGORIAS[i % CATEGORIAS.length]` con
  `Type '... | undefined' is not assignable`.
- **Causa:** `tsconfig.base` activa `noUncheckedIndexedAccess`, así que todo acceso por
  índice es `T | undefined` aunque el módulo garantice que está dentro de rango.
- **Solución:** aserción no-nula `…]!` cuando el índice es demostrablemente válido
  (`i % length`). No usar `as` que enmascara más de la cuenta.

### Salida estructurada de Ollama: usar `format` con esquema, no parsear texto

- `gemma:2b` no devuelve JSON fiable solo pidiéndolo en el prompt. La forma robusta es
  `POST /api/generate` con `format: <JSON Schema>` y `stream:false`: el modelo se ciñe
  al esquema y `response` es un JSON parseable. Aun así, el `OllamaProvider` valida y
  filtra (categorías fuera de vocabulario, campos vacíos) — el `FallbackProvider` cubre
  el resto cayendo a mock.

### Scripts fuera de `src/` no los typechea `tsc` pero sí los lintea `eslint .`

- El `tsconfig` del backend incluye solo `src/**/*.ts`, así que `scripts/smoke-ollama.ts`
  no entra en `pnpm typecheck`. Pero el `eslint .` de la raíz **sí** lo lintea (no está
  en `ignores`). Conclusión: los scripts auxiliares deben pasar ESLint + Prettier aunque
  no los cubra el typecheck; se ejecutan con `tsx` (resuelve los imports `.js` de ESM).

## Fase 3

### El cliente Prisma con `output` custom rompe en 3 sitios

Elegir `output = "../src/generated/prisma"` (Fase 0) tiene tres consecuencias no obvias:

1. **ESLint lo analiza** (miles de errores `no-undef`/`require`): añadir `**/generated`
   a `ignores` en `eslint.config.mjs`.
2. **`tsc` no copia los `.js` generados a `dist`** (solo compila `.ts`): el `import`
   en runtime `../../generated/prisma/index.js` apunta a `dist/generated/...` que no
   existe. Solución: `build = "tsc && cp -r src/generated dist/generated"`.
3. **Docker:** el cliente trae un engine nativo por plataforma. Hay que **regenerarlo
   dentro de la imagen** (engine linux/musl) y excluir el del host con `.dockerignore`
   (`**/generated`). Como `prisma generate` corre en `postinstall`, el Dockerfile debe
   **copiar `prisma/` antes de `pnpm install`** (si no, no hay schema y falla).

### `migrate deploy` al arrancar exige `prisma` como dependencia de producción

`pnpm deploy --prod` elimina devDependencies, así que el CLI `prisma` no llega al runtime.
Para aplicar migraciones al arrancar el contenedor (`CMD prisma migrate deploy && node …`)
hubo que mover `prisma` a `dependencies` y copiar `prisma/` (schema + migraciones) a la
imagen runtime. Así `docker compose up` levanta la pila **sin pasos ocultos**.

### Import dinámico para que los tests no carguen Prisma

`buildServer(config, deps?)`: cuando se inyectan `deps` (tests), la rama de producción
`buildProductionDeps` (que importa Prisma) **no se evalúa** porque se usa
`await import('./infrastructure/composition.js')` solo si faltan `deps`. Así el test de
integración corre con repos en memoria, sin abrir conexión a PostgreSQL ni cargar el
engine. Importar estáticamente la composición arrastraría Prisma al grafo del test.

### `gemma:2b` da contenido pobre; el valor está en validar el contrato, no la prosa

- Smoke test real: el español que produce `gemma:2b` es gramaticalmente flojo
  ("El oso era grande y fuerte, y el león era pequeño yagile"). Es esperable en un
  modelo de 2B — no es un bug del provider. Lo que el código garantiza y hay que
  verificar es el **contrato**: JSON estructurado parseable, idioma correcto y
  categorías dentro del vocabulario. Para mejor prosa, el modo `cloud` (Fase 5) o un
  modelo local mayor; `gemma:2b` es el default por ser ligero y reproducible sin GPU.
