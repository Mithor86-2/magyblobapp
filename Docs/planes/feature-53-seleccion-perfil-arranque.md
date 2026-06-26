# Plan — Feature 53: Selección de perfil al arrancar (US-49)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md); coordinación del lote de mejoras en paralelo en
> [coordinacion-mejoras-paralelo.md](coordinacion-mejoras-paralelo.md) (feature **F-D**). Aquí va el
> **cómo** se trocea y ejecuta.
>
> Rama: `feature/53-seleccion-perfil-arranque` (desde `develop`). Historia: **US-49** (épica A,
> perfil), que **amplía US-02**. Capa: **solo app** (Expo). Sin dependencias de otras features del
> lote (Ola 1).

## Contexto

Qué existe ya (✅):

- ✅ **Pantalla de selección de perfil**: [`SelectProfileScreen`](../../packages/app/src/presentation/screens/SelectProfileScreen.tsx)
  (US-02) lista los hijos del guardián vía `api.profiles.list(guardianId)` y, al elegir uno, lo fija
  como `currentProfile` (`setProfile`) y navega a `Main`. Si no hay hijos, invita a crear el primero.
- ✅ **Sesión en el store**: [`useAppStore`](../../packages/app/src/presentation/store/useAppStore.ts)
  persiste `guardian`, `consentVersion`, `currentProfile` y los tokens JWT (`accessToken`/
  `refreshToken`), con migración de persistencia en **v2** (US-45).
- ✅ **Lógica de arranque** en [`App.tsx`](../../packages/app/App.tsx) (~L149): tras hidratar el
  store, `initialRoute = guardian ? (currentProfile ? 'Main' : 'SelectProfile') : 'Welcome'`.
- ✅ **Gateway de perfiles**: `ProfileGateway.list(guardianId)` en
  [`domain/gateways.ts`](../../packages/app/src/domain/gateways.ts).

Qué falta (❌) — el comportamiento que pide US-49:

- ❌ Al arrancar con sesión y **sin perfil activo**, la app siempre va a `SelectProfile`, **aunque
  el guardián tenga un solo perfil** (reseleccionar de más). Con exactamente 1 perfil debería
  **auto-seleccionarlo** y entrar a `Main`.
- ❌ El **store no conoce** cuántos perfiles tiene el guardián (`SelectProfileScreen` los carga en
  `useState` local), así que la lógica de arranque no puede decidir según el número.

### Decisiones de alcance (F-D del lote)

- **Reusar la pantalla existente**: US-49 **no crea** pantalla; solo añade la lógica de arranque y el
  estado mínimo en el store. Reaprovecha `SelectProfileScreen`.
- **`profiles` en el store** (`ChildProfile[]` + `setProfiles`): es la pieza de estado que permite
  contar perfiles en el arranque. `SelectProfileScreen` pasa a alimentar ese estado al cargar la
  lista (en vez de un `useState` local), manteniendo una sola fuente de verdad.
- **Persistencia**: `profiles` se incluye en `partialize` para persistirse con el resto de la sesión.
  Como el shape persistido cambia, se **sube la versión de persistencia** del store y su `migrate`
  descarta el estado previo (coherente con el patrón ya usado en v1/v2).
- **Sin red nueva ni terceros** (C-2/C-5 intactos): solo se reordena el flujo de pantallas y se
  reutiliza el gateway `profiles.list` existente. No toca el modelo de datos ni el backend.

## Historias cubiertas

