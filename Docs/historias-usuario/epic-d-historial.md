# Epic D — Historial

Historias: **US-08**, **US-27**, **US-62**. Volver al [índice](README.md).

## US-08 — Ver historial de cuentos · Should

Como **padre/tutor** quiero revisar los cuentos creados para releerlos.

**Criterios de aceptación**

- Dado el Historial, Cuando filtro por "Cuentos", Entonces veo los cuentos del perfil
  con título, fecha y estado (`nuevo | leído`) y la acción "Ver de nuevo".
- (Dominio) Dado el caso de uso `GetHistory`, Cuando recibe un perfil, Entonces
  devuelve cuentos y actividades ordenados por fecha descendente.

## US-27 — Releer un cuento desde el Historial · Should (Mejoras)

Como **padre/tutor** (o niño/a acompañado) quiero abrir un cuento guardado y volver a leerlo
completo desde el Historial, marcándolo como leído al abrirlo.

**Contexto.** Hoy el Historial **lista** los cuentos y permite "marcar leído" con un botón, pero no
hay una vista de lectura. Se añade una **pantalla de detalle** (título + cuerpo, reutilizando el
estilo de la tarjeta del generador y el `AuthorBadge`) a la que se llega tocando el cuento; al
abrirla se marca `leído` (US-07/US-08, reutiliza `POST /stories/:id/read`). **Solo app.**

**Criterios de aceptación**

- Dado un cuento del Historial, Cuando lo toco, Entonces se abre una vista de lectura con su
  **título y cuerpo** completos (y el Autor).
- Dado que abro un cuento `nuevo`, Cuando se muestra la vista de lectura, Entonces queda marcado
  como `leído` (y el Historial lo refleja al volver).
- Dada la vista de lectura, Cuando pulso "atrás", Entonces vuelvo al Historial sin perder su estado.

## US-62 — Fecha de generación y filtros en el Historial · Should (Mejoras)

Como **padre/tutor** quiero ver **cuándo** se generó cada cuento y actividad y poder **filtrar** las
listas del Historial para encontrar rápido lo que busco.

**Contexto.** Amplía **US-08** (que ya pedía mostrar la fecha). El backend expone `creadoEn` (ISO) en
los DTO de cuento y actividad (feature A, US-61); el app lo muestra **formateado y localizado**
(ES/EN) en el Historial, la lectura del cuento y la tarjeta de actividad. Si `creadoEn` falta no se
muestra nada (sin error). Además, el Historial gana **filtros en cliente** sobre las listas ya
cargadas: por **tema** y **estilo** para cuentos, y por **categoría** para actividades, con chips y
opción **"Todos"** por defecto. **Solo app.**

**Criterios de aceptación**

- Dado un cuento o actividad con `creadoEn`, Cuando lo veo en el Historial (o en la lectura, o en la
  tarjeta de actividad), Entonces veo su **fecha de generación** formateada según el idioma del app.
- Dado un cuento o actividad **sin** `creadoEn`, Cuando se muestra, Entonces **no** aparece ninguna
  fecha ni error.
- Dado el Historial con cuentos, Cuando elijo un **tema** (o un **estilo**), Entonces la lista de
  cuentos se reduce a los que coinciden; con **"Todos"** se muestran todos.
- Dado el Historial con actividades, Cuando elijo una **categoría**, Entonces la lista de actividades
  se reduce a las de esa categoría; con **"Todos"** se muestran todas.
- Dado un filtro activo, Cuando lo cambio, Entonces el estado del filtro es **local** de la pantalla
  (no se persiste) y las etiquetas de chips y la fecha respetan el **idioma del app**.
