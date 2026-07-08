# FASE 7 — Entrega y defensa del TFM

> **Estado:** en curso. Este documento desarrolla el **cómo** se prepara la entrega
> final del TFM (los 5 entregables del formulario). El alcance global vive en
> [plan-ejecucion-master.md](../plan-ejecucion-master.md) y el estado por fase en
> [phases.md](../phases.md) (FASE 7 — Documentación y defensa).
>
> **Última verificación del estado: 2026-07-08** (contraste plan ↔ app real; ver "Verificación" abajo).

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecho

## Contexto

El producto está cerrado a nivel de código (HITO 1 y 2 cerrados, ~100 historias de usuario,
**raíz/app v1.16.1 · backend v1.13.0**, gate verde, CI + E2E, releases publicadas hasta **v1.16.0**).
Lo que falta **no es más código, es empaquetar la entrega**. Este plan cubre los cinco entregables
exigidos por el TFM y cierra la FASE 7.

### Verificación 2026-07-08 (plan ↔ app real)

Contraste del plan contra el estado real del repo y de producción. Resultado: **buena parte de las
Fases A–C ya está hecha**; lo pendiente se concentra en credenciales, bloque de entrega, diagrama,
slides, vídeo y defensa.

- ✅ **Render vivo** — `https://magyblobapp.onrender.com/health` → 200, backend **v1.13.0** (coincide
  con el código). Respondió en caliente; advertir igualmente del _cold start_ (~50 s) del plan free.
- ✅ **Repo público** — `github.com/Mithor86-2/magyblobapp` es **PUBLIC**.
- ✅ **APK** — enlace de **Expo EAS** en el README (v1.16.0). ⚠️ **No** está adjunto como asset en las
  GitHub Releases → falta el **respaldo permanente** (el enlace de EAS puede caducar).
- ✅ **README** — descripción (1a), stack en tabla (1b), instalación (1c), estructura (1d, básica) y
  funcionalidades (1e) están al día.
- ❌ **Usuario de prueba** — **no existe seed** de guardián de prueba (solo `AppSetting`); B2 pendiente.
- ❌ **Bloque "Entrega TFM" + credenciales (1f)** — el README no tiene el bloque con
  credenciales/slides/vídeo.
- ❌ **Diagrama de arquitectura** — no hay Mermaid de arquitectura en README (sí el ER en
  [modelo-datos.md](../modelo-datos.md)).
- ❌ **Slides · vídeo · defensa** — pendientes.

> Nota de docs: [phases.md](../phases.md) tiene la sección **FASE 7** aún marcada ⬜ con ítems que ya
> están parcialmente hechos (README profesional, ADRs, Render vivo). Repasar y sincronizar al cerrar
> esta fase.

**Entregables del formulario (fuente: documento de entrega del máster):**

1. Documentación completa (README.md): a) descripción general · b) stack tecnológico ·
   c) instalación/ejecución · d) estructura del proyecto · e) funcionalidades · **f) usuario y
   contraseña de prueba (hay login)**.
2. Código fuente: repositorio **público** en GitHub.
3. Despliegue/publicación en funcionamiento (URL o acceso real).
4. Slides de presentación (URL pública).
5. Vídeo con explicación + captura de pantalla (URL pública).

Fecha de entrega: **20/07/2026**.

## Decisiones de alcance (tomadas)

- **Acceso del evaluador:** **APK** (enlace de descarga de Expo/EAS) + **backend** en Render.
  **No** se entrega versión web.
- **Credenciales de prueba:** se **siembra un usuario de prueba en producción** (email+contraseña
  conocidos) con ≥1 perfil de niño; se documenta en el README.
- **Slides y vídeo:** se redacta el **contenido de las slides + guion del vídeo**; el montaje y la
  grabación los hace el alumno.

## Gap analysis (requisito → estado) — revisado 2026-07-08

