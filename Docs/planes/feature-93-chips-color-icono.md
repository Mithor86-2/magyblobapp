# Plan — Feature 93: Chips por categoría con color + icono (US-89, ajuste #1)

Rama: `feature/87-ajustes-ideas-3` (lote 4). Ficheros: `SelectableChip.tsx`, `Icon.tsx`,
`chipIcons.ts` (nuevo), `StoryGeneratorScreen.tsx`, `CreateProfileScreen.tsx`, `DashboardScreen.tsx`.

## Objetivo

Los chips de **temas / estilos / enseñanza / usar nombre** tienen un **color por categoría** y un
**icono** por opción; los iconos de tema se reutilizan en los intereses (gustos) al crear el perfil y
en el Dashboard.

## Color por categoría (chip seleccionado)

| Categoría   | Variante     | Color |
| ----------- | ------------ | ----- |
| Temas       | `tertiary`   | cielo |
| Estilos     | `secondary`  | menta |
| Enseñanza   | `quaternary` | ámbar |
| Usar nombre | `primary`    | coral |

## Iconos (lucide, nuevos en `Icon.tsx`)

- Temas: `tema-animales`=PawPrint · `tema-espacio`=Rocket · `tema-magia`=Wand2 · `tema-aventuras`=Compass · `tema-musica`=Music.
- Estilos: `estilo-aventura`=Mountain · `estilo-divertido`=Laugh · `estilo-educativo`=GraduationCap.
- Enseñanza: `ens-amistad`=Handshake · `ens-emociones`=Smile · `ens-valentia`=Shield · `ens-honestidad`=BadgeCheck.
- Usar nombre: `name`=Tag.

## Tareas

- ⬜ `Icon.tsx`: importar y mapear los iconos nuevos.
- ⬜ `chipIcons.ts`: `temaIcon(tema)`, `estiloIcon(estilo)`, `ensenanzaIcon(ens)` → `IconName`.
- ⬜ `SelectableChip`: props `icon?: IconName` y `color?: 'primary'|'secondary'|'tertiary'|'quaternary'`;
  seleccionado = relleno del color (icono+label en `on*`), sin seleccionar = contorno con icono atenuado.
- ⬜ `StoryGeneratorScreen`: temas=tertiary, estilos=secondary, enseñanza=quaternary, usar-nombre=primary,
  cada uno con su icono.
- ⬜ `CreateProfileScreen`: intereses (temas) con icono de tema (color tertiary).
- ⬜ `DashboardScreen`: temas (tertiary) y estilos (secondary) con icono.
- ⬜ Tests: `SelectableChip.test.tsx` (icono + color por variante); pantallas siguen verdes (chips por texto).
