# Epic E — Configuración (zona de padres)

Historias: **US-11**, **US-12**, **US-13**. Volver al [índice](README.md).

## US-11 — Editar perfil · Should

Como **padre/tutor** quiero editar los datos del perfil para mantenerlos al día.

**Criterios de aceptación**

- Dado un perfil existente, Cuando cambio nombre/edad/avatar/intereses y guardo,
  Entonces los cambios se persisten y se reflejan en las demás pantallas.

## US-12 — Cambiar idioma (ES/EN) · Should

Como **padre/tutor** quiero cambiar el idioma de la app y de los cuentos.

**Criterios de aceptación**

- Dado el idioma actual, Cuando lo cambio entre ES y EN, Entonces la UI y los nuevos
  cuentos se generan en el idioma elegido.
- Dado un cuento ya guardado, Cuando cambio el idioma, Entonces el cuento existente
  conserva su idioma original (no se re-traduce).

## US-13 — Eliminar perfil · Should

Como **padre/tutor** quiero eliminar un perfil y su progreso de forma controlada.

**Criterios de aceptación**

- Dado un perfil, Cuando pulso "Eliminar perfil", Entonces se pide confirmación
  explícita advirtiendo que la acción es permanente.
- Dado que confirmo, Cuando se ejecuta, Entonces se borran el perfil y sus
  cuentos/actividades asociados.
