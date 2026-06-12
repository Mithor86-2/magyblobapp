# Epic F — Plataforma y no-funcionales

Historias: **US-06**, **US-17**, **US-18**, **US-15** (y **US-14**, descartada). Volver al
[índice](README.md).

## US-06 — Arranque reproducible · Must

Como **evaluador** quiero clonar y levantar todo con un comando para revisar el
proyecto sin pasos ocultos.

**Criterios de aceptación**

- Dado un equipo limpio, Cuando ejecuto `cp .env.example .env && docker compose up`,
  Entonces la pila (backend + PostgreSQL + Ollama) levanta y `/health` responde 200.
- Dado el modo por defecto `AI_PROVIDER=mock`, Cuando arranco, Entonces todo funciona
  sin GPU ni modelo descargado.
- Dado que quiero IA local real, Cuando ejecuto `pnpm ollama:setup`, Entonces se
  descarga `gemma:2b` (único paso con red, documentado).

## US-17 — Logs y tracking de primera parte · Should

Como **responsable del producto** quiero registrar interacciones y acciones sensibles
de forma propia (sin terceros) para medir uso y tener trazabilidad cumpliendo las
reglas de menores. Ver [cumplimiento-menores.md](../cumplimiento-menores.md).

**Criterios de aceptación**

- Dado un evento de uso (pantalla vista, cuento generado, actividad completada), Cuando
  ocurre, Entonces se registra un `InteractionEvent` con `profileId` (pseudónimo) y sin
  PII en el payload.
- Dado el tracking, Cuando se implementa, Entonces **no** usa SDKs de analítica/ads de
  terceros ni identificadores de dispositivo (regla Kids/Families).
- Dada una acción sensible del adulto (alta/edición/borrado de perfil, consentimiento),
  Cuando ocurre, Entonces se registra un `AuditLog` con actor, acción y entidad.
- Dada la política de conservación, Cuando se define, Entonces `InteractionEvent` y
  `AuditLog` se purgan según un plazo documentado (C-9).

## US-18 — Configuración editable (prompts y parámetros de IA) · Should

Como **desarrollador/administrador** quiero ajustar prompts, ids de modelo y parámetros
de generación sin tocar código ni reconstruir la imagen, para iterar la calidad de
cuentos y actividades. Ver `AppSetting` en [modelo-datos.md](../modelo-datos.md).

**Criterios de aceptación**

- Dada la tabla `AppSetting` (`key`, `value`), Cuando cambio un prompt o parámetro,
  Entonces la siguiente generación usa el nuevo valor sin redeploy.
- Dada una clave ausente en `AppSetting`, Cuando se lee, Entonces se aplica el valor por
  defecto definido en código.
- Dado un secreto (API key), Cuando se configura, Entonces va en variables de entorno,
  **nunca** en `AppSetting`.
- Dada una plantilla de prompt, Cuando se define, Entonces fuerza contenido apto y
  seguro para niños (guardarraíl).

## US-14 — Proveedor cloud opcional · ~~Could~~ Descartada

**Retirada del alcance (2026-06-12).** No se implementa proveedor cloud: el proyecto se
queda con `mock`/`local` por privacidad por diseño (los datos del menor no salen de la
máquina). Ver [ADR 0002](../ADR/0002-tres-modos-de-ia.md).

## US-15 — Modo nocturno · Could

Como **padre/tutor** quiero un modo nocturno para descansar la vista.

**Criterios de aceptación**

- Dado el ajuste de modo nocturno, Cuando lo activo, Entonces la app aplica el tema
  oscuro y persiste la preferencia.
