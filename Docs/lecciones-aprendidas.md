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
  categorías dentro del vocabulario. Para mejor prosa, un modelo local mayor (variable de
  entorno); `gemma:2b` es el default por ser ligero y reproducible sin GPU.

## Fase 4

### Expo en monorepo pnpm: `metro.config.js` explícito y andamiaje en dir temporal

- **Andamiaje:** `create-expo-app` no escribe sobre un `packages/app` que ya existe (tenía
  `package.json` + README de Fase 0). Solución: generar en `/tmp` con `--no-install`, copiar los
  ficheros (`App.tsx`, `app.json`, `tsconfig.json`, `index.ts`, `.gitignore`, `assets/`) y
  reescribir `package.json`/README a mano conservando `name: "@magyblob/app"`. Las deps acopladas
  a RN se añaden con `npx expo install` (resuelve versiones compatibles con el SDK), no a mano.
- **Metro + pnpm:** aunque Expo SDK 52+ autodetecta monorepos, se añadió `metro.config.js` con
  `watchFolders=[raíz]` y `resolver.nodeModulesPaths=[app, raíz]` para que la resolución con el
  linker aislado de pnpm (symlinks) sea determinista. **No hizo falta** `nodeLinker: hoisted`
  (que habría sido global y arriesgado para el backend/Prisma). Verificado con
  `npx expo export --platform ios`: bundlea 852 módulos sin errores de resolución.

### Verificar la app headless: `expo export`, no el simulador

- No se puede "tocar" la demo en un agente sin pantalla, pero `npx expo export` corre Metro de
  punta a punta y caza errores de import/resolución y de compilación del bundle. Es la mejor
  señal automatizable; la demo en vivo (tap-through en simulador/Expo Go) queda como paso humano.

### `EXPO_PUBLIC_*` se inlinea en el bundle; `localhost` no vale en móvil físico

- Las variables `EXPO_PUBLIC_*` se sustituyen en el bundle en build → **nunca** secretos ahí. Y
  `http://localhost:3000` solo alcanza al backend desde el simulador iOS o Expo web; desde un
  móvil físico hay que poner la **IP LAN** del ordenador en `EXPO_PUBLIC_API_URL`.

### El gate de la raíz cubre la app salvo en lint

- `eslint.config.mjs` ya ignora `packages/app/**` (toolchain RN aparte), así que `pnpm lint`
  (`eslint .`) no la toca. Pero `prettier --check .` y los scripts `-r` de `typecheck`/`test`
  **sí** la cubren. Conclusión: para que `pnpm check` siga verde, la app debe pasar typecheck,
  formato y tests; tras andamiar conviene un `pnpm format` para normalizar los ficheros que
  genera Expo. La app **extiende `expo/tsconfig.base`**, no la base Node del repo (JSX/RN).

### Refactor a Clean Architecture en el app: mover con `git mv` y revalidar con `expo export`

- Reorganizar `src/` en `domain`/`infrastructure`/`presentation` cambia **todas** las rutas de
  import relativas. Mover con `git mv` (preserva historial) y luego arreglar imports capa a capa.
  El `tsc --noEmit` caza los imports rotos de tipos, pero **no** garantiza que Metro resuelva en
  runtime: confirmar con `npx expo export` (revalidó 855 módulos sin errores tras el refactor).
- Truco de inversión de dependencias sin capa `application`: las interfaces de gateway viven en
  `domain`, el adaptador HTTP en `infrastructure`, y un `composition.ts` (composition root) instancia
  lo concreto y lo expone tipado como las interfaces. Las pantallas importan ese `api`, no `fetch`.
- `ApiError` se colocó en `domain/errors.ts` (no en infraestructura) para que la presentación lo
  capture con `instanceof` **sin** importar la capa de infraestructura (mantiene la frontera).

## Feature 14 — Proveedor cloud

### El contenedor no toma el `.env` nuevo hasta recrearlo (y el env del shell gana)

- **Síntoma:** `.env` con `AI_PROVIDER=local`, pero `docker exec backend env` mostraba
  `AI_PROVIDER=mock`; al apagar el cloud, generaba con mock en vez de Ollama.
- **Causa:** `docker compose` resuelve `${AI_PROVIDER:-mock}` **en el momento de crear/recrear** el
  contenedor, leyendo el `.env` de entonces. El contenedor en marcha conserva el valor con el que
  arrancó; editar `.env` después no lo cambia. (Además, una variable exportada en el shell tiene
  **precedencia** sobre el `.env` en la sustitución de compose.)
- **Solución:** `docker compose up -d backend` para recrearlo y que tome el `.env` actual. Verificar
  con `docker exec <backend> sh -c 'echo $AI_PROVIDER'`. Igual que la lección de Fase 5: **tras
  tocar backend o `.env`, recrear el contenedor**.

### El seed no corre al arrancar; la clave `ai.cloud` nueva no aparece sola

- **Síntoma:** `UPDATE app_settings ... WHERE key='ai.cloud'` afectó **0 filas** en una BD ya
  sembrada antes de añadir la clave al seed.
- **Causa:** el arranque del contenedor solo hace `prisma migrate deploy`, **no** `prisma:seed`
  (el seed es un paso manual idempotente). Una clave nueva del seed no llega a una BD existente.
- **Solución:** re-ejecutar `pnpm prisma:seed` (upsert idempotente) o `INSERT ... ON CONFLICT`. Lado
  bueno: que `ai.cloud` **no exista** por defecto es correcto — `parseCloudSetting` devuelve `null`
  y el modo base (mock/local) se mantiene → privacidad por defecto sin depender del seed.

### `json_object` es más portable que `json_schema` entre proveedores OpenAI-compatibles

- Para la salida estructurada del `CloudProvider` se usó `response_format: {type:'json_object'}`
  (soportado por Groq, Gemini-compat, OpenRouter…) en vez de `json_schema` (más nuevo y no
  universal). El modo `json_object` **exige** que el prompt describa la forma JSON y mencione
  "JSON"; por eso `CloudProvider` añade esa instrucción al prompt de usuario (el `system` de
  seguridad infantil se mantiene intacto). El parseo/saneo se reutiliza con Ollama
  (`parseResponse.ts`), que ya filtraba categorías inválidas y números fuera de rango.

### Hot-swap por petición, no por arranque

- Para que cambiar de proveedor sea **en caliente** (un `UPDATE` a `ai.cloud` sin reiniciar), la
  selección se resuelve **en cada llamada** (`HotSwapAIProvider` lee `ai.cloud` por petición), no al
  construir el provider. `createAIProvider` sigue siendo síncrono: solo envuelve el base con el
  hot-swap **cuando hay `settings`** (producción); sin `settings` (tests, mock puro) devuelve el
  base directo, preservando los tests existentes y evitando IO en la factoría.

## Fase 5.5

### El backend en Docker no recoge código nuevo con `restart`/`--force-recreate`

- **Síntoma:** tras añadir la ruta `POST /guardians/login`, la app daba "no estás en la BD" al
  iniciar sesión. `curl` al endpoint devolvía `Route POST:/guardians/login not found` (404).