- **US-49 — Selección de perfil al arrancar** ([épica A](../historias-usuario/epic-a-perfil.md#us-49)),
  que **amplía US-02**.

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha. Cada fase incluye **crear test → ejecutar test
(`pnpm check` verde) → actualizar docs** según la regla del DoD.

### Fase 0 — Andamiaje (docs, US, plan, CHANGELOG) 🔄

- [x] ✅ Rama `feature/53-seleccion-perfil-arranque` creada desde `develop` (worktree).
- [x] ✅ **US-49** en [epic-a-perfil.md](../historias-usuario/epic-a-perfil.md#us-49) con criterios
      Gherkin; fila en la trazabilidad y en la cabecera del [índice](../historias-usuario/README.md)
      (Prioridad Should, Fase «Mejoras», Pantalla «Selección de perfil», Épica A). Indica que amplía
      US-02.
- [x] ✅ Este plan en `Docs/planes/feature-53-seleccion-perfil-arranque.md`.
- [x] ✅ `## [Unreleased]` con los 6 grupos en [CHANGELOG del app](../../packages/app/CHANGELOG.md).
- [ ] ❌ Commit de andamiaje (`docs(planes): plan y US-49 de la feature 53 …`).

### Fase 1 — Estado `profiles` en el store ❌

- [ ] ❌ `useAppStore`: añadir `profiles: ChildProfile[]` (inicial `[]`) y la acción
      `setProfiles(profiles: ChildProfile[])`. Incluir `profiles` en `partialize` y resetearlo en
      `logout` (parte de `SESION_VACIA`).
- [ ] ❌ **Persistencia**: subir la `version` del store (v2 → v3) y mantener el `migrate` que
      descarta el estado previo, ya que el shape persistido cambia (coherente con v1/v2 de US-45).
- [ ] ❌ `SelectProfileScreen`: alimentar `setProfiles` con la lista cargada (fuente única de
      verdad) en lugar del `useState` local; el resto del comportamiento de la pantalla no cambia.
- [ ] ❌ **Test:** `useAppStore.test.ts` — `setProfiles` guarda la lista; `logout` la limpia;
      `partialize` incluye `profiles`; la migración descarta estado de versión previa.
- [ ] ❌ **Ejecutar test** (`pnpm check` verde).
- [ ] ❌ **Docs:** entrada en `## [Unreleased]` del CHANGELOG del app (`Added`/`Changed`).

### Fase 2 — Lógica de arranque en `App.tsx` ❌

- [ ] ❌ `App.tsx` (~L149): suscribirse a `profiles` y `setProfile` del store. Calcular la ruta
      inicial con la regla de US-49:
  - sin `guardian` → `Welcome`;
  - con `guardian` y `currentProfile` → `Main` (sin cambios);
  - con `guardian`, sin `currentProfile` y `profiles.length === 1` → **auto-seleccionar** ese perfil
    (`setProfile(profiles[0])`) y `Main`;
  - con `guardian`, sin `currentProfile` y `profiles.length !== 1` (0 o >1) → `SelectProfile` (la
    pantalla invita a crear el primero si está vacía).
- [ ] ❌ Extraer la decisión a una función pura testeable (p. ej. `resolveInitialRoute({ guardian,
      currentProfile, profiles })`) para poder probar la lógica sin montar el árbol de navegación;
      el efecto de auto-selección (`setProfile`) se dispara en un `useEffect` cuando proceda.
- [ ] ❌ **Test:** test de la lógica de arranque (función pura): cubre los cuatro caminos
      (sin sesión, perfil activo, 1 perfil → auto-selección + `Main`, >1 perfil → `SelectProfile`,
      0 perfiles → `SelectProfile`).
- [ ] ❌ **Ejecutar test** (`pnpm check` verde).
- [ ] ❌ **Docs:** entrada en `## [Unreleased]` del CHANGELOG del app (`Changed`).

### Fase 3 — Documentación y cierre ❌

- [ ] ❌ Revisar que US-49 y la trazabilidad reflejan el estado final.
- [ ] ❌ [phases.md](../phases.md): reflejar la feature en el lote de mejoras si procede.
- [ ] ❌ Cierre con la skill **`cerrar-feature`** (delega versionado en `versionar`): gate verde,
      versión SemVer al integrar, mover `CHANGELOG`, **pruebas con el usuario**, y `finish` **tras
      confirmación explícita**.

## Notas técnicas

- **Una sola fuente de verdad para `profiles`.** Hoy `SelectProfileScreen` mantiene la lista en
  `useState`. Al moverla al store, la pantalla la consume del store y la refresca al entrar; así el
  arranque puede contar perfiles sin duplicar la carga.
- **Función pura para el arranque.** Aislar `resolveInitialRoute` (y separar el side-effect de
  auto-selección) evita acoplar el test al `NavigationContainer` y mantiene el invariante de capas
  (la decisión es lógica de presentación, sin IO).
- **Versión de persistencia.** Cambiar `partialize` cambia el shape persistido; subir la `version`
  y descartar el estado previo en `migrate` evita rehidratar un estado incompatible (misma receta
  que v1/v2).

## Verificación (DoD)

- `pnpm check` verde (typecheck + lint + format + tests) tras cada fase.
- Tests nuevos: store (`setProfiles`, `logout`, `partialize`, migración) y lógica de arranque
  (los cuatro caminos de `resolveInitialRoute`, incluida la auto-selección con 1 perfil).
- US-49 creada + trazabilidad en `historias-usuario/README.md` actualizada.
- `cumplimiento-menores.md` **no** requiere cambios (no hay red nueva, terceros ni dato de menor
  adicional; solo reordenación del flujo de pantallas).
- Pruebas con el usuario antes del cierre; `finish` solo tras confirmación explícita.
