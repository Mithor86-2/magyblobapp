# Plan — Autor (proveedor de IA) en cuentos y actividades

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md) (Fase de mejoras). Aquí va el **cómo**.

## Contexto

Diferido del bloque "UX y navegación" de la Fase de mejoras. El proveedor de IA activo puede ser
`mock`, `local` (Ollama) o `cloud`, y ante un fallo el `FallbackProvider` cae a `mock`. Hoy **no se
registra cuál sirvió de verdad**. Esta feature propaga el **proveedor efectivo** desde la capa de
IA, lo **persiste** en `Story`/`Activity` y lo muestra como "Autor" en la app.

Qué existe ya (✅):

- ✅ `AIProvider` (dominio) con `generateStory`/`recommendActivities`; implementaciones `MockProvider`,
  `OllamaProvider`, `CloudProvider`; envoltorios `FallbackProvider` y `HotSwapAIProvider`.
- ✅ Entidades `Story` y `Activity` (dominio) + repos Prisma + rutas + `*Output` (DTOs).
- ✅ App: `StoryGeneratorScreen`, `ActivitiesScreen`/`ActivityCard`, `HistoryScreen`; tipos espejo.

Qué falta (❌): que el provider reporte el proveedor efectivo, columna `proveedor` en BD, el campo en
los DTOs/tipos y la UI "Autor".

### Decisiones (con el usuario)

- **Persistir el proveedor en BD** (no solo en la respuesta del momento): así el **Historial**
  también muestra el Autor. Implica **migración Prisma** (`Story.proveedor`, `Activity.proveedor`) y
  actualizar [../modelo-datos.md](../modelo-datos.md).
- **Proveedor efectivo, no el configurado.** Lo reporta quien genera de verdad: el `FallbackProvider`
  devuelve `mock` cuando cae. Para no romper la interfaz, los métodos del `AIProvider` pasan a
  devolver también el `proveedor` usado.
- **Vocabulario cerrado** `proveedor = mock | local | cloud` (en `vocabulary.ts`), validado en la
  entidad como el resto.

## Historias cubiertas

- **US-25** — Ver el proveedor de IA que generó el contenido (Autor)
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-25)).

## Tareas

### F1 — Backend: propagar y persistir el proveedor

- [ ] ❌ Vocabulario `PROVEEDORES_IA` (`mock|local|cloud`) + guard en `vocabulary.ts`.
- [ ] ❌ `AIProvider`: los métodos devuelven el `proveedor` efectivo (p. ej.
      `{ ...resultado, proveedor }`). Implementar en Mock/Ollama/Cloud; `FallbackProvider` y
      `HotSwap` devuelven el proveedor **realmente** usado (mock al caer).
- [ ] ❌ Entidades `Story` y `Activity`: nuevo campo `proveedor` (validado por vocabulario).
- [ ] ❌ Casos de uso `GenerateStory` y `RecommendActivities`: fijan `proveedor` desde el resultado
      del provider.
- [ ] ❌ Prisma: columna `proveedor` en `stories` y `activities` + **migración**; mappers de los
      repos. Actualizar [../modelo-datos.md](../modelo-datos.md) (diagrama + parte conceptual).
- [ ] ❌ DTOs `StoryOutput`/`ActivityOutput`: añadir `proveedor`; rutas lo devuelven (incl. history).
- [ ] ❌ Tests: casos de uso (proveedor persistido; fallback ⇒ `mock`), dominio (vocabulario), e
      integración de rutas (el cuerpo trae `proveedor`).

### F2 — App: mostrar el Autor

- [ ] ❌ Tipos espejo (`domain/types.ts`): `proveedor` en `Story` y `Activity` + vocabulario.
- [ ] ❌ Componente/badge "Autor:" con icono por proveedor (mock | local | cloud) + label.
- [ ] ❌ Integrar en `StoryGeneratorScreen` (fin del cuento), `ActivityCard` e `HistoryScreen`.
- [ ] ❌ Test del contrato de cable (el gateway mapea `proveedor`).

### Cierre

- [ ] ❌ Gate `pnpm check` verde + e2e contra PostgreSQL (proveedor persistido y servido) + bundle.
- [ ] ❌ Docs (api.md, modelo-datos.md, phases.md, memory.md) + CHANGELOG; cierre con
      **cerrar-feature** (versión, merge tras confirmación y pruebas).

## DoD

Cada cuento/actividad persiste y muestra el proveedor **efectivo** (incl. fallback ⇒ mock) en
generador, actividades e Historial; el contrato HTTP incluye `proveedor`. `pnpm check` verde +
migración aplicada + bundle + pruebas con el usuario.
