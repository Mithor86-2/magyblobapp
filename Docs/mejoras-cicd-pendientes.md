# Mejoras de CI/CD pendientes (backlog)

> Backlog vivo de mejoras del pipeline de CI/CD. Es el **seguimiento** de las mejoras que quedaron
> por hacer; la descripción del flujo actual (fases, tests, reglas) vive en
> [flujo-cicd.md](flujo-cicd.md). Origen: heredado del antiguo `analisis-cicd.md` (2026-07-02), del
> que aquí solo sobrevive lo que **sigue pendiente** (lo ya implementado se lista en §4).

> [!NOTE]
> Marca cada tarea como pendiente `[ ]` / hecha `[x]` y muévela a §4 cuando se complete. Al abordar un
> bloque, conviene sacarlo a su rama con la skill `abrir-feature` y su plan en
> [planes/](planes/README.md). **Última revisión del estado:** 2026-07-03.

---

## 1. Seguridad (prioridad alta)

En una app de menores el escaneo de secretos y de CVEs es especialmente pertinente (ver
[cumplimiento-menores.md](cumplimiento-menores.md)).

- [ ] **`gitleaks` como job del gate.** Escaneo de secretos en cada PR/push. Pertinente por el manejo
      de API keys (Groq / ElevenLabs / JWT).
      _Aceptación:_ un secreto de prueba en un commit hace fallar el job; el gate lo bloquea.
- [ ] **`pnpm audit --audit-level=high`** como paso (informativo al principio) en el job `gate`.
      _Aceptación:_ el paso corre en CI y reporta CVEs ≥ high sin romper el build hasta decidir subirlo
      a bloqueante.
- [ ] **Habilitar en Settings → Security** (repo ahora **público**, así que el _secret scanning_ es
      gratis): _Dependabot alerts_, _secret scanning_ + _push protection_.
      _Aceptación:_ los tres aparecen activos en la config del repo (hoy estaban en `null`).
- [ ] **Anclar las acciones por SHA** en vez de tag flotante (`@v4`, `@v6`, …) y dejar que Dependabot
      las mantenga. Reduce superficie de _supply-chain_ y hace el build reproducible.
      _Aceptación:_ todos los `uses:` de `.github/workflows/` referencian un SHA de 40 chars.

## 2. Robustez del despliegue (prioridad media)

- [ ] **Separar la migración del arranque.** Mover `prisma migrate deploy` a un _pre-deploy command_
      de Render (o un paso propio) en vez del `CMD` del contenedor, para aislar un fallo de migración
      del arranque del server. En plan free (1 instancia) una migración mala tumba el arranque.
      _Aceptación:_ el `CMD` solo arranca `node dist/index.js`; la migración corre en su fase previa.
- [ ] **GitHub Environments/Deployments.** Registrar el despliegue a Render como _Deployment_ para dar
      visibilidad al estado de producción desde GitHub (hoy la integración es un webhook de git plano,
      sin historial ni gates de entorno).
      _Aceptación:_ los deploys aparecen en la pestaña _Environments_ del repo.

## 3. Eficiencia y cobertura (prioridad baja)

- [ ] **Cachear browsers de Playwright** (`~/.cache/ms-playwright`) y el **cliente Prisma** entre
      jobs; valorar Turbo/remote cache para no repetir `install` + `build` en los tres jobs.
      _Aceptación:_ el segundo run de un PR sin cambios de deps reutiliza la caché (tiempos menores en
      los logs).
- [ ] **Completar el E2E nativo Android en CI** (`reactivecircus/android-emulator-runner`): la receta
      local ya está validada en los comentarios de [`e2e-native.yml`](../.github/workflows/e2e-native.yml);
      falta cablear el emulador en el runner y quitar el placeholder de iOS.
      _Aceptación:_ un `workflow_dispatch` de `e2e-native.yml` completa el flow Android en verde (exit 0).
- [ ] **Revisar `activity.repo.test.ts`** (histórico de _deep equal_ inestable de una `Activity`): si
      aún produce rojos intermitentes en CI, estabilizarlo.
      _Aceptación:_ 20 ejecuciones consecutivas de `test:integration` sin rojo intermitente.

## 4. Gobernanza (prioridad baja)

- [ ] **CODEOWNERS.** Añadir `.github/CODEOWNERS` y, si el flujo lo pide, activar _require code owner
      review_ en el ruleset `protege-main` (hoy `require_code_owner_review: false`).
      _Aceptación:_ el fichero existe y GitHub asigna revisores automáticamente en los PR.

---

## 5. Ya implementado (histórico del backlog)

Estas mejoras venían del análisis original y **ya están hechas** — se dejan registradas para no
reabrirlas y para trazar el porqué:

- [x] **Construir la imagen Docker en CI** → job `docker-build` con smoke de arranque
      (build + `migrate` + `node dist` + `/health`). Cerró el mayor riesgo (build-ok/runtime-ko).
- [x] **Smoke test `/health` post-deploy** → workflow [`post-deploy.yml`](../.github/workflows/post-deploy.yml).
- [x] **`timeout-minutes` en cada job** → gate 15, integración 20, e2e-app 25.
- [x] **CodeQL (JS/TS) en PR + semanal** → workflow [`codeql.yml`](../.github/workflows/codeql.yml).
- [x] **Workflow de EAS** (`eas build --profile preview` en `workflow_dispatch`) →
      [`eas-build.yml`](../.github/workflows/eas-build.yml).
- [x] **Barrera CI → merge.** El repo pasó a **público** y se crearon los rulesets `protege-main`
      (exige los 3 checks de CI + PR) y `protege-develop`. Detalle en [flujo-cicd.md §4](flujo-cicd.md).
- [x] **Dependabot** → [`.github/dependabot.yml`](../.github/dependabot.yml) ya presente.

---

## 6. Referencias

- Flujo de CI/CD (fases, tests, reglas): [flujo-cicd.md](flujo-cicd.md).
- Histórico del incidente v1.9.0 (crash Prisma 7): [analisis-pruebas-cicd.md](analisis-pruebas-cicd.md).
- Cumplimiento de menores (marco para las decisiones de seguridad): [cumplimiento-menores.md](cumplimiento-menores.md).
