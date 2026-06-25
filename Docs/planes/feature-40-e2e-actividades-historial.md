# Plan — Feature 40: E2E web de actividades e historial (Playwright)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> **Alcance de la rama (enforced):** solo pruebas E2E de la app (`packages/app/e2e`) y la
> documentación asociada (historia, trazabilidad, changelog). No se toca el backend ni el código de
> runtime de la app. La validación E2E real (con Docker) la ejecuta el usuario.

## Contexto

El E2E de la app con Playwright (US-32, [`packages/app/e2e/onboarding.spec.ts`](../../packages/app/e2e/onboarding.spec.ts))
recorre el onboarding completo (bienvenida → puerta parental → alta del adulto → crear perfil →
generar cuento) sobre **Expo web** contra el **backend real en modo `mock`**, localizando por
rol/etiqueta accesible. Pero los dos flujos clave de la zona infantil que faltan por cubrir
end-to-end son:

- **Actividades** (US-09/US-10): generar actividades recomendadas y marcar una como completada.
- **Historial** (US-08): ver el cuento generado en la sección "Cuentos mágicos".

Hoy esos flujos solo tienen pruebas **unitarias/de componente** (US-30). Esta feature **extiende** la
cobertura E2E web a ambos, **reutilizando** el patrón de onboarding del spec existente para llegar al
estado con perfil + cuento. El contenido es **determinista** (modo `mock`,
[`MockProvider`](../../packages/backend/src/infrastructure/ai/MockProvider.ts)): el cuento se titula
`«{nombre} y la aventura de {tema}»` y las actividades `«Actividad de {categoria} nº {n}»`.

Respeta [cumplimiento-menores.md](../cumplimiento-menores.md) (sin red ni IA externa ni SDKs de
terceros en runtime), valida el **export web** (no la app nativa) y no rompe el spec de onboarding ni
el arranque reproducible ([US-06](../historias-usuario/epic-f-plataforma.md#us-06)).

## Historias cubiertas

- US-39 — E2E de actividades e historial (Playwright) ([épica F](../historias-usuario/epic-f-plataforma.md#us-39))
  — extiende el E2E web de [US-32](../historias-usuario/epic-f-plataforma.md#us-32) y cubre
  [US-08](../historias-usuario/epic-d-historial.md#us-08),
  [US-09](../historias-usuario/epic-c-actividades.md#us-09) y
  [US-10](../historias-usuario/epic-c-actividades.md#us-10).

## Tareas

### Fase A — Andamiaje (abrir-feature)

- [x] ✅ US-39 en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md#us-39) (formato
      US-32: Como/quiero/para, Contexto, criterios Gherkin) + añadida a la línea "Historias" del epic.
- [x] ✅ Trazabilidad: fila US-39 y celda de la épica F en
      [historias-usuario/README.md](../historias-usuario/README.md).
- [x] ✅ Este plan en `Docs/planes/`.
- [x] ✅ `packages/app/CHANGELOG.md`: `## [Unreleased]` con los 6 grupos + entrada en `Added`
      anticipando la cobertura E2E de actividades e historial (US-39).

### Fase B — Implementación del spec

- [x] ✅ `packages/app/e2e/actividades-historial.spec.ts`: reutiliza el patrón de onboarding (helper
      local `completarOnboarding`) para llegar a perfil + cuento generado, sin tocar `onboarding.spec.ts`.
- [x] ✅ Recorrido **Actividades**: navegar a la pestaña "Actividades", pulsar "Generar actividades",
      `expect` de que aparecen tarjetas de actividad del mock; pulsar "Realizado" + valoración y
      verificar el estado "¡Hecha!".
- [x] ✅ Recorrido **Historial**: navegar a la pestaña "Historial", `expect` de que el cuento generado
      aparece en "Cuentos mágicos" (por su título determinista con el nombre del niño).
- [x] ✅ Localizadores por rol/etiqueta accesible; comentarios en español.

### Fase C — Verificación y cierre parcial

- [x] ✅ Gate sin Docker desde la raíz del worktree: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`.
- [x] ✅ Commits con staging selectivo (Conventional Commits en español).
- [ ] ❌ Ejecutar `pnpm --filter @magyblob/app test:e2e` con Docker (validación del usuario).
- [ ] ❌ Cierre de feature (versión SemVer + CHANGELOG fechado + docs + `git flow feature finish`):
      pendiente, requiere confirmación explícita del usuario.
