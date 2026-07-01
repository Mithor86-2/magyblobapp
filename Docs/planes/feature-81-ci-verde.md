# Plan — Feature 81: CI en verde (US-71)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo**.

## Contexto

El **CI llevaba rojo semanas** (v1.4.1, v1.5.0, v1.6.0 se publicaron con CI en rojo) porque el gate
local `pnpm check` **no corre `coverage`** (US-35), así que las regresiones de cobertura pasaban
inadvertidas; además había un test de integración roto y un E2E frágil. Esta feature deja el CI verde
y cierra el hueco de proceso para no reincidir.

## Historias cubiertas

- US-71 — CI en verde (calidad/proceso) ([épica F](../historias-usuario/epic-f-plataforma.md#us-71))

## Tareas

- [x] ✅ **Coverage backend a 100% CORE**: tests para `MockProvider` (8.º paso EN + repertorio de
      títulos EN + `temas[]` vacío), `FallbackProvider.generateImage`, `createAIProvider` (hot-swap con
      `settings`, `generateImage` del HotSwap, rama Gemini/`ImageCapableProvider`),
      `GenerateStoryAnonymous` (temas/estilos duplicados y estilo fuera de vocabulario) y `Achievement`
      (ramas de validación). Sin bajar umbrales ni excluir.
- [x] ✅ **Coverage app a 100% CORE (`http.ts`)**: tests de `warmUp` (ping + rama sin `fetch`) y de
      `achievements.get`; se **simplifica** `fetchWithRetry` a bucle acotado + intento final (elimina la
      rama muerta del `!transitorio`, que era inalcanzable porque `fetchOnce` solo lanza `timeout`/
      `network`). Comportamiento idéntico (mismos intentos/backoff; los tests de red/timeout siguen).
- [x] ✅ **Integración `activity.repo` arreglada**: el `save` de `PrismaActivityRepository` no persistía
      `creadoEn` (usaba el `@default(now())`), rompiendo el round-trip del test al añadirse `creadoEn`
      (US-61). Se persiste `creadoEn` (como en `PrismaStoryRepository`) y el fixture `nuevaActividad`
      lo fija. Suite de integración: 30/30 verde.
- [x] ✅ **E2E app estabilizado**: los specs (`onboarding`, `actividades-historial`) asertaban
      `toHaveCount(3)` sobre todos los textbox del alta; la pantalla evolucionó (contraseña US-48,
      validaciones, tema, i18n) y el recuento cambió. Se localizan los campos por **`testID`**
      (`alta-nombre/apellidos/email/password`), robusto ante cambios de nº/orden, y se rellena la
      contraseña. (Verificación real del E2E: en CI, requiere navegadores + Docker.)
- [x] ✅ **Proceso**: `pnpm coverage` añadido al hook **pre-push** (`.husky/pre-push`), para que no se
      pueda volver a publicar con cobertura en rojo.
- [ ] ⬜ CI verde tras push de la rama; luego cierre.

## Verificación

- Local: `pnpm check` ✅, `pnpm coverage` ✅ (backend 369 + app 206, CORE 100%), `pnpm --filter
@magyblob/backend test:integration` ✅ (30/30).
- CI (tras push): jobs **Gate**, **Integración + E2E backend** y **E2E app** en verde.
