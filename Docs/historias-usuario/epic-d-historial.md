# Epic D — Historial

Historias: **US-08**, **US-27**. Volver al [índice](README.md).

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
