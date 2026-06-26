# Cumplimiento para una app dirigida a menores

La app está dirigida a **niños de 2 a 6 años**. Todos están **por debajo de 14**
(España/GDPR) y de **13** (COPPA), por lo que el **consentimiento del adulto
responsable es siempre obligatorio** y el niño nunca es el titular del consentimiento.
Esto condiciona el modelo de datos ([modelo-datos.md](modelo-datos.md)) y la
arquitectura.

> Alcance asumido: UE + España (GDPR + LOPDGDD) como marco principal, más las normas de
> las dos tiendas (Apple Kids, Google Play Families) y mención a COPPA (EE. UU.). El
> proyecto es un TFM: se documenta el diseño conforme y se señalan las limitaciones
> (p. ej. verificación robusta de edad) que quedarían fuera del alcance de implementación.

## Marcos aplicables (resumen verificado)

### Apple — App Store, categoría Kids

- **Sin terceros:** las apps de la categoría Kids **no** pueden incluir analítica de
  terceros ni publicidad de terceros, ni transmitir información personal o del
  dispositivo a terceros.
- **Parental gate:** enlaces externos, permisos y compras solo tras una "puerta
  parental" (operación no resoluble por un niño pequeño).
- **Política de privacidad** obligatoria y cumplimiento de las leyes de privacidad
  infantil aplicables.

### Google Play — política Families