| #   | Entregable                           | Estado | Acción                                                  |
| --- | ------------------------------------ | ------ | ------------------------------------------------------- |
| 1a  | Descripción general                  | ✅     | Al día en el README                                     |
| 1b  | Stack tecnológico                    | ✅     | Tabla dedicada en el README                             |
| 1c  | Instalación y ejecución              | ✅     | Muy completa (Docker + dev build)                       |
| 1d  | Estructura del proyecto              | ✅     | Árbol presente (ampliar por capas Clean Arch, opcional) |
| 1e  | Funcionalidades principales          | ✅     | Al día en el README                                     |
| 1f  | Usuario/contraseña de prueba         | ❌     | Sembrar (B2) + documentar en el bloque de entrega       |
| —   | URLs (deploy/slides/vídeo) en la doc | ❌     | Bloque "Entrega TFM" al inicio del README (C1)          |
| 2   | Repo público en GitHub               | ✅     | Verificado PUBLIC                                       |
| 3   | Despliegue accesible                 | ✅     | Render `/health` 200 + APK (enlace EAS) vivos           |
| —   | Respaldo permanente del APK          | ❌     | Adjuntar `.apk` a la GitHub Release (EAS puede caducar) |
| —   | Diagrama de arquitectura             | ❌     | Mermaid Clean Arch + despliegue (D1)                    |
| 4   | Slides                               | ❌     | Contenido + guion (E)                                   |
| 5   | Vídeo                                | ❌     | Guion + checklist de demo (F)                           |

---

## Fase A — Verificación en limpio (gate de entrega)

- [ ] A1. Clonar el repo en carpeta nueva → `cp .env.example .env` → `docker compose up` →
      `/health` 200 + flujo alta→perfil→cuento. (DoD de la fase: clonar y arrancar sin pasos ocultos.)
      _Pendiente — verificación manual del usuario en máquina/carpeta limpia._
- [x] A2. ✅ **Render vivo** (2026-07-08): `https://magyblobapp.onrender.com/health` → 200, backend
      v1.13.0. Advertir del _cold start_ (~50 s) del plan free en README/slides/vídeo. _(Falta, si se
      quiere, la comprobación puntual del cuento anónimo con `proveedor:"cloud"`.)_
- [x] A3. ✅ **Repo público** (2026-07-08): `github.com/Mithor86-2/magyblobapp` es PUBLIC.

## Fase B — Acceso del evaluador (APK + credenciales)

- [x] B1. ✅ **APK con EAS Build** (v1.16.0). Enlace EAS en el README **y respaldo permanente** como
      asset de la **GitHub Release v1.16.0**
      (`aprendizajemagico_v_1.16.0.1.apk`, subido el 2026-07-08 con `gh release upload`); el `*.apk`
      sigue ignorado en git (convención: se distribuye por Releases, no en el árbol).
- [x] B2. ✅ **Usuario de prueba en producción (Neon)** sembrado y **verificado el 2026-07-08**: el
      login contra Render (`POST /guardians/login`) devuelve sesión JWT para `usuariotest@mail.com`
      (guardián «Sutanito Test», `emailVerificado: true`) con el perfil «Fulanito» (3 años,
      animales+magia). **US-105**, seed idempotente `seed:test-user`. Credenciales en el README.
- [ ] B3. Smoke **sobre el APK** (no web): instalar → login con las credenciales → generar cuento →
      historial, contra el backend de Render. _Depende de B2; verificación manual del usuario._

## Fase C — README de entrega (los 6 puntos del PDF)

- [🔄] C1. Bloque **"Entrega TFM"** al inicio: **APK (enlace Expo/EAS)** · **backend (Render)** ·
  **slides** · **vídeo** · **credenciales de prueba** (1f). ✅ Credenciales de prueba documentadas
  (subsección «Acceso de prueba (evaluador)» del README, US-105) + APK y backend ya presentes. ⬜
  Falta consolidar un único bloque de entrega con las URLs de **slides** y **vídeo** (dependen de E/F).
