# Plan — Fase de mejoras: Funcionalidad y personalización

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md) (Fase de mejoras). Aquí va el **cómo**.

## Contexto

Tercer bloque de la Fase de mejoras (tras UX/navegación y Autor). **US-22 (narración por voz) queda
fuera**, diferida. Tres mejoras independientes; backend + app.

Qué existe ya (✅):

- ✅ `prompts.ts` (plantillas bilingües) + `buildStoryPrompt`/`buildActivitiesPrompt`; el perfil ya
  llega al prompt (nombre, edad, idioma, intereses) pero no se explota a fondo.
- ✅ Historial (`HistoryScreen`) que lista cuentos y permite "marcar leído"; ruta
  `POST /stories/:id/read` y gateway `stories.markRead`.
- ✅ `ActivityCard` con valoración por estrellas (`StarRating`) que llama a `complete`.
- ✅ Pantalla de detalle de cuento: **no existe** (el generador muestra el cuento recién creado).

Qué falta (❌): afinar prompts por edad/intereses; vista de lectura de cuento desde el Historial
(marcar leído al abrir); botón "Realizado" explícito en actividades.

### Decisiones

- **Personalización = solo prompts** (no cambia el contrato HTTP ni el modelo de datos). Se afina el
  texto del prompt por **tramo de edad** y se referencian **intereses**. Verificar en `mock` y
  `local` sin romper la salida estructurada.
- **Releer = pantalla nueva en el stack** (`StoryReader`), navegada desde la pestaña Historial vía
  el stack raíz (`getParent`), con cabecera "atrás" (US-24) y `AuthorBadge` (US-25). Marca leído al
  montar reutilizando `stories.markRead`.
- **Botón "Realizado"** en `ActivityCard`: abre la valoración (1-3) y al elegir llama a `complete`
  (no duplica lógica; es otra entrada al mismo flujo de US-10).

## Historias cubiertas

- **US-26** — Contenido más personalizado por niño ([épica B](../historias-usuario/epic-b-cuentos.md#us-26)).
- **US-27** — Releer un cuento desde el Historial ([épica D](../historias-usuario/epic-d-historial.md#us-27)).
- **US-10** (ampliada) — botón "Realizado" en actividades ([épica C](../historias-usuario/epic-c-actividades.md#us-10)).

## Tareas

### F1 — Personalización por niño (backend, US-26) ✅

- [x] ✅ `prompts.ts`: el cuento y las actividades usan los **intereses** del perfil y un ajuste de
      **tono por tramo de edad** (`tonoPorEdad`: 2-3 / 4 / 5-6); `intereses`/`tono` también
      disponibles para las plantillas de `AppSetting`. Actividades: intereses solo cuando la
      categoría es libre.
- [x] ✅ `MockProvider` intacto (determinista) y salida estructurada sin cambios; contrato HTTP
      igual.
- [x] ✅ Test `prompts.test.ts` (nombre/edad/intereses presentes; tono varía por edad; categoría
      fija no lista afinidad). Gate backend verde (104 tests).

### F2 — Releer cuento desde el Historial (app, US-27)

- [ ] ❌ Pantalla `StoryReaderScreen` (título + cuerpo + `AuthorBadge`) en el stack raíz; ruta
      `StoryReader` en `navigation.ts` con `params: { story }`.
- [ ] ❌ En `HistoryScreen`, tocar un cuento navega al lector (vía `getParent`); marcar `leído` al
      abrir (`stories.markRead`) y refrescar al volver (ya usa `useFocusEffect`).
- [ ] ❌ Verificar bundle (`expo export`).

### F3 — Botón "Realizado" en actividades (app, US-10 ampliada)

- [ ] ❌ En `ActivityCard`, añadir botón "Realizado" que muestre la valoración (1-3) y al elegir
      llame a `onComplete`; conservar el atajo de tocar las estrellas.
- [ ] ❌ Verificar bundle.

### Cierre

- [ ] ❌ Gate `pnpm check` verde + e2e (cuento personalizado en `local`; releer marca leído; botón
      Realizado completa) + bundle.
- [ ] ❌ Docs (phases.md, memory.md) + CHANGELOG; cierre con **cerrar-feature** (versión, merge tras
      confirmación y pruebas con el usuario).

## DoD

Cuentos/actividades notablemente personalizados por perfil; releer desde Historial (marca leído) y
botón "Realizado" operativos; `pnpm check` verde + bundle + pruebas con el usuario.
