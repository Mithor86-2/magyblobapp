# Epic E — Configuración (zona de padres)

Historias: **US-11**, **US-12**, **US-13**, **US-66**. Volver al [índice](README.md).

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

## US-66 — Tema claro/oscuro (sistema + manual) · Should (Mejoras)

Como **padre/tutor** quiero elegir el tema de la app (automático según el sistema, o
forzar claro u oscuro) para adaptar la lectura a la luz del entorno y a la comodidad
del peque, y que ese ajuste alcance también a las barras del sistema.

**Criterios de aceptación**

- Dado el selector de tema en la zona de adultos, Cuando elijo **Automático**, Entonces
  la app sigue el esquema del sistema operativo y conmuta con él sin reiniciar.
- Dado el selector de tema, Cuando elijo **Claro** u **Oscuro**, Entonces toda la app
  (pantallas, componentes, cabeceras y barra de pestañas) se pinta con esa paleta al
  instante, ignorando el esquema del sistema.
- Dado un tema activo, Cuando cambio de tema, Entonces las **barras del sistema**
  (barra de estado y, en Android, la barra de navegación inferior de botones/gestos)
  quedan coherentes con la paleta (fondo e iconos legibles).
- Dado que elijo un tema, Cuando cierro y reabro la app, Entonces se conserva mi
  preferencia (persistida); y Cuando cierro sesión, Entonces la preferencia de tema
  **no** se borra (es preferencia de interfaz, no de sesión).
- Dado el requisito de cumplimiento (Docs/cumplimiento-menores.md), Cuando se aplica el
  tema, Entonces todo ocurre **en local** (lectura del esquema del SO y módulos
  build-time de Expo), sin red ni SDK de terceros.
