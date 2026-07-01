# Epic D — Historial

Historias: **US-08**, **US-27**, **US-62**, **US-63**, **US-64**. Volver al [índice](README.md).

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

## US-63 — Marcar cuentos y actividades como favoritos · Should (Mejoras)

Como **padre/tutor** quiero marcar cuentos y actividades como **favoritos** para encontrar rápido los
que más nos gustan desde el Historial.

**Contexto.** Favorito es un **flag booleano** por cuento/actividad (que ya cuelgan de un perfil), sin
tabla nueva: "favoritas por perfil" con coste mínimo. Esta historia cubre el **backend** (US-63):
persistencia (`favorito` en `Story`/`Activity`), endpoints idempotentes y exposición en los DTO. La
parte de UI (botón estrella, filtro "solo favoritos" y búsqueda en el Historial) vive en **US-64**
(app). Se ubica en la épica de Historial por ser una funcionalidad transversal que se descubre y
explota desde el Historial; toca cuentos (épica B) y actividades (épica C) por igual.

**Criterios de aceptación**

- Dado un cuento existente, Cuando hago `POST /stories/:id/favorite` con `{ favorito: true }`, Entonces
  el cuento queda marcado como favorito y la respuesta (200) devuelve el cuento con `favorito: true`.
- Dada una actividad existente, Cuando hago `POST /activities/:id/favorite` con `{ favorito: false }`,
  Entonces la actividad queda desmarcada y la respuesta (200) devuelve la actividad con `favorito: false`.
- Dado un id inexistente, Cuando llamo a cualquiera de los dos endpoints, Entonces recibo `404`
  (`NotFoundError`).
- Dado un body inválido (sin `favorito` o de tipo distinto a booleano), Cuando llamo al endpoint,
  Entonces recibo `400` (validación Zod en frontera).
- Dada la operación, Cuando la repito con el mismo valor, Entonces es **idempotente** (el estado final
  es el mismo y no falla).
- Dado un cuento/actividad recién generado, Cuando se crea, Entonces nace con `favorito: false` (default).
- Dado el Historial (`GetHistory`), Cuando lo consulto, Entonces cada cuento y actividad expone su
  campo `favorito` en el DTO.

## US-64 — Favoritos (UI) y búsqueda de texto en el Historial · Should (Mejoras)

Como **padre/tutor** quiero **marcar como favoritos** los cuentos y actividades que más nos gustan y
**buscar por texto** en el Historial, para reencontrar rápido lo que busco.

**Contexto.** Amplía **US-08** y **US-62**. La parte **app** de la feature de favoritos (la
persistencia y los endpoints son de la feature A, US-63): el backend expone
`POST /stories/:id/favorite` y `POST /activities/:id/favorite` (body `{ favorito: boolean }`,
autenticados, idempotentes; devuelven el item actualizado) y añade `favorito` a los DTO de cuento y
actividad. El app muestra un **botón estrella** (lucide `star`, relleno cuando es favorito) para
alternar el favorito en la **lectura** del cuento, en los **ítems del Historial** y en la
`ActivityCard`, con actualización **optimista** y refresco del estado. El campo `favorito?` se trata
como **opcional** en los tipos/esquemas del app, para no romper durante la transición hasta integrar
la feature A. Además, el Historial gana un **filtro "solo favoritos"** (chip/toggle, combinado con
los filtros de US-62) y un **campo de búsqueda de texto** que filtra **en cliente** (coincidencia
**normalizada**: minúsculas, sin acentos, por subcadena) cuentos y actividades por **título**,
**cuerpo** (cuentos), **descripción** e **instrucciones** (actividades), **tema**, **estilo** y
**categoría**. **Solo app.**

**Criterios de aceptación**

- Dado un cuento (en la lectura o en el Historial), Cuando pulso su **estrella**, Entonces se marca
  como favorito (estrella rellena) llamando a `POST /stories/:id/favorite`, con efecto **optimista**;
  si el backend falla, el estado vuelve atrás sin romper la pantalla.
- Dada una actividad en su tarjeta, Cuando pulso su **estrella**, Entonces se marca como favorita
  llamando a `POST /activities/:id/favorite`, con el mismo comportamiento optimista.
- Dado el Historial, Cuando activo el chip **"Solo favoritos"**, Entonces las listas se reducen a los
  cuentos y actividades marcados como favoritos; al desactivarlo se muestran todos.
- Dado el Historial, Cuando escribo texto en el **campo de búsqueda**, Entonces las listas se reducen
  a los ítems cuyo título, cuerpo/descripción, instrucciones, tema, estilo o categoría **contienen**
  el texto (comparación **normalizada**, sin distinguir mayúsculas ni acentos); con el campo vacío se
  muestran todos.
- Dados varios filtros activos (tema/estilo/categoría de US-62 + "Solo favoritos" + búsqueda), Cuando
  los combino, Entonces las listas respetan **todos** a la vez.
- Dado un cuento o actividad **sin** el campo `favorito` (backend antiguo), Cuando se muestra,
  Entonces se trata como **no favorito** y no se produce ningún error.

## US-68 — Logros / recompensas del niño {#us-68}

**Como** niño, **quiero** ganar medallas al leer cuentos y completar actividades, **para** sentirme
motivado a seguir aprendiendo y jugando.

**Prioridad:** Should · **Fase:** Mejoras · **Pantalla:** Mis logros (abierta desde Inicio).

**Alcance**

1. **Catálogo (4 categorías):** cuentos leídos (hitos 1/5/10/25), actividades completadas
   (1/5/10/25), racha de días seguidos de uso (3/7) y explorar temas (un logro por tema). El catálogo
   vive en el **dominio** (`domain/logros.ts`), calculado sin IO sobre `Story`/`Activity`.
2. **Persistencia (nueva entidad `Achievement`):** guarda solo el hecho del desbloqueo
   (`clave` + `desbloqueadoEn`), idempotente por `profileId`+`clave`; cascada con el perfil (GDPR).
3. **Lectura + reconciliación:** `GET /profiles/:id/achievements` devuelve el catálogo con progreso y
   estado; **reconcilia** persistiendo los logros recién conseguidos. El estado es correcto aunque la
   persistencia falle (sale del cálculo).
4. **App:** pantalla "Mis logros" (rejilla de medallas conseguidas/bloqueadas con progreso), accesible
   desde Inicio; i18n ES/EN. Todo local, sin PII nueva.

**Criterios de aceptación**

- **(Vacío)** Dado un perfil sin actividad, Cuando abro Mis logros, Entonces todo el catálogo aparece
  como no conseguido y no se persiste nada.
- **(Desbloqueo)** Dado que leo un cuento de un tema, Cuando consulto los logros, Entonces se marcan
  conseguidos el hito "1 cuento" y el logro de ese tema, y quedan persistidos.
- **(Progreso)** Dado un logro no conseguido, Entonces muestra su progreso `progreso/meta`.
- **(Idempotencia)** Dado que consulto los logros dos veces, Entonces los desbloqueos no se duplican y
  conservan su fecha original.
- **(Racha)** Dado uso en días de calendario consecutivos, Cuando alcanzo 3 días seguidos, Entonces
  se desbloquea la racha de 3 (un hueco reinicia el conteo; se guarda la máxima alcanzada).
- **(Sesión)** Dado que no hay sesión, Cuando llamo al endpoint, Entonces responde **401**.
- **(Cumplimiento)** Dado el cálculo, Entonces es **local**, sin terceros ni PII nueva (el logro se
  refiere al niño por `profileId`) y se borra en cascada con el perfil.
