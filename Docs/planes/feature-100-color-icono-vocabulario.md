# Plan — Feature 100: Color e icono por vocabulario en tarjetas y chips (US-100)

Rama: `feature/100-color-icono-vocabulario` (desde `develop`).

## Objetivo

Cada **tema / estilo / enseñanza / categoría** tiene un **color propio y estable en toda la app**
(_mismo texto → mismo color_; "Música" tema y "Música" categoría comparten color) y su **icono**.
Ese color e icono se reflejan en las **tarjetas** de cuento (historial) y de actividad, y en los
**chips** de selección. Además la tarjeta de cuento del historial muestra la **portada** y un
**botón** de "Ver de nuevo" estilado, con el **borde de la tarjeta del mismo color que el botón**.

Cubre los 4 ajustes pedidos:

1. Tarjeta de cuento: mostrar portada + estilar el botón de leer.
2. Cada categoría/tema/estilo con color, mismo color por mismo texto en toda la app.
3. Historial (actividades y lectura): borde de la tarjeta == color del botón de acción.
4. Icono + color de la categoría/tema reflejados en las tarjetas.

## Decisiones (aprobadas)

- **Paleta nueva dedicada**: color distinto por valor (no reutilizar solo los 4 roles del theme).
- **Alcance completo**: temas + categorías de actividad + estilos + enseñanzas.
- Cambio previo del header (ancho completo) ya commiteado a `develop`.

## Paleta propuesta (Fase 0, revisable en Fase 2 viéndola en vivo)

Color base (claro; texto blanco encima). En oscuro se aclara cada tono para legibilidad sobre índigo.
_Mismo texto → mismo color_: `musica` (tema) y `musica` (categoría) comparten entrada.

| Clave      | Vocabulario          | Color claro | Color oscuro (aprox) |
| ---------- | -------------------- | ----------- | -------------------- |
| animales   | tema                 | `#3f8a5c`   | `#7fce9f`            |
| aventuras  | tema                 | `#1f6f9c`   | `#76c3e1`            |
| musica     | tema **+ categoría** | `#9c4143`   | `#ffb4a7`            |
| espacio    | tema                 | `#3f4d9c`   | `#a8b1f0`            |
| magia      | tema                 | `#7a3f9c`   | `#d3bcfc`            |
| arte       | categoría            | `#b5651d`   | `#f0b878`            |
| logica     | categoría            | `#1f8a8a`   | `#76d5d5`            |
| aventura   | estilo               | `#6b8e23`   | `#bcd88a`            |
| divertido  | estilo               | `#c2477a`   | `#f0a0c0`            |
| educativo  | estilo               | `#2f5aa0`   | `#a0bce8`            |
| amistad    | enseñanza            | `#c26a2f`   | `#f0b088`            |
| emociones  | enseñanza            | `#a83f6b`   | `#f0a0c0`            |
| valentia   | enseñanza            | `#3f7a9c`   | `#8fc4e0`            |
| honestidad | enseñanza            | `#5a7a3f`   | `#b8d090`            |

> Los hexes exactos se ajustan en Fase 0 si algún par queda demasiado parecido; se revisan en vivo en
> Fase 2. Cada entrada expone `{ color, on }` (texto/icono legible encima).

## Arquitectura

- `packages/app/src/presentation/theme/tokens.ts`: nueva paleta `categoryColors` (claro + oscuro),
  con la misma forma de claves en ambos temas (como el resto de `ColorTokens`).
- `packages/app/src/presentation/vocabColor.ts` (**nuevo**): `vocabColor(colors, valor)` →
  `{ color, on }`, que cubre tema/estilo/enseñanza/categoría. Fuente única del color por valor
  (equivalente a `chipIcons.ts` pero para color). Reemplaza el mapa local de `ActivityCard`.

## Fases y tareas

### Fase 0 — Fundación (secuencial; el resto depende de ella)

- ✅ `tokens.ts`: añadir `categoryColors` (claro + oscuro) y su tipo.
- ✅ `vocabColor.ts`: resolver `{ color, on }` por valor; música compartida.
- ✅ `vocabColor.test.ts` (**nuevo**): mismo texto→mismo color; música compartida; resuelve para todos
  los valores de `TEMAS`/`ESTILOS`/`ENSENANZAS`/`CATEGORIAS` en claro y oscuro.
- ✅ Commit de fundación en la rama base (los worktrees de Fase 1 parten de aquí).

### Fase 1 — Tracks en paralelo (worktrees; archivos disjuntos)

**Track A — Tarjeta de cuento (historial)** · ficheros: `HistoryScreen.tsx` (+ su test)

- ✅ Añadir **portada** miniatura con `StoryCover` (usa `story.portada` + `story.tema`).
- ✅ Convertir "Ver de nuevo" (hoy texto+flecha) en **botón** estilado (`BubblyButton` o pill), con
  color = `vocabColor(tema)`.
- ✅ **Borde** de la tarjeta del mismo color que el botón (`vocabColor(tema)`).
- ✅ Icono de tema (`temaIcon`) tintado con el color del tema.
- ✅ Tests: la tarjeta renderiza portada (rol `image`), botón de acción y borde/color por tema.

**Track B — ActivityCard** · ficheros: `ActivityCard.tsx` (+ su test)

- ✅ Reemplazar `categoriaColor` local por `vocabColor(colors, categoria)`.
- ✅ **Borde** de la tarjeta == color del botón/acción de la categoría.
- ✅ Icono + badge de categoría con el color del mapa central.
- ✅ Tests: borde == color de acción; usa el color central por categoría.

**Track C — Chips/selectores** · ficheros: `SelectableChip.tsx`, `StoryGeneratorScreen.tsx`,
`CreateProfileScreen.tsx`, `DashboardScreen.tsx` (+ tests afectados)

- ✅ `SelectableChip`: aceptar un color arbitrario por valor (además de las variantes de familia).
- ✅ Selectores: pintar cada chip con `vocabColor(valor)` (color por valor, no por tipo de chip).
- ✅ Tests: chips siguen localizándose por texto; el color viene por valor.

### Fase 2 — Cierre

- ✅ Integrar los 3 tracks a `feature/100-…`.
- ✅ Gate verde: `pnpm check` (typecheck + lint + format:check + test).
- ✅ Actualizar `Docs/historias-usuario/` (US-100 + tabla de trazabilidad) y CHANGELOG Unreleased del app.
- 🔄 Entregar pasos de prueba en **develop local** (Expo web + dispositivo) y pedir confirmación antes
  de `git flow feature finish` (regla del proyecto: no finalizar sin confirmación explícita).

## Tests (resumen del DoD de esta feature)

- `vocabColor.test.ts` (nuevo).
- `HistoryScreen` (portada + botón + borde por tema).
- `ActivityCard.test.tsx` (borde == acción; color central).
- `SelectableChip.test.tsx` + tests de pantallas de selección siguen verdes.