- **Causa:** el servicio `backend` se **construye desde un `Dockerfile`** (imagen compilada,
  `NODE_ENV=production`). `docker compose restart` y `--force-recreate` reusan la **imagen
  existente**; no recompilan. El contenedor seguía con el código anterior a la rama.
- **Solución:** al cambiar **código del backend**, reconstruir la imagen:
  `docker compose up -d --build backend`. (El app no necesita esto: corre por Expo con recarga.)
  Una ruta inexistente devuelve 404, y la app lo interpretaba como "cuenta no encontrada" → confunde
  el diagnóstico; conviene `curl` directo al endpoint para distinguir "ruta ausente" de "404 de negocio".

### Ollama en Docker en Mac va por CPU: lento y al borde del timeout

- **Síntoma:** generar un cuento tardaba ~110s (frío) / ~72s (caliente); a veces parecía que "no
  generaba" o devolvía texto de mock.
- **Causa:** el contenedor `ollama` (Linux) **no accede a la GPU Metal** del Mac → corre `gemma:2b`
  en CPU. Con `AI_TIMEOUT_MS=120000`, una primera petición fría podía pasarse y caer al
  `FallbackProvider` (mock), dando la impresión de fallo.
- **Solución (entorno de pruebas):** subir `AI_TIMEOUT_MS` (p. ej. 180000) y **pre-cargar** el
  modelo (`POST /api/generate` con `keep_alive`) para que la primera petición no pague la carga en
  frío. Para velocidad real (~5-15s) haría falta **Ollama nativo** en el host (GPU) apuntando el
  backend a `host.docker.internal`. El modo `mock` sigue siendo la vía sin GPU para evaluar.

## Fase de mejoras — Narración (US-22)

### Servir audio binario por Fastify y la nueva API de `expo-file-system`

- **Síntoma:** dudas al devolver un MP3 desde el caso de uso (que trabaja con `Uint8Array`) por la
  ruta, y al guardarlo en el cliente para reproducirlo.
- **Causa:** el dominio no debe conocer `Buffer` (es de Node) → la síntesis devuelve `Uint8Array`;
  pero Fastify envía cómodamente un `Buffer`. Y en Expo SDK 56 la API de ficheros cambió: ya no es
  `FileSystem.writeAsStringAsync(base64)`, sino la clase `File`/`Paths`.
- **Solución:** en la ruta, `reply.header('content-type','audio/mpeg').send(Buffer.from(mp3))`. En
  el repo Prisma, `Bytes` ↔ `Buffer.from(uint8)` / `new Uint8Array(row.mp3)`. En el app, descargar
  con `fetch` de `expo/fetch` (`res.bytes()` → `Uint8Array`), escribir con
  `new File(Paths.cache, name).write(bytes)` y reproducir el `file.uri` con `expo-audio`.

### El fallback de narración es de cliente, no de servidor

- **Síntoma:** se intentó pensar en un `FallbackProvider` de TTS en el backend (como el del LLM).
- **Causa:** la red de seguridad de la narración es la **voz nativa del dispositivo** (`expo-speech`),
  que **solo existe en el cliente**; el servidor no puede degradar a ella.
- **Solución:** el backend **propaga el error** de ElevenLabs (5xx); el app lo captura (fetch `!ok` o
  error de red) y narra con `Speech.speak`. Así se cumple "degrada sin error visible para el niño"
  (US-22) sin un fallback de servidor.

### Trabajar en paralelo en dos ramas: el working tree se revierte al cambiar

- **Síntoma:** archivos recién creados/editados "desaparecían" o volvían a su versión original a
  mitad de sesión.
- **Causa:** se cerró otra feature en paralelo (`git flow feature finish` →
  `checkout develop`/merge), lo que **cambió la rama del working tree** bajo los pies; los cambios
  sin commitear de la rama de narración no viajaban con el checkout.
- **Solución:** **commitear pronto y a menudo** en la rama de la feature (los commits sobreviven al
  cambio de rama, el working tree no). Al volver, `git checkout` a la rama correcta y `git merge
develop` para integrar lo ya cerrado. Verificar `git branch --show-current` antes de editar si
  hay actividad paralela.

## Fase de mejoras — Prompt del cuento (US-28)

### Un override de `AppSetting` monolingüe rompe el bilingüe

- **Síntoma:** con perfil `en`, el cuento salía **en español** en `local` (y a veces en `cloud`).
- **Causa:** `prompt.story.system`/`template` del **seed** eran un único texto en **español**, y como
  `AppSetting` **pisa** el default de código (que es **por idioma**), el modelo recibía un prompt
  mayoritariamente en español → escribía en español. Además `{idioma}` se sustituía por el código
  (`en`/`es`): "Escríbelo en en".
- **Solución:** el system del cuento se **quita del seed** y vive solo en código (bilingüe,
  `INSTRUCCION_SEGURIDAD`); se añade `{idiomaNombre}` (`español`/`inglés`) para las plantillas. Regla
  general: en una app bilingüe, **no** metas en `AppSetting` un prompt monolingüe que pise el código.

### `gemma:2b`/`llama3.2:3b` no respetan bien la instrucción de idioma

- **Síntoma:** aun con el prompt corregido, los modelos locales pequeños siguen escribiendo en
  español para perfiles `en`; `gemma:2b` además produce texto incoherente y `llama3.2:3b` trunca.
- **Causa:** capacidad del modelo (2-3B) — siguen el idioma dominante del prompt, no la instrucción.
- **Solución/decisión:** en `local` nos quedamos con **español** (asumido); el **inglés y la calidad
  plena de las reglas del prompt maestro son cosa de `cloud`** (Groq 70B, verificado). Coherente con
  ADR 0003 (gemma:2b es el default reproducible, no el de calidad). Verificar siempre `proveedor` en
  la respuesta: si es `mock`, hubo fallback (timeout) y el prompt no se ejerció.

## Fase de mejoras — Tests de componentes (US-30)

### `lucide-react-native` no es importable bajo Vitest

- **Síntoma:** al renderizar cualquier componente que use el wrapper `Icon`, Vitest aborta el fichero
  con `SyntaxError: The requested module './context.mjs' does not provide an export named 'LucideProvider'`.
- **Causa:** `lucide-react-native` se publica como ESM con un interop que Vitest/esbuild no resuelve.
- **Solución:** mockear `./Icon` (`vi.mock('./Icon', () => ({ Icon: () => null }))`) en cada test que
  lo arrastre (BubblyButton, StarRating, ActivityCard, AuthorBadge, NarrationControls, DialogProvider).
  El propio `Icon` se deja sin test directo (documentado como excepción en US-30; su contrato lo cubre
  US-29).

### `react` y `react-dom` deben tener la **misma** versión exacta

- **Síntoma:** `Error: Incompatible React versions` al montar el primer test (react 19.2.3 vs
  react-dom 19.1.0).
- **Causa:** el app fija `react` 19.2.3; al añadir `react-dom` con caret pnpm resolvió 19.1.0.
- **Solución:** instalar `react-dom` con la **versión exacta** de `react` (`react-dom@19.2.3`).

### RN-web no proyecta todo `accessibilityState` a ARIA

- **Síntoma:** asserts sobre `aria-busy` (estado `loading`) y `aria-selected` (chip/avatar
  seleccionado) fallaban con `null`.
