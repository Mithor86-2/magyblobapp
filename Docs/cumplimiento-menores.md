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

| #    | Requisito                                 | Cómo lo cumple el proyecto                                                                                                                                                                                                                                                                                                                                                                           | Estado                           |
| ---- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| C-1  | Consentimiento parental verificable       | Entidad `Guardian` + registro de consentimiento (`consentimientoEn`, versión); alta del niño solo dentro de una cuenta de adulto                                                                                                                                                                                                                                                                     | Diseño                           |
| C-2  | Sin analítica/publicidad de terceros      | Tracking **de primera parte** en tabla propia (`InteractionEvent`); **cero SDKs** de analítica/ads de terceros                                                                                                                                                                                                                                                                                       | Diseño                           |
| C-3  | Sin transmitir identificadores de menores | No se usa Advertising ID; los eventos referencian `profileId` interno (pseudónimo), no identificadores de dispositivo                                                                                                                                                                                                                                                                                | Diseño                           |
| C-4  | Minimización de datos                     | Del adulto solo lo necesario (nombre, apellidos, email, parentesco); del niño: nombre, edad, idioma, avatar, intereses                                                                                                                                                                                                                                                                               | Diseño                           |
| C-5  | Privacidad por diseño / datos no salen    | **Por defecto** LLM **local** (Ollama/Gemma) o mock: los datos no salen de la máquina. El modo `cloud` es **opt-in, OFF por defecto** (lo activa un adulto; queda en `AuditLog`); al activarlo salen **datos minimizados** (edad, intereses, idioma; nunca nombre ni identificadores) a un tercero ([ADR 0002](ADR/0002-tres-modos-de-ia.md), [US-14](historias-usuario/epic-f-plataforma.md#us-14)) | ✔ por defecto / Cond. en `cloud` |
| C-6  | Parental gate (zona de adultos)           | Configuración y gestión de perfiles tras una puerta parental; UI infantil sin enlaces externos ni compras                                                                                                                                                                                                                                                                                            | Diseño                           |
| C-7  | Política de privacidad + lenguaje claro   | Documento de privacidad; textos al niño en lenguaje sencillo (coherente con el design system)                                                                                                                                                                                                                                                                                                        | Pend.                            |
| C-8  | Derechos GDPR (acceso, borrado)           | Borrado de `Guardian` en cascada con sus `ChildProfile`, cuentos, actividades y eventos (US-13)                                                                                                                                                                                                                                                                                                      | Diseño                           |
| C-9  | Limitación de conservación                | Retención acotada de `InteractionEvent`/`AuditLog`; documentar política de purga                                                                                                                                                                                                                                                                                                                     | Pend.                            |
| C-10 | Verificación robusta de edad del adulto   | **Limitación reconocida:** se usa puerta parental + email; la verificación fuerte de edad queda fuera del alcance del TFM y se declara                                                                                                                                                                                                                                                               | Limit.                           |

## Notas

- **Tracking ≠ vigilancia.** `InteractionEvent` existe para funciones propias (historial,
  progreso, mejora del producto), nunca para perfilado publicitario. Pseudonimizado por
  `profileId` interno.
- **AuditLog** registra acciones sensibles del **adulto** (alta/edición/borrado de perfil,
  consentimiento), útil para trazabilidad y para acreditar el consentimiento.
- **Modo `cloud` (opt-in, OFF por defecto).** Reintroducido el 2026-06-12 ([ADR 0002](ADR/0002-tres-modos-de-ia.md),
  [US-14](historias-usuario/epic-f-plataforma.md#us-14)). No es el camino conforme por defecto: lo
  activa explícitamente un adulto y rompe C-5. Salvedades documentadas: (a) solo salen **datos
  minimizados** del perfil (sin nombre ni identificadores); (b) los **free tiers** (p. ej. Gemini)
  suelen **entrenar con los datos** enviados — para datos reales de menores haría falta un proveedor
  con DPA y garantía de no-entrenamiento; (c) la **categoría Kids de Apple** prohíbe transmitir datos
  a terceros, así que este modo es incompatible con esa categoría y se documenta como tal. Es una
  función de iteración/calidad, no el modo recomendado para producción con datos reales.
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
