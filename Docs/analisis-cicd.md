# Análisis de CI/CD y sugerencias de mejora

> Fotografía del estado de la integración y entrega continuas de magyblob a **2026-07-02**, con
> revisión tanto de los ficheros del repo como de la configuración que vive en GitHub/Render.
> Documento de análisis; las mejoras que se decidan ejecutar se planifican en `Docs/planes/`.

## 1. Inventario — qué hay hoy

### Integración continua (GitHub Actions)

Dos workflows registrados y activos en GitHub (no hay ninguno oculto fuera del repo):

**[`.github/workflows/ci.yml`](../.github/workflows/ci.yml)** — dispara en `push` a `main`/`develop`
y en todos los `pull_request`. `concurrency` con `cancel-in-progress` por rama. Tres jobs:

| Job                       | Qué hace                                                                                                                    | Infra               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `gate`                    | `pnpm check` (typecheck + lint + format:check + unit) + `pnpm coverage` (umbrales por tier, US-35) + sube `coverage-report` | Node 24, cache pnpm |
| `integration-e2e-backend` | `test:integration` (Prisma ↔ Postgres real) + `test:e2e` backend, con Testcontainers                                        | ubuntu + Docker     |
| `e2e-app`                 | Playwright (Chromium + WebKit) sobre Expo web contra backend mock; sube `playwright-report`                                 | ubuntu + Docker     |

**[`.github/workflows/e2e-native.yml`](../.github/workflows/e2e-native.yml)** — E2E nativo (Maestro),
esqueleto. `workflow_dispatch` + cron nocturno (03:00 UTC), **fuera** del gate de PR por coste
(ADR 0005). Jobs iOS (macOS) y Android (ubuntu) mayormente en `TODO`/placeholder; la receta Android
está validada en local pero aún sin cablear el emulador en CI.

### Entrega / despliegue continuo

- **Backend → Render** por _auto-deploy de git_ declarado como IaC en
  [`render.yaml`](../render.yaml) (`branch: main`, Docker). **No hay workflow de deploy en Actions**:
  Render observa `main` y construye el [`Dockerfile`](../packages/backend/Dockerfile) por su cuenta.
  Migraciones vía `prisma migrate deploy` en el `CMD` de arranque del contenedor.
- **App → EAS** ([`packages/app/eas.json`](../packages/app/eas.json), perfiles dev/preview/production)
  **disparado a mano**: no hay CI que ejecute `eas build` / `eas submit`.

### Calidad local (hooks Husky)

- **pre-commit**: `lint-staged` sobre lo _staged_.
- **pre-push**: gate completo (`pnpm check`) + `pnpm coverage`; bloquea el push si algo está en rojo.

### Gestión de secretos

Correcta: en `render.yaml` los secretos van con `sync: false` (se introducen en el panel), nunca con
valor real en el repo. `.dockerignore` excluye `.env*` (salvo `.env.example`).

## 2. Configuración observada en GitHub/Render

Revisión directa vía API de GitHub (`Mithor86-2/magyblobapp`, **privado**, plan free):

- **CI real y en uso**: ejecuciones frecuentes en PR y en merges a `develop` (~3–4 min el camino
  feliz).
- **Protección de ramas: NO disponible** — la API responde _"Upgrade to GitHub Pro or make this
  repository public"_. En un repo **privado con plan free no se puede exigir** que los checks de CI
  estén en verde antes de mergear. Hoy la única barrera efectiva es el hook **pre-push** local.
- **Seguridad desactivada**: _secret scanning_, _push protection_ y _Dependabot alerts / security
  updates_ aparecen todos en `null`; _vulnerability alerts_ deshabilitadas. No hay Dependabot ni
  Renovate (`.github/dependabot.yml` no existe), ni CODEOWNERS.
- **Sin GitHub Environments/Deployments**: la integración con Render es un webhook de git plano, así
  que **el estado de despliegue no es visible desde GitHub** (ni gates de entorno, ni historial).

### Hallazgo relevante: CI y CD están desacoplados

El CI del commit de release **v1.6.0 sobre `main` falló** (los tres jobs): cobertura CORE por debajo
del 100 % (`FallbackProvider.ts`, `createAIProvider.ts`, `MockProvider.ts`, `use-cases/**`) **y** un
test de integración inestable (`test/integration-db/activity.repo.test.ts`, _deep equal_ de una
`Activity`). Aun así el merge a `main` se completó y **Render despliega ante el push a `main` con
independencia de si el CI pasó**. Es decir: un build con cobertura bajo umbral y un test rojo pudo
llegar a producción. Es la consecuencia directa de no poder proteger ramas + CD por webhook de git.

## 3. Puntos fuertes

- Pirámide de tests bien separada por coste: unit rápido en el gate; integración/E2E con
  Testcontainers en jobs propios; nativo fuera del PR. Coherente con `Docs/estrategia-pruebas.md`.
- Umbrales de cobertura **reales y por tier** (CORE 100 %, IMPORTANT 80 %) forzados en CI, no solo
  en local.
- IaC de verdad (`render.yaml`) + Dockerfile multi-stage reproducible; migraciones sin paso oculto.
- Hooks pre-push que evitan romper `main`/`develop` desde local.
- `concurrency` con cancelación: no se acumulan ejecuciones obsoletas por rama.

## 4. Debilidades / riesgos