- **Causa:** `react-native-web` 0.21 no mapea `accessibilityState.busy`/`selected` a `aria-*` en un
  `<button>`; el spinner de `ActivityIndicator` sí se expone como `role="progressbar"`.
- **Solución:** para "ocupado" se asserta el `progressbar` (más user-centric); el estado
  `selected` no se verifica vía ARIA en web (es correcto en nativo) y el test se centra en
  rol+nombre+pulsación. Detalle en US-30.

### SonarJS: dos reglas pueden contradecirse sobre la misma regex (US-31)

- **Síntoma:** al aplicar `eslint-plugin-sonarjs`, `single-character-alternation` pedía cambiar
  `/‍|︎|️/` por una clase `[…]`; al hacerlo, `no-misleading-character-class` (y la regla
  core homónima) lo marcaban como error porque ZWJ y los selectores de variación son **combinadores**.
- **Causa:** una clase de caracteres con combinadores es engañosa (pueden fusionarse con el carácter
  previo); la alternación era correcta desde el principio.
- **Solución:** mantener la **alternación** y suprimir esa línea con
  `// eslint-disable-next-line sonarjs/single-character-alternation` + motivo. Lección general: ante
  reglas que se contradicen, gana la de correctitud/seguridad y la otra se suprime en línea con
  justificación, no al revés.
- **Aparte (tooling):** las herramientas de edición pueden reescribir escapes Unicode (`ó`) o
  caracteres acentuados; al tocar líneas con regex/escapes conviene verificar los bytes resultantes
  (`od -An -tx1`) en vez de fiarse del render.

## Los worktrees paralelos contaminaban el gate de lint (Feature 33)

- **Síntoma:** `pnpm check` (→ `eslint .`) fallaba con 5 errores en archivos bajo
  `.claude/worktrees/integracion-e2e-ci/` — código de **otra** feature (`feature/34`), no de la rama
  actual. ESLint recorre el filesystem y el worktree integrado de Claude Code vive físicamente dentro
  del repo.
- **Causa:** el `ignores` de [eslint.config.mjs](../eslint.config.mjs) tenía `packages/app/**` (no
  ancla la ruta anidada del worktree) y nada para `.claude/`; backend dentro del worktree no se
  ignoraba en absoluto. La regla de paralelismo del proyecto (un worktree por feature) garantiza que
  esto ocurre siempre que dos features coexisten en disco.
- **Solución:** añadir `.claude/**` a los `ignores` de ESLint y `.claude/worktrees/` a `.gitignore`.
  Cada worktree corre su propio gate; no debe contaminar el de la rama actual. Lección general: al
  seguir el flujo de worktrees, las herramientas que recorren el filesystem (lint, format, búsquedas)
  deben excluir `.claude/worktrees/` explícitamente.

## Fase 6 — Integración, E2E y CI (US-32)

### pnpm 11 bloquea por los builds nativos de Testcontainers

- **Síntoma:** tras `pnpm add -D @testcontainers/postgresql`, cualquier `pnpm <script>` fallaba con
  `ERR_PNPM_IGNORED_BUILDS` (cpu-features, protobufjs, ssh2) y el `verify-deps-before-run` abortaba.
- **Causa:** pnpm 11 exige decidir explícitamente sobre los build scripts; metió placeholders
  literales `set this to true or false` en `allowBuilds` de `pnpm-workspace.yaml` (no en el
  `package.json`).
- **Solución:** poner esos tres a `false` en `pnpm-workspace.yaml` (`allowBuilds`). Son nativos para
  conectar a un Docker remoto por SSH/gRPC; con Docker local no se usan.

### SonarJS `no-os-command-from-path` al lanzar Prisma desde un test

- **Síntoma:** `eslint` falla en `test/support/db.ts` por `execFileSync('pnpm', ['exec','prisma',…])`.
- **Causa:** invocar un comando por nombre lo resuelve vía `PATH` (riesgo de hijacking).
- **Solución:** invocar por **ruta absoluta**: `process.execPath` (node) + el CLI de Prisma resuelto
  con `require.resolve('prisma/package.json')` y su campo `bin`. Sin `PATH`, regla satisfecha.

### Metro cachea el bundle y no reinlina `EXPO_PUBLIC_*`

- **Síntoma:** el E2E de app fallaba con "No se pudo conectar con el servidor"; el bundle exportado
  seguía con `http://localhost:3000` pese a exportar con `EXPO_PUBLIC_API_URL=…:4173`.
- **Causa:** Metro reusó el bundle cacheado (mismo hash) y no reinlineó la variable.
- **Solución:** `expo export --platform web --clear` fuerza la recompilación con la env nueva.

### El puerto 3000 lo ocupa el stack de `docker compose`

- **Síntoma:** Playwright `webServer` abortaba: `http://127.0.0.1:3000/health` is already used.
- **Causa:** el backend de `docker compose` (stack de desarrollo) ya escuchaba en el 3000.
- **Solución:** el backend del E2E de app usa el **3100**; la app lo alcanza vía proxy de mismo
  origen, así que el puerto interno es indiferente.

### CORS entre la web (4173) y el backend: proxy de mismo origen

- **Síntoma:** el navegador bloquearía `fetch` de `:4173` a un backend en otro puerto (sin CORS).
- **Causa:** Fastify no emite cabeceras CORS y añadirlas sería un cambio de runtime fuera de alcance.
- **Solución:** servir el export web y **proxear** las llamadas de API al backend desde el mismo
  origen (`e2e/serve-web.mjs`); se exporta con `EXPO_PUBLIC_API_URL` apuntando a ese mismo origen.
  La SPA no usa rutas por URL, así que "lo que no es fichero estático" se proxea sin ambigüedad.

### Vitest recoge los `*.spec.ts` de Playwright

- **Síntoma:** `pnpm test` de la app intentaba ejecutar `e2e/onboarding.spec.ts` como test de Vitest.
- **Causa:** el `include` por defecto de Vitest captura `*.spec.ts`.
- **Solución:** `exclude: ['e2e/**', '**/dist/**']` en `vitest.config.ts` de la app (y excluir `e2e`
  del `tsconfig` para que el typecheck no arrastre `@playwright/test`). Suites con Docker
  (`integration-db`, `e2e`) van en configs Vitest aparte y fuera del `pnpm test` del gate.

### Husky v9.1+: los hooks ya no llevan shebang ni `chmod`

- **Síntoma:** muchos tutoriales (y prompts generados) crean `.husky/pre-commit` con
  `#!/usr/bin/env sh` + `. "$(dirname …)/_/husky.sh"` y un `chmod +x`.
- **Causa:** eso es de Husky ≤ v9.0. En **v9.1+** el _runner_ inyecta el entorno; incluir el shebang o
  el _sourcing_ emite un _deprecation warning_, y `husky init` ya deja los hooks operativos
  (`core.hooksPath=.husky/_`).
- **Solución:** el hook contiene **solo los comandos**. Nada de shebang ni `chmod`.

### `pnpm add` en la raíz del workspace exige `-w`

