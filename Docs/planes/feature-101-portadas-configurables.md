# Plan — Feature 101: Portadas de cuento configurables por BD (US-101)

Rama: `feature/101-portadas-configurables` (desde `develop`).

## Objetivo

Las portadas de cuento (imágenes por **tema** y **tema+estilo**, bundleadas en la app) se **configuran
desde la BD** mediante una clave de `AppSetting` (**`story.covers`**, JSON `[{imagen, tema?, estilo?}]`),
editable directamente en BD y sincronizada versionada desde `prisma/app-settings.json`. El **backend
elige de la lista** la imagen que aplica al cuento creado (según su tema/estilo) y la **persiste** en
el cuento (`portadaKey`); la app resuelve ese nombre contra las imágenes empaquetadas.

## Decisiones (aprobadas)

- **Fijar al crear**: se persiste `portadaKey` en `Story` (columna nueva + migración). No retroactivo.
- Imágenes **bundleadas en la app** (Metro necesita `require` estáticos); la BD configura el **mapeo**
  tema/estilo → nombre de imagen. Reconfigurar el mapeo es solo-BD; **añadir** una imagen nueva sigue
  requiriendo meterla en el bundle + el mapa estático del app (rebuild).

## Resolución del backend (`pickCover`)

Dado (tema, estilo), elige el `imagen` de la lista con prioridad:

1. entrada con **tema y estilo** coincidentes,
2. entrada con **tema** (sin estilo),
3. entrada con **estilo** (sin tema),
4. `null` (la app cae a su respaldo por tema).

## Mapeo por defecto (semilla `story.covers`, v1)

7 combos con fichero (`animales+aventura`, `animales+divertido`, `espacio+aventura`,
`espacio+divertido`, `magia+divertido`, `musica+aventura`, `musica+divertido`) + 5 por tema
(`animales`, `espacio`, `magia`, `musica`, `aventuras`) + 2 por estilo (`aventura`, `divertido`).

## Fases y tareas

### Fase 1 — Backend

- ✅ `prisma/schema.prisma`: `Story.portadaKey String?` + **migración**. Actualizar `Docs/modelo-datos.md`.
- ✅ `prisma/app-settings.json`: clave **`story.covers`** (v1) con el mapeo por defecto.
- ✅ `src/domain/repositories/StoryCoverCatalog.ts` (**puerto**): `pick(tema, estilo): Promise<string|null>`.
- ✅ `src/infrastructure/ai/storyCovers.ts` (**nuevo**): clave, esquema Zod, `parseStoryCovers`,
  `pickCover`, y `SettingsStoryCoverCatalog` (implementa el puerto leyendo `SettingsRepository`).
- ✅ `Story` (entidad) + `StoryOutput`/`AnonymousStoryOutput` (dto) + `toStoryOutput` (mapper): `portadaKey`.
- ✅ `GenerateStory`, `ContinueStory`: calculan y **persisten** `portadaKey`; `GenerateStoryAnonymous`:
  lo calcula en el output (sin persistir).
- ✅ `AppDeps` + `*Deps` + `composition`: nueva dep `covers` (`SettingsStoryCoverCatalog(settings)`).
- ✅ `PrismaStoryRepository`: `save` + `toStory` con `portadaKey`.
- ✅ Tests: `storyCovers` (pickCover exacto/tema/estilo/null, parseo), `GenerateStory` (setea portadaKey
  con catálogo doble), integración `POST /stories` devuelve `portadaKey`.

### Fase 2 — App

- ✅ `git add` de las 14 portadas; mapa estático `coversByName` (nombre→`require`) + test.
- ✅ `Story.portadaKey?` (tipo) + `storySchema` (Zod) con `portadaKey` opcional.
- ✅ `StoryCover`: resuelve **portada generada (data URL) → `coversByName[portadaKey]` → respaldo por
  tema**; acepta `portadaKey`. Test.
- ✅ `StoryReaderScreen` e `HistoryScreen`: pasan `portadaKey`.

### Fase 3 — Cierre

- 🔄 `pnpm check` verde ✅; docs (US-101, `modelo-datos.md`, CHANGELOG backend+app) ✅; pasos de prueba
  local y confirmación antes del `finish` (pendiente).

## Tests (DoD)

- Backend: `storyCovers` (unit), `GenerateStory` (portadaKey), integración de ruta.
- App: `StoryCover`/`coversByName` (render por nombre), schema/tipo con `portadaKey`.
