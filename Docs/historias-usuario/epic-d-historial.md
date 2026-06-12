# Epic D — Historial

Historias: **US-08**. Volver al [índice](README.md).

## US-08 — Ver historial de cuentos · Should

Como **padre/tutor** quiero revisar los cuentos creados para releerlos.

**Criterios de aceptación**

- Dado el Historial, Cuando filtro por "Cuentos", Entonces veo los cuentos del perfil
  con título, fecha y estado (`nuevo | leído`) y la acción "Ver de nuevo".
- (Dominio) Dado el caso de uso `GetHistory`, Cuando recibe un perfil, Entonces
  devuelve cuentos y actividades ordenados por fecha descendente.