- **Síntoma:** `pnpm add -D husky` en la raíz aborta ("Running this command will add the dependency to
  the workspace root…").
- **Solución:** `pnpm add -D -w husky lint-staged` (la raíz es un workspace `private`).

### lint-staged + ESLint flat config: un fichero ignorado rompe el hook

- **Síntoma:** ESLint 9 falla con "File ignored…" si lint-staged le pasa un fichero que su `ignores`
  excluye (la app, generados, configs), abortando el commit por un falso positivo.
- **Solución:** acotar ESLint a `packages/backend/**/*.ts` en la config de `lint-staged` y añadir
  `--no-warn-ignored`; Prettier se encarga del resto de extensiones. El lockfile no se toca porque
  `pnpm-lock.yaml` está en `.prettierignore`.

### Coverage v8: el agregado de un directorio puede fallar aunque cada fichero esté al 100%

- **Síntoma:** con umbral 100% en `src/domain/entities/**`, el coverage fallaba (branches 97.14%)
  mientras la tabla mostraba `Guardian/Story/Activity/...` todos al 100% en ramas.
- **Causa:** el _glob_ del umbral agrega **todos** los ficheros del patrón; un fichero olvidado en la
  vista filtrada (`AuditLog.ts`, branches 50%) arrastraba el agregado. El filtro del `grep` con el que
  miraba la tabla escondía justo ese fichero.
- **Solución:** mirar el bloque completo del directorio (sin filtrar) para encontrar el fichero que
  baja la media, no fiarse del agregado ni de una vista filtrada. Lección general: con umbrales por
  _glob_, el número que importa es el **agregado del patrón**, no el de cada fichero.

### Strategic Coverage: excluir lo cubierto por otra suite, o el número miente

- **Síntoma:** al medir el coverage del `vitest run` unitario, los repos Prisma y los hooks atados a
  Expo (`useNarration`) salían a 0% y hundían el global, aunque sí están cubiertos (por
  `test:integration` / E2E).
- **Causa:** ese código no lo ejercita la suite unitaria; medirlo ahí es medir la suite equivocada.
- **Solución:** excluirlos del `coverage.exclude` (igual que el tier INFRASTRUCTURE), **documentando**
  la exclusión (no es truncado silencioso). El 100% se reserva a los _globs_ CORE; el resto cumple el
  80% de baseline. El umbral se hace cumplir en CI con `pnpm coverage`, no en el `pnpm check` local.

## Feature 37 — E2E web multinavegador (US-37)

### `trace: 'on-first-retry'` no captura nada sin reintentos

- **Síntoma:** al configurar trazas/vídeo para depurar fallos del E2E, no se generaba ningún artefacto
  pese a fallar un test en local.
- **Causa:** `on-first-retry` solo captura **en el reintento**; con `workers: 1` y `retries: 0` (el
  default en local, sin `CI`) no hay reintento, así que nunca se conserva nada.
- **Solución:** usar `*-on-failure` (`screenshot: 'only-on-failure'`, `video`/`trace:
'retain-on-failure'`), que conserva la evidencia del primer (y único) intento. `retries: 1` se
  activa solo en CI (`retries: process.env.CI ? 1 : 0`).

### `mobile-safari` no arranca sin el binario de WebKit

- **Síntoma:** añadido el project `mobile-safari` (`iPhone 13`), Playwright fallaba al lanzarlo porque
  no encontraba el ejecutable del navegador.
- **Causa:** `e2e:install` instalaba solo `chromium`; `mobile-safari` corre sobre **WebKit**.
- **Solución:** `playwright install chromium webkit` en el script `e2e:install`. (`mobile-chrome` no
  añade binario: reusa el mismo Chromium; solo cambia el viewport.)

## Feature 40 — E2E web de actividades e historial (US-39)

### Cada test E2E rehace el onboarding con email/niño propios

- **Síntoma:** un spec nuevo que daba por hecho un perfil ya creado (o que reusaba el email del spec
  de onboarding) fallaba de forma intermitente o pisaba el estado del otro test.
- **Causa:** cada test de Playwright arranca con un **contexto/página nuevos** (sin estado de la app),
  y el **backend en modo `mock` persiste** entre tests; compartir email/niño entre specs cruza estado.
- **Solución:** cada test rehace el onboarding completo dentro del propio test (helper local
  `completarOnboarding(page)` que replica el patrón de `onboarding.spec.ts`). **Ojo:** un email fijo
  por spec **no basta** en cuanto hay varios `projects` (ver Feature 41); el email debe ser único por
  **test**, no por spec.

## Feature 41 — fix E2E web: email único por test (US-37 + US-39)

### Un email fijo por spec choca al correr el E2E en varios navegadores

- **Síntoma:** tras juntar el E2E multinavegador (US-37, 3 `projects`) con los specs de actividades e
  historial (US-39), los tests fallaban con timeout esperando "Crear nuevo perfil" (el onboarding no
  avanzaba). En local con un solo navegador no se veía.
- **Causa:** el backend E2E usa un **Postgres efímero que persiste toda la corrida** (no se resetea
  entre tests ni entre `projects`). Cada test rehace el alta del adulto, y al usar un **email fijo** el
  segundo alta en adelante (otro test, u otro navegador) fallaba con "email ya registrado", dejando la
  app parada antes de la selección de perfil.
- **Solución:** email **único por test**, derivado de `project` + título del test
  (`packages/app/e2e/_correo.ts`, `correoUnico(testInfo)`), usado en `onboarding.spec.ts` y
  `actividades-historial.spec.ts`. Así las N tests × M navegadores no colisionan. Alternativa
  descartada por YAGNI: resetear/truncar la BD entre tests (endpoint de reset) — más superficie y
  acoplamiento que un email único.

## Feature 38 — E2E nativo con Maestro (US-38)

### La puerta parental no es un input: es opción múltiple (chips), y el reto es aleatorio

- **Síntoma:** el primer boceto del flow Maestro asumía que la puerta parental era un campo de texto
  ("introduce la suma y pulsa validar"). No existe tal campo, así que el flow no habría podido pasar
  la puerta.
- **Causa:** `components/ParentalGate.tsx` pinta el reto como `Text` "a + b = ?" y ofrece **tres
  `SelectableChip`** (la respuesta + dos distractores contiguos, **barajados**); el reto se regenera
  en cada apertura y tras cada fallo. La respuesta no se escribe: se **toca el chip** correcto.
- **Solución (Maestro):** leer la pregunta por **texto** (regex) y tocar el chip calculado:
  1. `copyTextFrom: { text: '\d+ \+ \d+ = \?' }` — **NO** por `testID` (ver corrección iOS abajo).
  2. `evalScript: ${output.ops = maestro.copiedText.match(/\d+/g)}` y
     `evalScript: ${output.suma = String(Number(output.ops[0]) + Number(output.ops[1]))}`.
  3. `tapOn: ${output.suma}` — el chip muestra el número como texto visible.
     Es el mismo enfoque que el E2E web (`onboarding.spec.ts` lee la pregunta por regex y hace clic en el
     botón con ese número), traducido al DSL de Maestro (`copyTextFrom` + `evalScript` + `output`).
- **`testID` aditivos:** se añadió una prop `testID` opcional a `TextField` y se etiquetaron los 3
  campos del alta (`alta-nombre`/`alta-apellidos`/`alta-email`) y el reto parental
  (`parental-pregunta`). Son **aditivos** y no rompen los E2E web (que van por rol/nombre accesible).
  Aviso: en iOS los de **`TextInput` sí** se exponen como `id`, pero el del **`Text`**
  (`parental-pregunta`) **no** (ver corrección iOS abajo) — por eso el reto se localiza por texto.
- **Gotcha de re-ejecución:** el backend persiste el alta; re-correr el flow con el **mismo email**
  falla por "email ya registrado" (igual que el E2E web, Feature 41). Cambia el email del flow o
  limpia la BD entre corridas.

### Ejecución real en iOS Simulator (Expo Go) el 2026-06-25: 7 correcciones del flow

Al correr por fin el flow sobre el iPhone 17 Pro (iOS 26.4, **Expo Go**, Maestro 2.6.1) salió **verde
de extremo a extremo** (incluida la narración nativa), pero solo tras 7 ajustes. Todos derivan de dos
hechos de Maestro/iOS: **(a)** el `testID` de un `<Text>` RN **no** se expone como `id` en la jerarquía
de iOS (sí los de `TextInput`/botones), y **(b)** Maestro hace **match COMPLETO** del texto de un
elemento (no subcadena).

1. **Puerta parental por texto, no por `testID`:** `copyTextFrom: { id: parental-pregunta }` falla
   ("Element not found") → `copyTextFrom: { text: '\d+ \+ \d+ = \?' }`.
2. **`hideKeyboard` falla en iOS** ("Couldn't hide the keyboard") → cerrar teclado **tocando el título**
   (`tapOn: 'Crea tu cuenta'`); funciona porque el `ScrollView` usa `keyboardShouldPersistTaps="handled"`.
   Sin cerrarlo, el campo Email (el más bajo) queda tapado y su texto se concatena en Apellidos.
3. **Chips bajo el footer fijo:** Parentesco/consentimiento e interés quedan tras el footer o fuera de
   pantalla; `tapOn` no hace scroll y el tap lo intercepta el footer → `scrollUntilVisible` con
   **`centerElement: true`** (sin centrar, el elemento queda al borde y no se selecciona).
4. **Asserts tras navegación:** `assertVisible` (timeout corto) falla por la transición + red →
   `extendedWaitUntil` con `timeout` explícito en cada punto de navegación.
5. **Pestañas por regex:** iOS expone la pestaña como `"Cuentos, tab, 3 of 4"`; con match completo,
   `tapOn: 'Cuentos'` no casa → `tapOn: 'Cuentos, tab.*'` (ídem Actividades/Historial).
6. **Asserts de subcadena por regex:** `assertVisible: 'Mateo'` no casa con "Mateo y la aventura…" ni con
   "Había una vez Mateo…" (match completo) → `'.*Mateo.*'` / `'.*Había una vez.*'`.
7. **Sin `clearState` en Expo Go:** `launchApp.clearState` borra los datos de Expo Go y dispara su
   **dev menu**, que tapa la UI; el flow arranca con sesión limpia y **sin** `launchApp`. (En un
   **development build** `clearState` sí es fiable y no hay dev menu.)

Dos hallazgos más:

- **Entorno mock ≠ `AI_PROVIDER=mock`:** por US-14 el `HotSwapAIProvider` sirve con **cloud** si la
  `AppSetting ai.cloud` está activa y hay API key en env (mi `.env` tenía Groq), **aunque** se levante
  con `up:mock`. El cuento dejaba de ser determinista y el flow fallaba. Para E2E determinista: backend
  con **claves cloud vacías** (recreé el contenedor con `GROQ_API_KEY= … docker compose up -d backend`)
  o `ai.cloud` desactivada. El `.env`/BD no se tocan; `pnpm up:mock` restaura el cloud.
- **La narración nativa funciona en Expo Go:** `expo-speech` degrada a la voz nativa del dispositivo y
  Expo Go la incluye, así que **no hace falta development build** para validar este flow (el comentario
  original del flow que lo exigía era conservador).

### Paridad Android (2026-06-25): un flow hermano y 5 diferencias con iOS

Validar el mismo happy path en **Android Emulator (Pixel_9_Pro, Android 16) con Expo Go** pasó en
verde (56 pasos, exit 0), pero el flow de iOS **no sirve tal cual**. Hice un fichero hermano
`onboarding.android.yaml` (no se puede compartir: el `appId` es fijo en la cabecera del flow). Las
diferencias que costaron iteración:

- **Red del emulador (la más importante):** en Android `localhost` es el **propio emulador**, no el
  host. La app no veía el backend hasta arrancar Metro con `EXPO_PUBLIC_API_URL=http://10.0.2.2:3100`
  (`10.0.2.2` = alias del host en el emulador Android). En iOS Simulator no pasa: comparte `localhost`.
- **`appId`:** Expo Go es `host.exp.Exponent` en iOS y `host.exp.exponent` (minúscula) en Android.
- **Entrada Unicode no soportada** en Android ([Maestro #146]): `inputText: 'García'` falla con
  "Unicode character input is not supported". Se escribe `'Garcia'` sin tilde (no afecta a la validación).
- **Etiquetas de pestañas:** iOS expone `"Cuentos, tab, 3 of 4"` (de ahí el regex `Cuentos, tab.*`);
  Android expone el texto plano `"Cuentos"`. Maestro hace match completo, así que el selector difiere.
- **Splash vs bienvenida:** el splash de Expo muestra el título `"Aprendizaje Mágico"`, igual que la
  bienvenida → asertar el título da falso positivo mientras bundlea. Hay que esperar el **botón**
  `"Crear cuenta"` (`extendedWaitUntil`). Tras `pm clear`, Expo Go abre su **dev-menu**; se descarta con
  un `tapOn: { text: Continue, optional: true }` al inicio (BACK **no**: sale de la app).

[Maestro #146]: https://github.com/mobile-dev-inc/maestro/issues/146

### Worktree con enlace git roto (ruta con espacio vs guion)

- **Síntoma:** `git status`/commit dentro de `.claude/worktrees/e2e-nativo-maestro` falla con
  `fatal: not a git repository`; `git worktree list` marca la entrada **`prunable`**.
- **Causa:** el worktree se registró con la ruta `…/Master IA/…` (con **espacio**) mientras que la real
  es `…/Master-IA/…` (con **guion**); ambas referencias (`.git` del worktree y `gitdir` del repo) apuntan
  a la ruta inexistente.
- **Solución:** desde el repo principal, `git worktree repair "<ruta-correcta-del-worktree>"` reescribe
  ambas referencias. Tras reparar, el worktree vuelve a operar con git con normalidad.

## Feature 42 — Sentry (monitorización de errores, US-40)

### El wizard de Sentry falla la instalación en pnpm 11 (`ERR_PNPM_IGNORED_BUILDS`)

- **Síntoma:** `npx @sentry/wizard -i reactNative` aborta con `Installation command pnpm add
@sentry/react-native ... exited with code 1`; el log de error que deja está vacío.
- **Causa:** `@sentry/cli` tiene un `postinstall` (descarga un binario) y pnpm 11 **bloquea los build
  scripts no aprobados**, saliendo con código ≠ 0. El wizard intentó autorizarlo pero dejó un
  **placeholder inválido** en `pnpm-workspace.yaml`: `'@sentry/cli': set this to true or false`.
- **Solución:** poner `'@sentry/cli': true` en `allowBuilds` de `pnpm-workspace.yaml` y `pnpm install`.
  El paquete en sí resuelve bien; el fallo era solo la puerta de build scripts.

### `@sentry/react-native` no se puede importar bajo Vitest (arrastra react-native)

- **Síntoma:** un test que importa un módulo que hace `import * as Sentry from '@sentry/react-native'`
  peta al **cargar la suite** (`Cannot find module '.../promise/setimmediate/es6-extensions'` desde
  `react-native/Libraries/Promise.js`).
- **Causa:** el entorno `node` de Vitest no resuelve los módulos nativos/Flow de react-native (mismo
  problema que `lucide-react-native` en US-30).
- **Solución:** separar la **lógica pura** (gating por DSN, `buildSentryOptions`, `scrubEvent`) en
  `infrastructure/sentry.ts` usando **solo `import type`** de `@sentry/react-native` (se borra en
  runtime), y aislar el **efecto** (`Sentry.init`) en `infrastructure/sentry.bootstrap.ts`, que importa
  el SDK en runtime y se **excluye** de la cobertura (bootstrap, como `composition.ts`). Así `sentry.ts`
  se testea al 100% sin cargar el SDK.

### `expo prebuild` falla en `EXConstants` en monorepo pnpm

- **Síntoma:** tras el prebuild (que el wizard de Sentry dispara), `expo run:ios` falla con
  `PhaseScriptExecution ... EXConstants ... Generate app.config for prebuilt Constants.manifest`.
- **Causa:** fricción conocida de `expo-constants` con la estructura de `node_modules` simlinkada de
  pnpm; **ajena a Sentry** (el pod `RNSentry` sí autolinkó correctamente).
- **Solución (para US-40):** no se necesita build nativo — Sentry funciona a nivel JS en Expo Go y web.
  Se **revirtió** el prebuild (`app.json`, scripts `expo run:*`, `expo-build-properties`) y se borraron
  `ios/`/`.expo/` (carpetas nativas generadas, gitignored; el repo es CNG). El build nativo es otra rama.

### El DSN de `.env` se cuela en el export web del E2E

- **Síntoma (potencial):** con `EXPO_PUBLIC_SENTRY_DSN` en el `.env` local, `expo export` para el E2E
  inlina el DSN en el bundle web → Sentry se inicializaría durante el E2E y enviaría una sesión de flujo
  infantil a sentry.io (rompe el criterio "E2E inactivo" de US-40).
- **Causa:** Expo carga `.env` en cualquier comando, incluido `expo export`. En CI no hay `.env`, pero
  en local sí.
- **Solución:** forzar el DSN vacío en el script: `EXPO_PUBLIC_SENTRY_DSN= ... expo export ...`. Una var
  de entorno ya definida (aunque vacía) tiene **prioridad** sobre el `.env` de Expo (dotenv no la pisa),
  y `getSentryDsn()` trata la cadena en blanco como ausente → Sentry desactivado en el E2E.

### La `release` de Sentry sale de `app.json`, no de `package.json`

- **Síntoma:** el `release` que etiqueta los eventos (`Constants.expoConfig?.version`) leía `0.0.0`
  porque `app.json` tenía esa versión, aunque `packages/app/package.json` iba por `0.16.0`.
- **Causa:** `expo-constants` expone la versión de **`app.json`** (`expo.version`), que es independiente
  del `version` del `package.json`. El gate (SemVer + CHANGELOG) solo tocaba `package.json`.
- **Solución:** mantener **ambos en sync** (`app.json` `expo.version` = `package.json` `version`) y
  subir los dos en cada cierre de feature del app. Si no, la release del dashboard queda desfasada.

## Feature 44 — Observabilidad de errores (US-41/US-42)

### Cerrar dos features en paralelo colisiona en la versión (hay que re-bumpear al mergear)

- **Síntoma:** al cerrar `feature/44` (ErrorBoundary + breadcrumbs) se subió a app `0.18.0` / raíz
  `0.25.0`, pero `develop` ya tenía esos mismos números: otra sesión había cerrado `feature/38`
  (E2E Android, US-38) en paralelo y tomó `0.18.0`/`0.25.0` primero. El merge a `develop` dio
  conflictos en `package.json`, `packages/app/package.json`, `app.json` y `CHANGELOG.md`.
- **Causa:** ambas ramas partieron de `develop` **antes** de que la otra cerrara, así que cada una
  eligió la "siguiente" versión sin saber de la otra. La versión y el `## [x.y.z]` del CHANGELOG son
  un recurso compartido que no se reserva hasta el merge.
- **Solución:** la versión se elige **al mergear**, no al empezar. Si al cerrar la versión ya está
  tomada en `develop`, **re-bumpear** a la siguiente libre (aquí app `0.19.0` / raíz `0.26.0`),
  ajustar el encabezado del CHANGELOG y resolver el conflicto **conservando ambas secciones**
  (la nueva encima de la ya existente). Conviene `git fetch`/mirar `develop` justo antes de fijar
  la versión, y —si se trabaja en paralelo— cerrar las features de una en una para minimizar el
  solape. Ver también [worktree por feature](#worktree-con-enlace-git-roto-ruta-con-espacio-vs-guion).

## Feature 46 — Validación con Zod (US-44)

### `z.unknown().transform()` vuelve la clave **obligatoria** en un `z.object`

- **Síntoma:** al migrar `parseResponse` a Zod, una actividad válida sin `duracionMin`/`nivel`
  (campos que el LLM puede omitir) se rechazaba entera; los tests fallaban con "ninguna actividad
  válida".
- **Causa:** el saneo "número en rango o `undefined`" se modeló como `z.unknown().transform(...)`.
  Un `transform` envuelve el esquema en un pipe que `z.object` trata como **requerido**: si la clave
  falta, falla la validación del objeto completo (no basta con que `unknown` acepte `undefined`).
- **Solución:** añadir `.optional()` al final (`z.unknown().transform(...).optional()`). Con la clave
  ausente, `optional` corta y devuelve `undefined` sin ejecutar el transform; presente con basura, el
  transform la sanea a `undefined`. Regla general: campos opcionales saneados con `transform` →
  siempre `.optional()`.

### Mover una `pattern` de JSON Schema a un literal regex Zod despierta a SonarJS

- **Síntoma:** la regex de email del login (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), que vivía como `pattern`
  (string) en el JSON Schema sin quejas, al pasar a `z.string().regex(/.../)` disparó
  `sonarjs/super-linear-regex` (backtracking) y rompió el lint del gate.
- **Causa:** SonarJS analiza los **literales** de expresión regular, no los patrones en strings; el
  literal expone el backtracking que el string ocultaba.
- **Solución:** reutilizar la justificación que ya tenía la entidad de dominio (`Guardian.emailValido`
  usa la misma regex con `// eslint-disable-next-line sonarjs/super-linear-regex`): formato básico,
  email normalizado y de longitud acotada → sin ReDoS real. Mantener la supresión coherente entre
  capas en vez de complicar la regex.

### Zod no puede entrar en `/domain` (invariante de capas) ni los DTOs derivarse de la infra

- **Síntoma/decisión:** la idea inicial de "una sola fuente de verdad" derivando los DTOs de
  `application` con `z.infer` de los esquemas de ruta **viola** el invariante de capas: obligaría a
  `application → infrastructure` (los esquemas de ruta son infraestructura) y el lint
  `no-restricted-imports` lo bloquea. Igual, `zod` no puede importarse en `/domain` (cero deps).
- **Solución:** los value-objects (`Edad`, `Idioma`) **no se tocan**; los esquemas Zod viven en
  `infrastructure` (rutas, adaptador HTTP) y en `application` solo si no cruzan hacia dentro. La
  duplicación que sí se elimina con `fastify-type-provider-zod` es la del **literal JSON Schema** vs
  el genérico `app.post<{ Body }>` (el body se infiere del esquema), no la de los DTOs.

## Feature 48 — Sesión autenticada con JWT (US-45)

### El patrón dual-namespace de `@fastify/jwt` es frágil para el gate de TypeScript

- **Síntoma:** registrar dos instancias de `@fastify/jwt` (namespaces `access`/`refresh`, secretos
  separados) no añade los métodos `accessJwtSign`/`refreshJwtVerify`… al tipo global de Fastify. Hay
  que augmentar a mano con el helper `FastifyJwtNamespace`, que **bundlea** sign+verify+decode en un
  solo `Record` y los cuelga de `FastifyInstance`/`Reply`/`Request` cruzando métodos donde no existen
  en runtime. Mucho ruido de tipos y riesgo de romper `tsc --noEmit` (el gate).
- **Solución:** **un único registro con un secreto** y un claim `type: 'access' | 'refresh'` en el
  payload. Tipado limpio (default `jwtSign`/`jwtVerify`/`request.user` + un `declare module` mínimo),
  cumple igual los criterios (access corto, refresh largo, refresh endpoint, 401) y es más simple
  (YAGNI). Para el alcance del TFM la seguridad efectiva es la misma.

### `return await fetch()` dentro de un `try`/`finally` deja una rama sin cubrir (v8)

- **Síntoma:** con cobertura `v8`, un `try { return await fetch(...) } catch {…} finally { clearTimeout }`
  reporta una **rama imposible** sin cubrir en el `} finally {` (el `http.ts` es tier CORE 100%, así
  que rompía el umbral). El `return` dentro del `try` con `finally` genera un branch que ningún test
  puede ejercitar.
- **Solución:** asignar a una variable dentro del `try` y **`return` después** del bloque
  (`let response; try { response = await fetch(...) } catch {…} finally {…} return response;`). Mismo
  comportamiento, sin la rama fantasma → 100% de cobertura.

### Proteger rutas rompe los tests de rutas existentes (y el orden `onRequest` vs validación)

- **Síntoma:** al exigir token con un hook `onRequest`, los tests de integración que llamaban a rutas
  ahora protegidas pasaban a **401**. Además, una petición sin token a una ruta con esquema da 401
  (no 400): `onRequest` corre **antes** que la validación del cuerpo.
- **Solución:** helper de test `authHeaders(app)` que firma un access token con `app.jwt.sign(...)` y
  se adjunta en cada `inject` a rutas protegidas. El alta (`POST /guardians`) se dejó **pública** y
  con auto-login (emite sesión), para que el onboarding no necesite un login extra.

### Emulador Android: `localhost` no es el host — usar `10.0.2.2`

- **Síntoma:** la app en el **emulador Android** daba "No se pudo conectar con el servidor" con
  `EXPO_PUBLIC_API_URL=http://localhost:3000` (el backend estaba sano en el host).
- **Solución:** en el emulador Android el host del Mac es **`10.0.2.2`**
  (`EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`); en simulador iOS vale `localhost`; en dispositivo
  físico, la **IP LAN** del Mac. Tras cambiar `.env`, reiniciar Metro con caché limpia (`start -c`),
  porque `EXPO_PUBLIC_*` se lee al arrancar, no en caliente.

## Feature 49 — Conflictos del trabajo en paralelo (devex/proceso)

Cierra estructuralmente las Lecciones A (working tree se revierte) y D (colisión de versión al cerrar
en paralelo): ya no se mitigan a mano, se evitan por diseño. Protocolo en
[trabajo-en-paralelo.md](trabajo-en-paralelo.md); política de versionado en la skill `versionar`.

### La colisión de versión se evita difiriendo la versión al merge, no resolviéndola

- **Síntoma (Lección D):** dos features que cerraban en paralelo elegían el mismo `x.y.z` al iniciar
  el cierre y chocaban en `package.json`/`app.json`/`CHANGELOG.md` al mergear a `develop`.
- **Causa raíz:** el número de versión es un recurso compartido que se "reservaba" en la rama de
  feature pero no se materializaba hasta el merge → ambas ramas lo elegían a ciegas.
- **Solución estructural:** **versionado diferido**. La rama de feature no toca `version` (solo
  acumula bajo `## [Unreleased]`); el número y el fechado del CHANGELOG se asignan **al integrar en
  `develop`**, donde `develop` lineal serializa la operación y no hay dos ramas eligiendo a la vez. La
  política completa vive en la skill `versionar` (fuente única, referenciada desde `CLAUDE.md`).

### Conflictos de CHANGELOG y lockfile: union + `pnpm install`, no merge manual

- **CHANGELOG:** `merge=union` en `.gitattributes` (driver nativo de git) fusiona los apéndices de
  ambos lados bajo `## [Unreleased]` sin marcadores de conflicto. Trade-off: revisar duplicados.
- **`pnpm-lock.yaml`:** **no** se resuelve a mano ni con union (corrompería el árbol de deps). Ante un
  conflicto, `pnpm install` reconcilia el lockfile automáticamente (docs de pnpm) y se commitea.

## Feature 77 — Tema claro/oscuro (US-66)

### Añadir módulos nativos rompe Expo Go: la app se arranca con `expo run:*` (dev build)

- **Síntoma:** `pnpm --filter @magyblob/app start` (o `expo start` → Expo Go) **falla** al abrir la app.
- **Causa:** el tema conmuta las **barras del sistema** con `expo-navigation-bar` y `expo-system-ui`,
  que son **módulos nativos**. El cliente Expo Go trae un runtime fijo y **no** puede cargar módulos
  nativos que no vengan ya empaquetados en él → la app deja de arrancar en Expo Go.
- **Solución:** arrancar con un **development build** propio: `cd packages/app && npx expo run:android`
  (o `npx expo run:ios`). Hacen el prebuild, compilan la app con sus módulos nativos y lanzan Metro;
  después se itera con Metro ya activo. Docs actualizados (READMEs raíz y del app, `estrategia-pruebas.md`).
- **Coletazo en el E2E nativo (Maestro):** los flows dejan de valer sobre Expo Go; hay que instalar el
  dev build y usar como `appId` el `bundleIdentifier`/`package` de la app (no el de Expo Go).

## Lote US-68/US-69 — Logros y enseñanza (2026-07-01)

### Migraciones Prisma escritas a mano (sin Docker) + `prisma generate` para el gate

- **Contexto:** el gate (`pnpm check`) no levanta Postgres; las migraciones se aplican en
  `docker compose up` (`migrate deploy`). Al añadir un campo/modelo al `schema.prisma` no se puede
  correr `prisma migrate dev` (necesita una BD/shadow).
- **Solución:** escribir el `migration.sql` **a mano** en una carpeta con timestamp mayor que la última
  (como ya hacían varias migraciones del repo, p. ej. `2026...` con SQL manual) y correr
  `pnpm --filter @magyblob/backend prisma:generate` (sin BD) para regenerar el cliente. Sin ese
  `generate`, el **typecheck falla** porque los tipos generados no conocen el campo/modelo nuevo
  (`Story.ensenanza`, modelo `Achievement`). El cliente generado (`src/generated/prisma`) está
  gitignoreado (lo rehace `postinstall`), así que no se commitea.
- **Regla útil:** tras tocar `schema.prisma` → (1) escribir la migración SQL a mano, (2)
  `prisma:generate`, (3) actualizar `Docs/modelo-datos.md` en el mismo cambio (regla schema↔modelo).

### i18next con `count` para pluralizar etiquetas de logros

- Las etiquetas de objetivo de los logros ("Leer 1 cuento" vs "Leer 5 cuentos") usan las claves
  `*_one`/`*_other` de i18next con `t(clave, { count })`; evita concatenar el número con un plural fijo.

## Lote de ajustes UX + cold-start (2026-07-01, rama `feature/81-ajustes-ux-render`)

### `toBeVisible()` de jest-dom trata `opacity: 0` como NO visible → animaciones de entrada sin opacidad

- **Síntoma:** al envolver tarjetas/imágenes/botones en un wrapper de animación de entrada que arranca
  con `opacity: 0` (fade-in), decenas de tests con `expect(...).toBeVisible()` fallaban (react-native-web
  renderiza `opacity:0` y jest-dom lo considera invisible), aunque el elemento estaba montado.
- **Causa:** en tests no se avanza el reloj de animación (Animated JS driver usa RAF), así que la opacidad
  se queda en ~0 en el momento de la aserción.
- **Solución:** el wrapper `Appear` anima **`translateY` + `scale`** (0.98→1) y **no la opacidad** (queda
  en 1). Sigue siendo una entrada atractiva y no altera la visibilidad para los tests. `useNativeDriver:
false` para que funcione igual en nativo y en react-native-web.

### Tests de timeout de red: al cambiar los presupuestos hay que ajustar el avance de timers

- Subir `DEFAULT_TIMEOUT_MS` (30→60 s) y el de generación (90→120 s) por el cold start de Render rompió
  dos tests de `http.test.ts` que avanzaban los timers al valor antiguo. Regla: los tests con
  `vi.advanceTimersByTimeAsync(...)` deben avanzar al **nuevo** presupuesto (×nº de reintentos + backoff).

### `renderHook` + timers falsos: envolver `advanceTimersByTime` en `act`

- Un hook que hace `setState` desde un `setTimeout` (p. ej. `useSlowHint`) no refleja el cambio si se
  avanzan los timers fuera de `act(...)`. Envolver `act(() => vi.advanceTimersByTime(ms))`.

## Actividades realizadas en el Historial (2026-07-01, rama `feature/72-actividades-historial`, US-72)

### "Hecha" debe definirse por `completadaEn`, no por `valoracion`

- **Síntoma:** una actividad marcada como realizada podía no aparecer en el Historial.
- **Causa:** la app decidía "hecha" por `valoracion != null`, pero completar era un flujo de **dos pasos**
  ("Realizado" solo revelaba las estrellas; la actividad se guardaba al **tocar una estrella**). Si el
  toque no registraba o no se puntuaba, no se completaba. Además el backend ya contaba las completadas por
  **`completadaEn`** (`domain/logros.ts`), así que la app era incoherente con el propio backend.
- **Solución:** valoración **opcional** (dominio, DTO, ruta Zod); "Realizado" completa al instante
  (`onComplete()` sin valoración) y las estrellas quedan editables para puntuar después; el estado "hecha"
  y el filtro del Historial pasan a `completadaEn != null`. Sin migración (`valoracion`/`completadaEn` ya
  eran nullable).

### Reproducir con E2E antes de "arreglar": el tab navigator mantiene pestañas montadas

- El primer E2E que reproducía el flujo falló por **strict mode** de Playwright: `getByText('Actividad de
arte nº 1')` resolvía a **2 elementos** (la pestaña Actividades y la de Historial siguen montadas y
  **visibles** en react-navigation web). No era el bug: la actividad **sí** estaba en el Historial. Lección:
  acotar la aserción a la sección con un `testID` (`history-activities`) en vez de `.first()`/`filter({visible})`.

### Lote de ajustes 3 (US-83..US-88)

- **`react-native-page-flipper` NO es compatible con Reanimated 4 / New Architecture.** Se adoptó
  para un curl "real" (su `renderPage` admite nodos, así que serializando `data: string[]` a JSON
  servía para texto), pasó el gate y el `expo export` web, pero en **dev build (Android/iOS) crashea en
  runtime**: `Render Error: undefined is not a function` en `BookPagePortrait` al abrir el cuento (la
  v1.0.1, sin mantenimiento, usa APIs de reanimated antiguas). **Lección:** el gate + export web NO
  garantizan que una librería nativa cargue en el runtime nuevo — hay que probar en **dev build**
  antes de comprometerse. Se revirtió al **pliegue con reanimated** (US-79) + estructura de libro
  (portada/FIN); se quitaron `react-native-page-flipper`/`react-native-linear-gradient`/
  `expo-linear-gradient` y su stub/alias de Vitest.
- **react-native-web pinta `Image` con `resizeMode="contain"` como dos nodos con rol `img`** (un
  contenedor `div[role=img]` + un `<img>`), ambos con el nombre accesible. En tests, usar
  `getAllByRole('img', { name })` en vez de `getByRole` (que falla por "multiple elements").
- **Barra de pestañas (US-88 #7/#8): implementada y luego REVERTIDA por preferencia del usuario.** Se
  probaron dos enfoques para el resalte "todo el botón" —`tabBarActiveBackgroundColor` +
  `tabBarItemStyle` (no rellenaba de forma fiable en Android) y un `tabBarButton` propio (sí cubría
  todo el ítem)— y el inset inferior con `useSafeAreaInsets`/`makeTabBarStyle` para el edge-to-edge de
  Android. Tras las pruebas, el usuario pidió **dejar el tab como estaba antes** (blob alrededor del
  icono + `tabBarStyle` original), así que se revirtió. Lección para futuros cambios de tab: validar el
  aspecto en dispositivo **antes** de invertir esfuerzo, porque el estilo previo era el preferido.
- **Colores de botón: regla "sin dos acciones del mismo color en una misma pantalla".** No basta con
  "cada acción, un color fijo"; hay que garantizar que las acciones **co-visibles** tengan colores
  distintos (aparecieron colisiones Generar cuento/Crear cuenta y Ver actividades/Buscar). Con 4
  colores no-destructivos, dos acciones comparten color solo si **nunca** coinciden en la misma
  pantalla (p. ej. Crear cuenta y Mis logros = ámbar; Ya tengo cuenta y Búsqueda = cielo).