1. **La imagen Docker nunca se construye en CI.** Render la construye al desplegar; un fallo del
   `Dockerfile`, del `deploy --prod --legacy` o del `.dockerignore` **solo se descubre en
   producción**. Es el hueco más serio.
2. **CI y CD desacoplados sin barrera** (ver §2): con el plan free no se puede proteger `main`, y
   Render despliega por push. Un rojo puede ir a producción (ya ocurrió con v1.6.0).
3. **Sin smoke test post-deploy.** Nadie verifica `/health` tras el deploy; un arranque o migración
   roto pasa desapercibido hasta que entra un usuario.
4. **`migrate deploy` en el arranque del contenedor**, sin job de migración separado ni estrategia
   de rollback. En plan free (1 instancia) una migración mala tumba el arranque.
5. **Sin gestión de dependencias automatizada** (no Dependabot/Renovate) ni **escaneo de seguridad**
   (`pnpm audit`, CodeQL, secret scanning todos ausentes/desactivados). En una app de menores el
   escaneo de secretos y CVEs es especialmente pertinente (ver `Docs/cumplimiento-menores.md`).
6. **Test de integración inestable** (`activity.repo.test.ts`): produce rojos intermitentes en CI y
   erosiona la confianza en la señal.
7. **Acciones ancladas por tag flotante** (`@v4`), no por SHA → build no reproducible y superficie de
   supply-chain.
8. **Sin `timeout-minutes` en los jobs** → un cuelgue (Testcontainers, Playwright) consume minutos
   hasta el límite por defecto.
9. **`pnpm install` se repite en los 3 jobs** sin cache de artefactos entre ellos (build, browsers de
   Playwright, cliente Prisma).
10. **`e2e-app` instala Chromium _y_ WebKit** con `--with-deps` (lento); confirmar si la config de
    Playwright ejecuta ambos o sobra WebKit.
11. **CD de la app inexistente en CI**: builds EAS 100 % manuales; sin trazabilidad commit ↔ APK/AAB.
12. **Sin CODEOWNERS** ni visibilidad de despliegues en GitHub (no hay Environments).

## 5. Mejoras sugeridas (priorizadas)

### Alto impacto, bajo esfuerzo

- **Construir la imagen Docker en CI** (job `docker-build` con `docker/build-push-action`,
  `push: false`, `load: true` en PR). Cierra el hueco nº 1 y valida el `Dockerfile` en cada PR.
- **Smoke test post-deploy**: tras el deploy de Render, hacer _poll_ de
  `https://magyblobapp.onrender.com/health` y fallar si no responde 200 (workflow con
  `workflow_dispatch`/`deploy hook`, o el propio _health check_ de Render como gate).
- **`timeout-minutes`** en cada job (p. ej. gate 15, integración 20, e2e-app 25).
- **Estabilizar `activity.repo.test.ts`** (el _deep equal_ de `Activity`) para eliminar el rojo
  intermitente.

### Barrera CI → merge (limitada por el plan)

- Con **repo privado free no hay protección de ramas**. Opciones honestas: (a) mantener y reforzar el
  **pre-push** local como barrera principal; (b) **GitHub Pro/Team** para habilitar branch protection
  y _rulesets_; (c) hacer el repo **público** (revisar cumplimiento antes). Documentar la decisión —
  hoy el pre-push es la única red y no cubre a quien lo haya saltado con `--no-verify`.

### Seguridad

- **Dependabot**: crear `.github/dependabot.yml` para `npm` (pnpm) + `github-actions` + `docker`,
  agrupado semanal. Las _version updates_ de Dependabot funcionan también en repos privados free.
- Habilitar en **Settings → Security** los _Dependabot alerts_ y el _secret scanning + push
  protection_ disponibles (hoy en `null`).
- Añadir **`pnpm audit --audit-level=high`** (informativo) y **CodeQL** (JS/TS) en PR + semanal.
- **gitleaks** como job del gate — pertinente por el manejo de API keys (Groq / ElevenLabs / JWT).
- **Anclar las acciones por SHA** y dejar que Dependabot las mantenga.

### Eficiencia / robustez

- Cachear **browsers de Playwright** (`~/.cache/ms-playwright`) y el **cliente Prisma**; valorar
  Turbo/remote cache para no repetir `install` + `build` en los tres jobs.
- Separar la **migración del arranque**: mover `prisma migrate deploy` a un _pre-deploy command_ de
  Render (o un paso propio) en vez del `CMD`, para aislar fallos de migración del arranque del server.
- Registrar en GitHub **Environments/Deployments** para dar visibilidad al estado de producción.

### Entrega de la app

- Añadir un **workflow de EAS** (mínimo `eas build --profile preview` en `workflow_dispatch`;
  idealmente `production` al _taggear_ release) para trazar builds ↔ commit.
- Completar el **E2E nativo Android** en CI (`reactivecircus/android-emulator-runner`); la receta
  local ya está validada en los comentarios de `e2e-native.yml`.

### Gobernanza

- **CODEOWNERS** + review obligatoria (cuando el plan permita branch protection).

## 6. Primer lote recomendado

Si se aborda una feature de mejora de CI/CD, el orden coste/beneficio sugerido es:

1. Construir la imagen Docker en CI (cierra el mayor riesgo).
2. `timeout-minutes` + estabilizar el test de integración inestable.
3. Dependabot + habilitar alerts/secret scanning + gitleaks.
4. Smoke test `/health` post-deploy.