- [x] C2. ✅ Sección **Stack tecnológico** (1b): tabla dedicada en el README.
- [x] C3. ✅ Sección **Estructura del proyecto** (1d) **ampliada** (rama `feature/106-...`): árbol por
      capas Clean Arch (backend: domain/application/infrastructure/routes + prisma/test; app:
      domain/infrastructure/presentation/store).
- [x] C4. ✅ Descripción y funcionalidades (1a/1e) al día en el README.

## Fase D — Diagrama de arquitectura

- [x] D1. ✅ **Diagrama Mermaid** (rama `feature/106-...`): sección «Arquitectura» del README con
      Clean Architecture por capas + monorepo (backend/app) + capa IA (mock/local/cloud + fallback) +
      despliegue (Render/Neon/Groq). Además, sección «Estructura del monorepo» **ampliada** con el
      árbol por capas (domain/application/infrastructure/routes en backend; domain/infra/presentation/
      store en app). Complementa el ER de [modelo-datos.md](../modelo-datos.md).

> **Nota:** el **contenido de entrega final** (slides + guion de vídeo) es material del alumno y **no
> se versiona** — vive como **archivos locales** en `Docs/entrega/` (carpeta ignorada en `.gitignore`,
> mismo criterio que `README.local.md`). Aquí solo se lleva su **estado**.

## Fase E — Slides (contenido + guion; el alumno los monta)

- [x] E1. ✅ Guion/estructura (14 slides): problema → solución → demo → arquitectura → decisiones
      (ADRs) → calidad → aprendizajes → cierre. Redactado como archivo **local** (`Docs/entrega/slides.md`,
      no versionado).
- [x] E2. ✅ Texto por slide listo para pegar en Canva/Google Slides (mismo archivo local).
      _(Falta: montaje visual + URL pública de las slides para el bloque de entrega C1.)_

## Fase F — Vídeo (guion; el alumno graba con captura de pantalla)

- [x] F1. ✅ Guion **cronometrado** (~8-10 min) + checklist de preparación y de demo (qué pantallas,
      en qué orden, qué decir). Redactado como archivo **local** (`Docs/entrega/guion-video.md`, no
      versionado). _(Falta: grabar y publicar el vídeo + su URL pública para C1.)_

## Fase G — Cierre y defensa

- [ ] G1. Guion de preguntas/respuestas del tribunal.
- [ ] G2. Checklist final del formulario: nombre, email, repo, deploy, slides, vídeo, credenciales.
- [ ] G3. Cierre con `cerrar-feature` (gate verde + docs + versión diferida) — **previa confirmación
      del usuario**, sin `finish` automático.

## Orden de trabajo para retomar (2026-07-08)

Lo hecho (A2, A3, B1-parcial, C2-C4) queda cerrado. **Camino crítico** de lo que falta, en orden:

1. **B2 — Sembrar usuario de prueba en prod** (bloquea B3 y C1/1f). Guardián genérico con contraseña
   conocida + 1 perfil de niño en Neon. Decidir vía: seed idempotente reutilizable o alta única por API.
2. **C1 — Bloque "Entrega TFM" en el README** con las 5 URLs/datos (APK · Render · slides · vídeo ·
   credenciales). Rellenar slides/vídeo cuando existan; credenciales tras B2.
3. **D1 — Diagrama de arquitectura** (Mermaid) en README/Docs.
4. **B1 (respaldo) — Adjuntar el `.apk` a la GitHub Release** de la versión entregada.
5. **E / F — Slides + guion de vídeo** (contenido; el alumno monta y graba).
6. **A1 / B3 — Verificaciones manuales** (clon en limpio + smoke sobre el APK) — usuario.
7. **G — Cierre y defensa** (Q&A del tribunal, checklist del formulario) y `cerrar-feature` con
   confirmación.

## Riesgos / notas

- _Cold start_ de Render (~50 s tras inactividad): advertir en README, slides y vídeo.
- El enlace de descarga de EAS puede caducar → respaldo permanente en la Release de GitHub.
- El usuario de prueba sembrado en prod es un dato real: usar credenciales genéricas no personales.
