---
name: crear-release
description: Publica un nuevo release a producción de magyblobApp de principio a fin — versiona (versionado diferido), integra develop→main por PR con CI verde (auto-deploy del backend en Render), verifica /health en prod, crea el GitHub Release con notas del CHANGELOG, dispara el build EAS de la APK y actualiza el enlace de descarga del README. Úsala cuando el usuario diga "crea nuevo release", "nuevo release", "publica release" o "release a producción". SIEMPRE muestra el plan y pide confirmación explícita antes de ejecutar, y se detiene pidiendo el "sí" antes de cada paso que sale al exterior (push, merge a main, GitHub Release, build EAS).
---

# Crear release

Runbook para publicar un **nuevo release a producción** de **magyblobApp**: deja el código en una
versión nueva, el **backend desplegado en Render** y la **APK** construida y enlazada. Es el paso que
sigue a acumular features en `develop` (cerradas con `cerrar-feature` + versionadas con `versionar`).

Sigue las reglas _enforced_ del [CLAUDE.md](../../../CLAUDE.md): Definition of Done, versionado
diferido, y **no integrar/publicar sin confirmación explícita**. Delega el versionado en la skill
[versionar](../versionar/SKILL.md) (fuente única) — no la dupliques.

## Regla de oro (enforced)

1. **Primero muestra el plan completo** (los pasos de abajo, con la versión concreta que se va a
   publicar) y **pide confirmación explícita** ("¿procedo con el release vX.Y.Z?"). No ejecutes nada
   hasta el "sí".
2. **Detente y vuelve a confirmar antes de cada acción externa**: push a `develop`, merge del PR a
   `main` (despliega producción), crear el GitHub Release, y disparar el build EAS (consume créditos).
3. **Nunca continúes con un paso en rojo.** Si el gate o la CI fallan, arréglalo (o abórtalo) antes de
   seguir. No publiques con checks en rojo.
4. Identidad de commits: cuenta personal `Mithor86-2` (no la resetees).

## Prerrequisitos (verifícalos al empezar)

```bash
gh auth status                       # GitHub CLI autenticado
git branch --show-current            # debe ser: develop
git status --short                   # árbol limpio (salvo lo que vayas a versionar)
```

- `gh` (GitHub CLI) autenticado con permisos sobre el repo.
- Para el build EAS: secreto de repo **`EXPO_TOKEN`** configurado (lo usa `eas-build.yml`). Para
  **leer el UUID** del build desde local hace falta `EXPO_TOKEN` en el entorno o `npx eas-cli login`;
  si no, el skill te pedirá el UUID desde expo.dev.
- Backend de prod: `https://magyblobapp.onrender.com` (auto-deploy al pushear `main`).

---

## Paso 0 — Pre-vuelo y decidir la versión

1. Sitúate en `develop` limpio y sincroniza: `git fetch origin develop`.
2. **Gate verde** (Definition of Done):
   ```bash
   pnpm check          # typecheck + lint + format:check + test
   ```
   No sigas si falla.
3. **Decide la versión SemVer** revisando lo acumulado bajo `## [Unreleased]` en
   `packages/backend/CHANGELOG.md` y `packages/app/CHANGELOG.md` (criterio en [versionar](../versionar/SKILL.md):
   `patch` correcciones · `minor` funcionalidad nueva · `major` incompatibles).
4. Lee la versión actual en `package.json` (raíz). Comprueba si esa versión **ya se publicó**
   (`git tag -l` / `gh release list`):
   - Si `[Unreleased]` tiene contenido → hay que **versionar** (Paso 1).
   - Si `[Unreleased]` está vacío y la versión actual **no** tiene tag/Release → ya está versionada en
     `develop`; salta el Paso 1 y publica esa versión.

**Muestra al usuario el plan con la versión concreta (`vX.Y.Z`) y pide confirmación antes de seguir.**

---

## Paso 1 — Versionar en `develop` (versionado diferido)

Solo si hay cambios en `## [Unreleased]`. Aplica la skill [versionar](../versionar/SKILL.md):

- Bump `version` a `X.Y.Z` en: `package.json` (raíz), `packages/backend/package.json`,
  `packages/app/package.json` y **`packages/app/app.json`** (línea `version`).
- Mueve `## [Unreleased]` → `## [X.Y.Z] - AAAA-MM-DD` en **ambos** CHANGELOG y deja `[Unreleased]`
  vacío con sus 6 secciones (Added/Changed/Deprecated/Removed/Fixed/Security).
- Commit:
  ```bash
  git add package.json packages/*/package.json packages/app/app.json packages/*/CHANGELOG.md
  git commit -m "chore(release): vX.Y.Z"
  ```

> `app.json` debe quedar en `X.Y.Z` **antes** del build EAS: `eas.json` usa `appVersionSource: remote`,
> así que EAS toma la versión de `app.json` (y gestiona el `versionCode` en remoto).

---

## Paso 2 — Disparar el build EAS de la APK (perfil `preview`)

