# Lote de ajustes UX + robustez cold-start (rama `feature/81-ajustes-ux-render`)

Seis ajustes de cara al usuario, aprobados por el usuario. Se implementan en **una rama de lote**
(secuencial por olas: los ajustes que tocan el componente compartido `Screen` y varias pantallas van
al final para no chocar). Ramas/versionado: **versionado diferido** (no se toca `version` en la rama).

## Decisiones (confirmadas por el usuario)

| Ajuste           | Decisión                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A2 marcar leído  | **Explícito**: se quita el marcado automático al abrir el lector; se marca con **botón** o al **terminar la narración**.                                                                       |
| A5 animaciones   | **`Animated` integrado** de React Native (sin dependencias nativas nuevas).                                                                                                                    |
| A6 botón adultos | En el **header compartido** (componente `Screen`), visible en las 4 pestañas.                                                                                                                  |
| A3 buscador      | **Modal** con campo de texto + **todos** los filtros + botón **Buscar** + botón **Limpiar**; pantalla limpia con botón "Buscar" y contador de filtros activos; **título del cuento completo**. |
| A1 cold-start    | **Render free se suspende por inactividad → primer request 50 s+.** Warm-up largo, timeouts tolerantes y mensaje escalado.                                                                     |

Leyenda de estado: ❌ pendiente · 🔄 en curso · ✅ hecha

---

## Ola 1 — paralelo (ficheros mayormente disjuntos)

### A1 — Robustez cold-start de Render + aviso "tardando" (ajuste 1)

Render free **suspende** la instancia por inactividad; el primer request tras el spin-down puede
tardar **50 s o más** en lo que despierta. Objetivo: que ese despertar no aborte peticiones ni deje al
usuario sin feedback.

- ✅ **Warm-up agresivo** en `infrastructure/http.ts`: `warmUp` hace `ping /health` al abrir la app con
  presupuesto largo (~70 s) y reintentos hasta responder, para despertar la instancia en segundo plano.
- ✅ **Timeouts tolerantes al despertar**: subir el timeout base (30 s → ~60 s) para no abortar durante
  el arranque en frío; la generación se mantiene holgada (90 s). Reintento con backoff ya existente.
- ✅ **Hook `useSlowHint(loading, umbralMs)`** (`presentation/hooks/`): tras ~6 s cargando expone `true`.
- ✅ **Mensaje escalado** bajo el spinner en Generador de cuentos, Actividades y Dashboard: aviso a
  ~6 s y matiz de "el servidor puede tardar hasta ~1 min la primera vez" si persiste. i18n ES/EN.
- ✅ **Tests:** `useSlowHint` (timers fake); `http` warm-up/timeout (ampliar `http.test.ts`).

### A2 — Marcar cuento como leído: explícito (ajuste 2)

- ✅ **Quitar** el marcado automático al abrir el lector ([StoryReaderScreen](../../packages/app/src/presentation/screens/StoryReaderScreen.tsx)).
- ✅ **Botón "Marcar como leído"** en la vista de lectura (se oculta / muestra "Leído ✓" si ya lo está);
  actualiza estado local y llama a `stories.markRead`.
- ✅ **Al terminar la narración** se marca leído: exponer `onFinished` en `useNarration` y propagarlo
  desde `NarrationControls`.
- ✅ i18n ES/EN. **Tests:** botón marca leído; fin de narración marca leído; no se marca solo al abrir.

### A3 — Actividades en logros/historial + buscador del Historial (ajuste 3)

- ✅ **Bug actividades realizadas.** Reproducir por qué no se ven en Historial / no cuentan en logros y
  corregir. Hipótesis: refresco de UI (Home/Historial/Mis logros) tras completar; la persistencia y el
  conteo (`completadaEn`) ya existen. Añadir **test de regresión** (e2e por HTTP: completar → aparece en
  historial y desbloquea `actividades_completadas_1`; y de pantalla).
- ✅ **Historial reorganizado**: botón **"Buscar"** que abre un **modal** con el campo de texto + todos
  los filtros (tema, estilo, enseñanza, categoría, solo favoritos) + botón **Buscar** + botón
  **Limpiar** (resetea texto y filtros). La pantalla queda limpia; el botón "Buscar" muestra un
  **contador de filtros activos**. **Título del cuento completo** (quitar `numberOfLines`).
- ✅ i18n ES/EN. **Tests:** `historyFilters` intactos; pantalla (abrir modal, aplicar, limpiar, título
  completo, actividad realizada visible).

### A4 — Resumen de logros en Home (ajuste 4)

- ✅ En [HomeScreen](../../packages/app/src/presentation/screens/HomeScreen.tsx): cargar logros
  (`api.achievements.get`) al enfocar y mostrar **"X/Y logros"** + **barra de progreso**; al tocar,
  navega a _Mis logros_. Degrada en silencio si falla (Home nunca rompe).
- ✅ Componente `ProgressBar` temático reutilizable. i18n ES/EN. **Tests:** Home muestra resumen/barra.

---

## Ola 2 — secuencial (tocan `Screen` compartido y varias pantallas)

### A6 — Botón fijo a la zona de adultos en el header (ajuste 6)

- ✅ Botón-icono persistente arriba a la derecha en el componente `Screen`, que navega a _Parental_
  (que ya tiene su puerta parental) vía el stack raíz. Visible en las 4 pestañas; oculto donde no
  aplique (onboarding) mediante prop. i18n/accesibilidad. **Tests:** aparece y navega.

### A5 — Animaciones de entrada (ajuste 5)

- ✅ Wrapper `Appear` con `Animated` (fade + leve desplazamiento/escala al montar; respeta reduce-motion
  si es viable). Aplicado a imágenes de cabecera (`Screen`), tarjetas (`ActivityCard`, tarjetas de
  cuento) y botones principales (`BubblyButton` o envoltura puntual). **Tests:** el wrapper renderiza a
  sus hijos (la animación no bloquea el árbol).

---

## Cierre

- ✅ Gate `pnpm check` verde (backend + app) por ola y al final.
- ✅ Docs: [phases.md](../phases.md), [memory.md](../memory.md), [lecciones-aprendidas.md](../lecciones-aprendidas.md), CHANGELOG por paquete (bajo `## [Unreleased]`).
- ✅ **Pasos de prueba en dev** entregados al usuario.
- ✅ Integración a `develop` **tras confirmación** (versionado diferido).
