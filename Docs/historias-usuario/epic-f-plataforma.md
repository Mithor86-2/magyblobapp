# Epic F — Plataforma y no-funcionales

Historias: **US-06**, **US-17**, **US-18**, **US-14**, **US-15**. Volver al
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

## US-14 — Proveedor cloud opcional · Could (reactivada)

> **Historia.** _Retirada del alcance el 2026-06-12 y **reactivada**_ a petición del
> usuario: se reintroduce el modo `cloud` como **opt-in, OFF por defecto**, conmutable en
> caliente desde BD. El defecto del proyecto sigue siendo `mock`/`local` (privacidad por
> diseño). Ver [ADR 0002](../ADR/0002-tres-modos-de-ia.md) y el plan
> [14-proveedor-cloud](../planes/14-proveedor-cloud.md).

Como **administrador** (zona de padres) quiero **activar y cambiar en caliente** un
proveedor de IA en la nube (compatible con OpenAI) para mejorar la calidad de los cuentos
y actividades, sin tocar código ni exponer secretos en la base de datos, y manteniendo
`mock`/`local` como modo por defecto.

**Criterios de aceptación**

- Dada la clave `ai.cloud` de `AppSetting` con JSON `{"activo": true, "target": "groq",
"model": "..."}` y la API key del `target` en variables de entorno, Cuando se genera un
  cuento o una actividad, Entonces se usa el proveedor cloud resuelto por el preset del
  `target` (su `baseUrl`) y la key leída de env.
- Dado `activo=false`, o la clave ausente, o un JSON inválido, Cuando se construye el
  proveedor, Entonces se usa el modo por defecto (`mock`/`local`) — cloud es **opt-in**.
- Dado que el proveedor cloud falla (caído, timeout o JSON inválido), Cuando se genera,
  Entonces se cae a `MockProvider` (mismo `FallbackProvider` que `local`).
- Dado un secreto (API key del proveedor), Cuando se configura, Entonces va en variables
  de entorno (`<TARGET>_API_KEY`), **nunca** en `AppSetting`/BD (coherente con US-18).
- Dado un cambio del proveedor activo (acción sensible del adulto), Cuando ocurre,
  Entonces se registra un `AuditLog`.
- (Cumplimiento) Dado el modo cloud, Entonces se documenta que salen **datos minimizados**
  del perfil (edad, intereses, idioma; nunca nombre ni identificadores) a un tercero, que
  queda OFF por defecto y que los free tiers pueden entrenar con los datos
  ([cumplimiento-menores.md](../cumplimiento-menores.md)).

## US-15 — Modo nocturno · Could

Como **padre/tutor** quiero un modo nocturno para descansar la vista.

**Criterios de aceptación**

- Dado el ajuste de modo nocturno, Cuando lo activo, Entonces la app aplica el tema
  oscuro y persiste la preferencia.
