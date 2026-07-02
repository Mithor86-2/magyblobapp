# Plan — US-72: actividades realizadas en el Historial + UX de "Realizado"

Rama: `feature/72-actividades-historial` (desde `develop`). Alcance acotado por el usuario a **este
bug**; los otros ajustes de `ideas.txt` quedan fuera.

## Contexto

El usuario reporta que una actividad marcada como **"Realizado"** (con estrellas) no aparece en el
**Historial**. Al trazar el camino completo, **estáticamente era correcto de punta a punta** y así lo
confirmó un E2E que reproduce el flujo exacto (mock): la actividad **sí** aparece. El hueco real era
**doble**:

1. **Sin cobertura** del escenario "marcar realizada → verla en el Historial".
2. **Trampa de UX de dos pasos:** pulsar "Realizado" solo revelaba las estrellas; la actividad solo se
   guardaba al **tocar una estrella**. Si el toque de estrella no registraba (o el usuario no puntuaba),
   nunca se completaba → no aparecía. Además el "hecha" se decidía por `valoracion`, cuando el backend
   ya contaba las completadas por **`completadaEn`** (incoherencia).

Decisión (confirmada por el usuario): **"Realizado" completa al instante, con valoración opcional**, y
el estado "hecha" se rige por `completadaEn`. Es a la vez el arreglo de UX y la solución robusta al
síntoma (no depende del segundo paso).

## Fases y tareas

### Fase 1 — Reproducir ✅

- ✅ Test E2E en `packages/app/e2e/actividades-historial.spec.ts`: onboarding → Actividades → generar →
  Realizado → estrellas → Historial → la actividad aparece con "¡Hecha!". Acotado por
  `testID="history-activities"` (el tab navigator mantiene montada también la pestaña Actividades).
- ✅ Ejecutado: **pasa** → el bug no reproduce en el flujo estándar (mock).

### Fase 2 — Valoración opcional (backend) ✅

- ✅ `Activity.completar(valoracion?: number, cuando)`: valida 1-3 solo si viene; `completadaEn` siempre.
- ✅ `CompleteActivityRequest.valoracion?` (DTO) y `completeSchema` Zod con `.optional()`.
- ✅ Sin migración (`valoracion`/`completadaEn` ya nullable).

### Fase 3 — UX de "Realizado" (app) ✅

- ✅ `ActivityCard`: `completada = completadaEn != null`; "Realizado" llama `onComplete()` al instante;
  una vez hecha, estrellas **editables** (puntuar/cambiar) o de solo lectura en el Historial.
- ✅ `gateways.ts`/`http.ts`: `complete(activityId, valoracion?)`.
- ✅ `HistoryScreen`: `hechas = activities.filter(a => a.completadaEn != null)` (coherente con logros).
- ✅ `ActivitiesScreen.onComplete(activityId, valoracion?)`.

### Fase 4 — Tests ✅

- ✅ Backend: entidad (`completar` sin valoración), caso de uso (`complete` sin valoración),
  integración (`GET /history` devuelve la actividad completada con su `valoracion`).
- ✅ App: `ActivityCard` (Realizado al instante; hecha-sin-puntuar invita a valorar; hecha+valorada),
  `HistoryScreen` (fixtures con `completadaEn`).
- ✅ E2E (3/3) en chromium tras re-export.

### Fase 5 — Gate y cierre 🔄

- ✅ `pnpm check` verde (backend 373 + app 223) y `pnpm coverage` verde.
- ✅ Docs: CHANGELOG (backend Changed / app Changed+Fixed), este plan, lecciones-aprendidas.
- ⬜ Pruebas manuales del usuario (abajo) → confirmación → `git flow feature finish`.

## Pruebas en dev (manual)

Pila `docker compose up` (`AI_PROVIDER=mock`) + app Expo:

1. Perfil activo → pestaña **Actividades** → "Generar actividades".
2. En una tarjeta pulsa **"Realizado"**: queda hecha al instante ("¿Qué tal estuvo?" + estrellas
   editables). Opcional: toca una estrella para puntuar → "¡Hecha!".
3. Pestaña **Historial** → sección **Actividades hechas**: la actividad aparece con "¡Hecha!"
   (y sus estrellas si la puntuaste).
4. Cambia de pestaña y vuelve: sigue apareciendo.

Automatizado: `pnpm --filter @magyblob/app test:e2e` y `pnpm --filter @magyblob/backend test`.

## Nota

El usuario indicó que en su caso puntuó y aun así no aparecía → probable entorno/desktop concreto o el
toque de estrella no registrando. El nuevo flujo (completar al pulsar "Realizado") lo resuelve con
independencia de esa causa. Si persistiera en su entorno, recabar: backend (local vs Render), modo de
IA y si regeneró actividades.
