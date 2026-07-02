# Coordinación — Lote de ajustes de `ideas.txt` (US-75…US-82)

Lote de **8 ajustes** de producto recogidos en `ideas.txt` (numerados 1, 3–9). Siguiendo el
precedente de lotes previos (US-71, seis ajustes en una rama), se ejecutan en **una rama**
`feature/85-ajustes-ideas` desde `develop`, con **commits por US** y un único gate verde. El diseño
por olas del plan aprobado se conserva como descomposición de tareas.

Estado: ✅ hecho · 🔄 en curso · ✅ pendiente

## Mapa idea → US

| # idea | Comportamiento                                 | US    | Épica | Capa        | Estado |
| ------ | ---------------------------------------------- | ----- | ----- | ----------- | ------ |
| 3      | Páginas del cuento con **≥3 frases**           | US-75 | B     | backend     | ✅     |
| 4      | Opción de **usar/no el nombre del niño**       | US-76 | B     | backend+app | ✅     |
| 6      | Actividades: trato por **parentesco + nombre** | US-77 | C     | backend     | ✅     |
| 7      | **Continuar la historia** (capítulo nuevo)     | US-78 | B     | backend+app | ✅     |
| 1      | Lector: layout fijo + **page-curl reanimated** | US-79 | F     | app         | ✅     |
| 5      | **Nombre de sección** en la cabecera           | US-80 | F     | app         | ✅     |
| 8      | Actividades: **pasos plegables**               | US-81 | C     | app         | ✅     |
| 9      | **Búsqueda global** (cuentos + actividades)    | US-82 | D     | app         | ✅     |

## Tareas por feature

### A · Backend de contenido (US-75/76/77 + US-78 backend) ✅

- ✅ US-75: `INSTRUCCION_SEGURIDAD` (ES/EN) → "cada página con **al menos 3 frases**"; `MockProvider`
  cuerpo con ≥3 frases/página; alinear seed `prompt.story.system`.
- ✅ US-76: `usarNombre?: boolean` (default `true`) en `GenerateStoryInput` + DTO + Zod `/stories`;
  `buildStoryPrompt` usa protagonista genérico si `false`; mock coherente.
- ✅ US-77: `terminoCuidador` compone "parentesco + nombre"; `RecommendActivities` pasa
  `guardian.nombre`; `buildActivitiesPrompt` y mock usan el trato con nombre.
- ✅ US-78: `Story.continuacionDe?` (+ migración, mapper, repo); caso de uso `ContinueStory`; función
  de prompt de continuación + `AIProvider` input `contexto?`; ruta `POST /stories/:id/continue`; mock.
- ✅ Tests: casos de uso + integración de la ruta; ajustar tests que dependían del cuerpo mock.

### B · App lector tipo libro (US-79) ✅

- ✅ Añadir `react-native-reanimated` + `react-native-gesture-handler` (`expo install`), plugin babel,
  `GestureHandlerRootView` en `App.tsx`.
- ✅ Reescribir `BookPages` con arrastre horizontal + page-curl; conservar ‹/› e indicador; página de
  alto fijo; arreglar hueco header↔contenido.
- ✅ Mockear reanimated/gesture-handler bajo Vitest; test de `BookPages` por ‹/›.

### C · App cabecera con nombre de sección (US-80) ✅

- ✅ `Screen` gana prop `title`; pestañas y pantallas de stack lo pasan (i18n); sin duplicar títulos.
- ✅ Test de componente de `Screen`.

### D · App pasos plegables (US-81) ✅

- ✅ `ActivityCard`: instrucciones plegadas por defecto + "Ver pasos"/"Ocultar pasos" (i18n).
- ✅ Ampliar test de `ActivityCard`.

### E · App búsqueda global (US-82) ✅

- ✅ `SearchResultsScreen` (overlay del root stack) lista cuentos + actividades; reusa
  `historyFilters`; punto de entrada desde Historial/Inicio.
- ✅ Test de componente.

### F · App conectar nombre + continuar (US-76/78 app) ✅

- ✅ Toggle "usar nombre" en `StoryGeneratorScreen` → gateway `stories.generate` envía `usarNombre`.
- ✅ Botón "Continuar la historia" en `StoryReaderScreen` → gateway `stories.continue`; abre el nuevo
  cuento; estados carga/error.
- ✅ Tests + esquemas Zod de respuesta.

## Cierre

Gate `pnpm check` verde → actualizar `phases.md`, `historias-usuario/` (US-75…US-82 + trazabilidad),
`modelo-datos.md` (`continuacionDe`), CHANGELOG (Unreleased). Versionado **diferido** al integrar en
`develop`. **No** hacer `finish`/merge sin confirmación del usuario. Pruebas en dev al final (dev build,
US-66).