Se lanza **antes** del PR a `main` para que el enlace del README viaje en el mismo PR y producción
quede coherente de una vez. Confirma antes (consume créditos de Expo).

```bash
gh workflow run eas-build.yml --ref develop -f profile=preview -f platform=android
```

- El workflow encola el build con `--no-wait`; el build corre en Expo (~10–20 min).
- **Obtener el UUID del nuevo build** (elige lo que funcione):
  ```bash
  # Requiere EXPO_TOKEN en el entorno o `npx eas-cli login`:
  cd packages/app && npx eas-cli build:list --platform android --limit 1 --json --non-interactive
  ```
  Haz _polling_ hasta que `status` sea `finished`; toma el campo `id` (UUID) y la URL del build.
- Si **no** hay auth local de EAS, **detente y pide al usuario** el UUID desde
  `https://expo.dev/accounts/mithor1986/projects/magyblob-app/builds` cuando el build termine.

La APK apunta a producción por config (`eas.json` perfil `preview`:
`EXPO_PUBLIC_API_URL=https://magyblobapp.onrender.com`) — no hay que tocar nada más.

---

## Paso 3 — Actualizar el enlace de descarga en el README

En `README.md` (sección de instalación de la APK), actualiza **el UUID del build y la etiqueta de
versión**:

```markdown
**APK lista para instalar (vX.Y.Z):** [build en Expo EAS](https://expo.dev/accounts/mithor1986/projects/magyblob-app/builds/<UUID_NUEVO>)
```

```bash
git add README.md
git commit -m "docs(release): APK vX.Y.Z (build EAS)"
```

---

## Paso 4 — Push de `develop`

```bash
git push origin develop
```

(Incluye el commit de versión, el del README y todo lo acumulado.)

---

## Paso 5 — Integrar `develop` → `main` por PR (despliega el backend)

`main` está protegida por el ruleset `protege-main` (exige checks verdes). **Confirma antes del merge.**

```bash
gh pr create --base main --head develop \
  --title "Release vX.Y.Z" \
  --body "Publica vX.Y.Z. Ver CHANGELOG de backend y app."

gh pr checks --watch          # espera Gate + Integración/E2E backend + E2E app (Playwright)
# Solo si TODO está verde y el usuario confirma:
gh pr merge --merge           # merge a main → auto-deploy en Render
```

- Si algún check falla, **para**: arréglalo en `develop` (nuevo commit/push) y reintenta; no fuerces.
- El merge a `main` dispara el **auto-deploy del backend en Render** (Dockerfile →
  `prisma migrate deploy && node dist/index.js`: migraciones automáticas al arrancar).

---

## Paso 6 — Verificar que producción quedó funcionando

Render tarda un poco (cold start incluido). El workflow `post-deploy.yml` ya hace _polling_ de
`/health`; verifícalo tú también:

```bash
curl -s https://magyblobapp.onrender.com/health
# Esperado: {"status":"ok","service":"magyblob-backend","version":"X.Y.Z"}
```

Confirma que **`version` coincide con `X.Y.Z`** (que Render sirve el build nuevo). Si no coincide tras
unos minutos, revisa el deploy en Render y el run de `post-deploy.yml` antes de continuar.

---

## Paso 7 — Crear el GitHub Release (tag `vX.Y.Z`)

Con `main` ya desplegada y verificada. Las notas salen del CHANGELOG de esta versión.

```bash
# Arma las notas con las secciones [X.Y.Z] de ambos CHANGELOG (backend + app).
gh release create vX.Y.Z \
  --target main \
  --title "vX.Y.Z" \
  --notes-file <(printf '%s\n' "## Backend" "<sección [X.Y.Z] de packages/backend/CHANGELOG.md>" \
                                "## App" "<sección [X.Y.Z] de packages/app/CHANGELOG.md>")
```

- Esto **crea el tag** `vX.Y.Z` sobre `main` (convención del repo: prefijo `v`).
- Verifica: `gh release view vX.Y.Z`.

---

## Cierre

Resume al usuario: versión publicada, estado de `/health` en prod, URL del GitHub Release, y el enlace
del build EAS ya reflejado en el README. Recuerda que la APK del `preview` apunta al backend de prod.

## Checklist del release

- [ ] `develop` limpio y `pnpm check` verde; versión SemVer decidida.
- [ ] Versionado (bump ×4 + CHANGELOG fechado) commiteado como `chore(release): vX.Y.Z` (si aplica).
- [ ] Build EAS (`preview`/android) disparado y **UUID** obtenido.
- [ ] README actualizado (UUID + etiqueta `vX.Y.Z`) y commiteado.
- [ ] `develop` pusheado.
- [ ] PR `develop`→`main` con **CI verde** y mergeado (con confirmación) → deploy Render.
- [ ] `/health` de prod sirve `version: X.Y.Z`.
- [ ] GitHub Release `vX.Y.Z` creado (tag sobre `main`) con notas del CHANGELOG.
