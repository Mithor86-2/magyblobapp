# Plan — US-98: incoherencia de datos de sesión → modal de error + cerrar sesión

Rama `feature/98-incoherencia-datos-logout` desde `develop`. **Solo app** (sin cambios de backend).
Historia en [historias-usuario/epic-f-plataforma.md#us-98](../historias-usuario/epic-f-plataforma.md#us-98).

**Problema:** cuando el `guardianId` o el `profileId` de la sesión ya no existen en la BD (BD
reseteada, perfil borrado), las pantallas muestran el error crudo "No existe el perfil con id …" y la
sesión queda inconsistente. El backend responde `404` con `tipo: 'NotFoundError'`.

**Comportamiento nuevo:** ante ese caso, mostrar una **modal "Error de datos"** y **cerrar sesión**,
para que al volver a iniciar sesión esos datos se revaliden.

Leyenda: ✅ hecho · 🔄 en curso · ⬜ pendiente

## Fase única — Detección + aviso + cierre de sesión

- [x] **T1** `http.ts`: `RequestOptions.sessionBound?: boolean` y `SessionStore.onDataInconsistency()`.
      En el manejo de `!response.ok`, si `sessionBound && status===404 && tipo==='NotFoundError'` →
      `session?.onDataInconsistency()` (además de propagar el `ApiError`).
- [x] **T2** Marcar `sessionBound: true` en las rutas ligadas a la sesión: `profiles.list`,
      `stories.generate`, `activities.recommend`, `history.get`, `achievements.get`. Los 404 de
      contenido puntual (marcar leído, favorito, continuar, completar) **no** cierran sesión.
- [x] **T3** Store: flag transitorio `sessionDataError` + `reportDataInconsistency()` (cierra sesión y
      lo activa) + `clearDataError()`. No se persiste (fuera de `partialize`).
- [x] **T4** `composition.ts`: cablear `onDataInconsistency` → `reportDataInconsistency()`.
- [x] **T5** `App.tsx`: componente `DataErrorHandler` bajo `DialogProvider` que observa
      `sessionDataError`; al activarse resetea la navegación a `Dashboard`, muestra
      `dialog.alert('Error de datos', …)` y baja el flag.
- [x] **T6** i18n: `common.dataErrorTitle` / `common.dataErrorMessage` (ES/EN).
- [x] **T7** Tests: `http.test.ts` (404 NotFoundError sessionBound → avisa; otro tipo o ruta no
      sessionBound → no avisa); `useAppStore.test.ts` (`reportDataInconsistency`/`clearDataError`).

**DoD:** ✅ `pnpm check` verde (**backend 460 + app 306**). Pendiente: pruebas manuales del usuario.
