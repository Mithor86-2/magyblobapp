# FASE 7 — Entrega y defensa del TFM

> **Estado:** borrador para refinar. Este documento desarrolla el **cómo** se prepara la entrega
> final del TFM (los 5 entregables del formulario). El alcance global vive en
> [plan-ejecucion-master.md](../plan-ejecucion-master.md) y el estado por fase en
> [phases.md](../phases.md) (FASE 7 — Documentación y defensa).

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecho

## Contexto

El producto está cerrado a nivel de código (HITO 1 y 2 cerrados, ~50 features, v1.4.0, gate verde,
CI + E2E). Lo que falta **no es más código, es empaquetar la entrega**. Este plan cubre los cinco
entregables exigidos por el TFM y cierra la FASE 7.

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

## Gap analysis (requisito → estado)

| #   | Entregable                           | Estado | Acción                                       |
| --- | ------------------------------------ | ------ | -------------------------------------------- |
| 1a  | Descripción general                  | ✅     | Repaso ligero                                |
| 1b  | Stack tecnológico                    | ⚠️     | Sección dedicada nueva                       |
| 1c  | Instalación y ejecución              | ✅     | Ya muy completa                              |
| 1d  | Estructura del proyecto              | ⚠️     | Ampliar (árbol por capas)                    |
| 1e  | Funcionalidades principales          | ✅     | Repaso                                       |
| 1f  | Usuario/contraseña de prueba         | ❌     | Sembrar + documentar                         |
| —   | URLs (deploy/slides/vídeo) en la doc | ❌     | Bloque "Entrega TFM" al inicio del README    |
| 2   | Repo público en GitHub               | ⚠️     | Verificar visibilidad pública                |
| 3   | Despliegue accesible                 | ⚠️     | APK (enlace Expo/EAS) + backend Render vivos |
| 4   | Slides                               | ❌     | Contenido + guion                            |
| 5   | Vídeo                                | ❌     | Guion + checklist de demo                    |

---

## Fase A — Verificación en limpio (gate de entrega)

- [ ] A1. Clonar el repo en carpeta nueva → `cp .env.example .env` → `docker compose up` →
      `/health` 200 + flujo alta→perfil→cuento. (DoD de la fase: clonar y arrancar sin pasos ocultos.)
- [ ] A2. Verificar Render vivo: `https://magyblobapp.onrender.com/health` + cuento anónimo con
      `proveedor:"cloud"`. Advertir del _cold start_ (~50 s) del plan free.
- [ ] A3. Confirmar que el repo de GitHub es **público** (si no, hacerlo público). No hace falta dar
      acceso a mouredev@gmail.com salvo que fuera privado.

## Fase B — Acceso del evaluador (APK + credenciales)

- [ ] B1. Generar/confirmar el **APK con EAS Build** y obtener el **enlace de descarga de Expo**
      (página de build de EAS). Mantener también el APK en la **Release de GitHub** como respaldo
      permanente (el enlace de EAS puede caducar).
- [ ] B2. **Sembrar usuario de prueba en producción** (Neon): guardián con email+contraseña
      conocidos + ≥1 perfil de niño, vía seed idempotente o alta única. Credenciales genéricas, no
      personales.
- [ ] B3. Smoke **sobre el APK** (no web): instalar → login con las credenciales → generar cuento →
      historial, contra el backend de Render.

## Fase C — README de entrega (los 6 puntos del PDF)

- [ ] C1. Bloque **"Entrega TFM"** al inicio: **APK (enlace Expo/EAS)** · **backend (Render)** ·
      **slides** · **vídeo** · **credenciales de prueba** (1f).
- [ ] C2. Sección dedicada **Stack tecnológico** (1b).
- [ ] C3. Sección **Estructura del proyecto** ampliada (1d): árbol con capas Clean Arch.
- [ ] C4. Repaso de descripción y funcionalidades (1a/1e).

## Fase D — Diagrama de arquitectura

- [ ] D1. Diagrama Mermaid: Clean Architecture por capas + monorepo (backend/app) + capa IA
      (mock/local/cloud + fallback) + despliegue (Render/Neon/Groq). En README y/o `Docs/`.

## Fase E — Slides (contenido + guion; el alumno los monta)

- [ ] E1. Guion/estructura: problema → solución → demo → arquitectura → decisiones (ADRs) →
      calidad (tests/CI/cumplimiento de menores) → aprendizajes → cierre.
- [ ] E2. Texto por slide listo para pegar en Canva/Google Slides.

## Fase F — Vídeo (guion; el alumno graba con captura de pantalla)

- [ ] F1. Guion cronometrado + checklist de demo (qué pantallas mostrar, en qué orden, qué decir).

## Fase G — Cierre y defensa

- [ ] G1. Guion de preguntas/respuestas del tribunal.
- [ ] G2. Checklist final del formulario: nombre, email, repo, deploy, slides, vídeo, credenciales.
- [ ] G3. Cierre con `cerrar-feature` (gate verde + docs + versión diferida) — **previa confirmación
      del usuario**, sin `finish` automático.

## Riesgos / notas

- _Cold start_ de Render (~50 s tras inactividad): advertir en README, slides y vídeo.
- El enlace de descarga de EAS puede caducar → respaldo permanente en la Release de GitHub.
- El usuario de prueba sembrado en prod es un dato real: usar credenciales genéricas no personales.
