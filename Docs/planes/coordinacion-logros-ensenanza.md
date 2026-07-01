# Coordinación — Logros del niño (US-68) + Cuento con enseñanza (US-69)

Plan de coordinación de **dos mejoras de cara al usuario** que se implementan como
**vertical slices** sobre la estructura actual (Clean Architecture, sin terceros nuevos,
offline por defecto, tras puerta parental). Excluye el "Modo Hora de dormir" (descartado
por el usuario).

- **US-68 — Recompensas y logros del niño (gamificación).** Detalle en
  [feature-68-logros.md](feature-68-logros.md). Toca backend (nueva entidad `Achievement`)
  y app (pantalla "Mis logros").
- **US-69 — Cuento a la carta: elegir la enseñanza/valor.** Detalle en
  [feature-69-cuento-ensenanza.md](feature-69-cuento-ensenanza.md). Toca backend (prompt +
  persistencia) y app (chip en el generador + filtro en Historial).

## Decisiones de refinamiento (confirmadas por el usuario)

| Tema                 | Decisión                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logros: arquitectura | **Persistido en BD** — nueva entidad `Achievement` + migración + repo + endpoint.                                                                   |
| Logros: catálogo     | Cuentos leídos · Actividades completadas · Rachas de días · Explorar temas (los 4).                                                                 |
| Enseñanza: catálogo  | `amistad` (amistad y compartir) · `emociones` (gestionar emociones) · `valentia` (valentía y superar miedos) · `honestidad` (honestidad y respeto). |
| Enseñanza: flujo     | **Opcional, única, persistida y filtrable** en el Historial (migración en `Story`).                                                                 |

## Modo de ejecución — paralelo en worktrees

Las dos features son mayormente independientes. Se ejecutan **en paralelo, un worktree por
feature desde `develop`** (protocolo de [../trabajo-en-paralelo.md](../trabajo-en-paralelo.md)),
con **versionado diferido** (la versión se asigna al integrar en `develop`, no en la rama;
skill `versionar`).

### Ficheros compartidos (puntos de conflicto a vigilar)

Solo hay dos zonas de solape; se resuelven con el protocolo de paralelo:

1. **`packages/backend/src/domain/vocabulary.ts`** — US-69 añade `ENSENANZAS`; US-68 añade
   el evento `cuento_leido` a `TIPOS_EVENTO`. Son adiciones en bloques distintos del mismo
   fichero → conflicto trivial (ambos apéndices) o inexistente.
2. **`packages/backend/prisma/schema.prisma` + migraciones** — US-68 añade el modelo
   `Achievement` (+ relación en `ChildProfile`); US-69 añade `Story.ensenanza`. **Riesgo real:
   dos migraciones Prisma en paralelo.** Mitigación: **serializar la generación de la
   migración al integrar** — se mergea primero una feature a `develop`, se regenera/renombra
   la migración de la segunda sobre el esquema ya integrado, y se aplica. No generar las dos
   migraciones contra el mismo baseline sin rebasar.
3. **`CHANGELOG.md`** — cubierto por `merge=union` en `.gitattributes` (apéndices concurrentes
   se auto-fusionan).

Sin solape en: rutas, casos de uso, pantallas (US-68 → pantalla nueva `AchievementsScreen` +
entrada en `HomeScreen`; US-69 → `StoryGeneratorScreen` + `HistoryScreen`), navegación,
gateways.

## Historias de usuario

- **US-68** (nueva) — "Ver mis logros / recompensas". Épica D (Historial/Progreso) o épica
  nueva de gamificación; decidir al abrir la feature. Criterios Gherkin en la épica al
  ejecutar (regla del DoD).
- **US-69** (nueva) — "Elegir la enseñanza de un cuento". Épica B (Generación de cuentos).

Ambas se crean con sus criterios de aceptación como **primera tarea** de cada feature (fuente
de los tests del DoD).

## Cierre del lote

- Gate `pnpm check` verde en cada rama antes de proponer merge.
- Integración con versionado diferido (previsible: **minor**, funcionalidad nueva sin ruptura).
- Actualizar al integrar: [../phases.md](../phases.md), [../modelo-datos.md](../modelo-datos.md)
  (nuevo `Achievement` + campo `Story.ensenanza`), [historias-usuario](../historias-usuario/README.md)
  (US-68/US-69 + trazabilidad) y CHANGELOG por paquete.
- **Último paso (regla del DoD):** pruebas con el usuario (manual u ofrecer automatizada) antes
  de cerrar. `git flow feature finish` solo tras confirmación explícita.