- Cumplir **COPPA** y **GDPR** y demás leyes aplicables a menores.
- **Consentimiento parental verificable** antes de recoger datos de menores de 13.
- **Declarar toda recogida de datos**, incluida la de APIs/**SDKs**; sección **Data
  safety** y política **Child Safety Standards**.
- **No transmitir identificadores** (p. ej. Advertising ID) de niños o usuarios de edad
  desconocida.

### GDPR + LOPDGDD (España)

- **Art. 7 LOPDGDD:** el menor puede consentir por sí mismo a partir de **14 años**;
  por debajo, el tratamiento basado en consentimiento exige el del **titular de la
  patria potestad o tutela**. (España mantiene los 14; no baja a 13.)
- Obligación del responsable de **verificar la edad** y la validez del consentimiento
  parental.
- **Información en lenguaje claro** y comprensible.
- Principios de **minimización**, **finalidad** y **limitación de conservación**.

### COPPA (EE. UU.)

- Consentimiento parental verificable para recoger datos de menores de **13**.

## Implicaciones de diseño (qué hacemos)

| #    | Requisito                                  | Cómo lo cumple el proyecto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Estado                          |
| ---- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| C-1  | Consentimiento parental verificable        | Entidad `Guardian` + registro de consentimiento (`consentimientoEn`, versión); alta del niño solo dentro de una cuenta de adulto. **Reforzado (US-48):** la cuenta del adulto se protege con **contraseña** (hash bcrypt), de modo que solo quien la conoce accede a los datos del menor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Diseño                          |
| C-2  | Sin analítica/publicidad de terceros       | Tracking **de primera parte** en tabla propia (`InteractionEvent`); **cero SDKs** de analítica/ads de terceros                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Diseño                          |
| C-3  | Sin transmitir identificadores de menores  | No se usa Advertising ID; los eventos referencian `profileId` interno (pseudónimo), no identificadores de dispositivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Diseño                          |
| C-4  | Minimización de datos                      | Del adulto solo lo necesario (nombre, apellidos, email, parentesco); del niño: nombre, edad, idioma, avatar, intereses                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Diseño                          |
| C-5  | Privacidad por diseño / datos no salen     | **Desviación (2026-06-23):** el modo `cloud` pasa a **ON por defecto** (decisión TFM); con API key salen **datos minimizados** (edad, intereses, idioma; nunca nombre ni identificadores) a un tercero. **Sin key cae a local/mock** (no sale nada). Conmutable en caliente (`ai.cloud.activo=false` restaura local/mock) ([ADR 0002](ADR/0002-tres-modos-de-ia.md), [US-14](historias-usuario/epic-f-plataforma.md#us-14))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Desviación (TFM) / OK sin key   |
| C-6  | Parental gate (zona de adultos)            | Configuración y gestión de perfiles tras una puerta parental; UI infantil sin enlaces externos ni compras                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Diseño                          |
| C-7  | Política de privacidad + lenguaje claro    | Documento de privacidad; textos al niño en lenguaje sencillo (coherente con el design system)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Pend.                           |
| C-8  | Derechos GDPR (acceso, borrado)            | Borrado de `Guardian` en cascada con sus `ChildProfile`, cuentos, actividades y eventos (US-13)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Diseño                          |
| C-9  | Limitación de conservación                 | **Política documentada (2026-06-25):** `InteractionEvent` 90 días, `AuditLog` 365 días (los de consentimiento, mientras exista la cuenta); supresión inmediata por baja de cuenta/perfil vía cascada (C-8). La **purga automática programada** queda para Fase 7/producción. Ver nota "Política de conservación" abajo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Documentado / purga Fase 7      |
| C-10 | Verificación robusta de edad del adulto    | **Limitación reconocida (edad):** se usa puerta parental + email; la verificación fuerte de **edad** queda fuera del alcance del TFM. **Refuerzo de identidad (US-48, 2026-06-26):** se **revierte** la postura "identificación ligera por email, sin contraseña": el alta guarda un **hash bcrypt** de la contraseña y el login la **verifica** (401 genérico que no distingue email inexistente de contraseña errónea). El hash es dato del adulto, va en BD pero **nunca** en claro, y la contraseña no se registra en logs/`AuditLog`. `bcryptjs` es JS local (sin red ni terceros) → **no afecta a C-2/C-5**. Sigue sin verificarse la edad de forma fuerte (esa limitación se mantiene)                                                                                                                                                                                                                         | Limit. edad / Reforzado (US-48) |
| C-11 | Narración de cuentos (ElevenLabs, US-22)   | **Desviación asumida (TFM):** narrar envía el `cuerpo` del cuento —con el nombre del niño— a ElevenLabs (tercero, nube); **rompe C-2/C-5** y es **incompatible con Apple Kids**, y **no es minimizable** sin romper la función. Mitigaciones: el backend es proxy (la key no sale al cliente) y hay **fallback a voz nativa** on-device si falla. Ver [US-22](historias-usuario/epic-b-cuentos.md#us-22)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Desviación (TFM)                |
| C-12 | Monitorización de errores (Sentry, US-40)  | **Desviación asumida (TFM):** `@sentry/react-native` (SaaS) transmite informes de error/crash y metadatos del dispositivo a un tercero (sentry.io); **rompe C-2** (SDK de tercero) y **C-5**, e **incompatible con Apple Kids**. Mitigaciones: **init condicional al DSN** (sin `EXPO_PUBLIC_SENTRY_DSN` no se inicializa y no sale nada → modo por defecto/dev/E2E conforme), `sendDefaultPii: false`, `beforeSend` que elimina `user`/`request`/nombre de dispositivo y **redacta el nombre del niño del perfil activo** (el dato del menor nunca sale; el del adulto administrador sí puede), **sin Session Replay ni `setUser` del niño**, y **sin performance tracing**. Desactivable retirando el DSN. Ver [US-40](historias-usuario/epic-f-plataforma.md#us-40)                                                                                                                                                | Desviación (TFM) / OK sin DSN   |
| C-13 | Sesión autenticada del adulto (JWT, US-45) | **Refuerzo (no desviación):** las rutas que manejan datos del guardián/perfil exigen un access token JWT (401 sin él), por lo que dejan de ser anónimas. `@fastify/jwt` es una librería local de utilidades de token: **no añade red externa ni SDKs de terceros** → **no afecta a C-2/C-5**. Sigue siendo **identificación ligera** (sin contraseña, coherente con C-10); el secreto de firma va en variables de entorno (`JWT_SECRET`), nunca en BD ni en el repo. Limitación asumida: refresh **stateless** (sin revocación server-side). Ver [US-45](historias-usuario/epic-f-plataforma.md#us-45)                                                                                                                                                                                                                                                                                                                | Refuerzo / OK                   |
| C-14 | Modo anónimo efímero (US-50)               | **Refuerzo (no desviación):** el "uso libre" sin sesión (Dashboard) genera cuentos/actividades de prueba mediante rutas públicas (`POST /stories/anonymous`, `POST /activities/recommend/anonymous`) que **no persisten nada** (no crean `ChildProfile`, `Story` ni `Activity`; **no tocan el modelo de datos ni Prisma**) y **no reciben ni guardan el nombre del niño**: solo datos mínimos no identificativos (edad, idioma, temas/estilos o categoría). Por tanto **no se crea dato de menor sin consentimiento** (coherente con C-1). El contenido se devuelve y se descarta; el provider es el mismo (mock/local/cloud, con su política C-5). El **rate-limit** (3 cuentos + 3 actividades) usa la IP del cliente **solo en memoria y de forma efímera** (no se persiste; se pierde al reiniciar) para desincentivar el abuso, no como dato de menor. Ver [US-50](historias-usuario/epic-f-plataforma.md#us-50) | Refuerzo / OK                   |

## Notas

- **Tracking ≠ vigilancia.** `InteractionEvent` existe para funciones propias (historial,
  progreso, mejora del producto), nunca para perfilado publicitario. Pseudonimizado por
  `profileId` interno.
- **AuditLog** registra acciones sensibles del **adulto** (alta/edición/borrado de perfil,
  consentimiento), útil para trazabilidad y para acreditar el consentimiento.
- **Modo `cloud` (ON por defecto desde 2026-06-23 — desviación asumida).** Reintroducido el
  2026-06-12 como opt-in y, el **2026-06-23, pasado a ACTIVO por defecto** por decisión del proyecto
  ([ADR 0002](ADR/0002-tres-modos-de-ia.md), [US-14](historias-usuario/epic-f-plataforma.md#us-14)).
  **Rompe C-5** como comportamiento por defecto: es una **desviación consciente** (contexto TFM), no
  el camino conforme. Salvedades documentadas: (a) solo salen **datos minimizados** del perfil (sin
  nombre ni identificadores); (b) **sin la API key del target en env, cae al modo base** (mock/local),
  así que un evaluador sin keys no envía nada a terceros; (c) los **free tiers** (p. ej. Gemini) suelen
  **entrenar con los datos** enviados — para datos reales de menores haría falta un proveedor con DPA y
  garantía de no-entrenamiento; (d) la **categoría Kids de Apple** prohíbe transmitir datos a terceros,
  así que este modo es incompatible con esa categoría. Sigue siendo **conmutable en caliente** (poner
  `ai.cloud.activo=false` en la BD restaura el camino conforme local/mock).
- **Log de prompts de IA a nivel `info` (US-34, 2026-06-23 — desviación asumida).** Para depuración,
  `OllamaProvider`/`CloudProvider` registran el prompt enviado al LLM (y la respuesta) a nivel `info`;
  el prompt **incluye el nombre del niño** (PII), así que queda en los logs por defecto. **Rompe C-5**
  en los logs (no saca datos a un tercero, pero los persiste en consola/ficheros de log). Es una
  decisión consciente para el TFM; en un despliegue real se bajaría a `debug` (off por defecto) o se
  redactaría el nombre. El `MockProvider` no construye prompts, así que en el modo por defecto sin IA
  real no se loguea PII de prompts.
- **Narración con ElevenLabs (US-22, C-11).** Implementada como motor de narración principal por
  decisión del usuario en el contexto del TFM. A diferencia del modo `cloud` del LLM, **no se puede
  minimizar**: para narrar hay que enviar el cuerpo íntegro del cuento, que contiene el nombre del
  niño, a un tercero en la nube. Esto **rompe C-2/C-5** y es **incompatible con la categoría Kids de
  Apple**; además es de pago y, fuera de tier enterprise, ElevenLabs puede registrar/entrenar con el
  texto. Se asume conscientemente y se documenta. Mitigaciones implementadas: la `xi-api-key` vive
  solo en el backend (proxy), y si la síntesis falla la app **degrada a la voz nativa del
  dispositivo** (on-device, sin terceros). Para producción real con datos de menores, el camino
  conforme sería usar **solo** TTS nativo (on-device) o un proveedor con DPA y no-entrenamiento.
- **Monitorización de errores con Sentry (US-40, C-12 — desviación asumida).** `@sentry/react-native`
  envía informes de error/crash a sentry.io (tercero, nube), lo que **rompe C-2** (SDK de tercero) y
  **C-5** y es **incompatible con Apple Kids**. Es una decisión consciente para el TFM, al estilo de
  C-5 (cloud) y C-11 (ElevenLabs). Diferencia clave: está **desactivado por defecto** y solo se activa
  si hay `EXPO_PUBLIC_SENTRY_DSN` en el entorno; **sin DSN no se inicializa** y no sale nada (el modo
  por defecto, el desarrollo y los E2E en `mock` siguen conformes). Mitigaciones cuando está activo:
  `sendDefaultPii: false`; un `beforeSend` que elimina `user`, `request`, `server_name` y el **nombre
  del dispositivo** (que suele incluir el nombre de la persona). **Política de PII (revisada en
  feature 43): proteger al niño, permitir al adulto.** El dato sensible a proteger es la PII del
  **menor**: se registra el **nombre del perfil activo** y el `beforeSend` lo **redacta** (`[child]`)
  de mensajes/excepciones/breadcrumbs —porque los cuentos se generan con el nombre del niño y puede
  colarse en un evento—; los datos del **adulto administrador** (p. ej. su email) **sí** pueden salir,
  como dato de diagnóstico de quien gestiona la cuenta. **No** se usa Session Replay (no se graba la
  sesión del niño) ni `setUser` del niño; y **no** hay performance tracing (solo errores/crashes). Se
  etiqueta `release` (versión del app) para diagnóstico, sin PII. Para producción real con datos de
  menores, el camino conforme sería un reporte de errores _on-device_ o un proveedor con DPA y
  no-entrenamiento. El DSN es una **clave pública de ingesta** (no un secreto). Ver
  [US-40](historias-usuario/epic-f-plataforma.md#us-40) y los planes
  [planes/42-sentry-monitorizacion-errores.md](planes/42-sentry-monitorizacion-errores.md) y
  [planes/43-sentry-release-debug-test.md](planes/43-sentry-release-debug-test.md). **Ampliación
  (US-41/US-42):** un `AppErrorBoundary` con _fallback UI_ propia que **no** usa `showDialog`/feedback
  de Sentry (UI/red de tercero con PII) y **no** muestra `error.message` ni el _component stack_ al
  usuario; y **breadcrumbs** del recorrido (navegación/API/acciones) que transportan **solo
  enums/ids/contadores** —nunca el nombre del niño ni texto libre—, con `beforeBreadcrumb` y
  `scrubEvent` redactando el nombre del niño también en `breadcrumbs[].data` como defensa en
  profundidad. Sin DSN, ambos son no-op. Ver
  [planes/44-observabilidad-errores.md](planes/44-observabilidad-errores.md).
- **Política de conservación (C-9, 2026-06-25 — limitación de conservación, GDPR art. 5.1.e).** Se
  acotan los datos que no son contenido funcional del usuario:
  - **`InteractionEvent` (telemetría de primera parte): 90 días** desde `creadoEn`. Es suficiente para
    métricas de uso recientes; el **historial funcional** (cuentos y actividades) **no** depende de esta
    tabla —vive en el estado de `Story`/`Activity`—, así que purgar eventos antiguos no degrada la
    experiencia. Minimiza la huella de datos del menor (pseudónimo por `profileId`).
  - **`AuditLog`: 365 días** desde `creadoEn` con una excepción: los registros de **consentimiento**
    (`accion = consentimiento`) se conservan **mientras exista la cuenta**, porque acreditan la base
    legal del tratamiento (consentimiento parental verificable, C-1).
  - **Supresión por baja (ya implementada, C-8):** al borrar un `Guardian`/`ChildProfile`, sus
    `InteractionEvent` se borran en **cascada** (`onDelete: Cascade` vía `ChildProfile`); los `AuditLog`
    quedan con `guardianId = null` (`onDelete: SetNull`) para preservar la trazabilidad, sujetos a la
    ventana de 365 días. Esto cubre el **derecho de supresión** a iniciativa del usuario.
  - **Enforcement:** la **purga automática programada** (un job que borre lo más antiguo que la ventana)
    **no** se implementa en el MVP; se documenta como tarea de **Fase 7/producción**. Para el TFM basta
    declarar la política y la supresión por baja, que sí está implementada. Las tablas ya tienen
    `creadoEn`, que es el único dato necesario para una purga por antigüedad futura.
- Estas reglas se revisan en la **Fase 6** (robustez) y se cierran en la **Fase 7**
  (documentación: añadir política de privacidad y data-safety).

## Fuentes

- [Apple — App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple — Design safe and age-appropriate experiences (Kids)](https://developer.apple.com/kids/)
- [Google Play — Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
- [Google Play — Data practices in Families apps](https://support.google.com/googleplay/android-developer/answer/11043825?hl=en)
- [Google Play — Child Safety Standards policy](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en)
- [AEPD — Edad para que los menores presten consentimiento](https://www.aepd.es/preguntas-frecuentes/10-menores-y-educacion/FAQ-1001-cual-es-la-edad-para-que-los-menores-puedan-prestar-consentimiento-para-tratar-sus-datos-personales)
- [LOPDGDD y RGPD — tratamiento de datos de menores (INEAF)](https://www.ineaf.es/tribuna/rgpd-tratamiento-de-datos-de-menores/)
