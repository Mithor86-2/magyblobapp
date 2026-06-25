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
