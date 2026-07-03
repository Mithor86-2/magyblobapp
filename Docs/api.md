# API HTTP — magyblobapp backend

Referencia de los endpoints expuestos por el backend (Fastify). Base URL por
defecto: **`http://localhost:3000`**.

- Formato de entrada/salida: **JSON** (`Content-Type: application/json`).
- Errores: cuerpo uniforme `{ "error": { "tipo": "...", "mensaje": "..." } }`.
- Idioma de la app: bilingüe **ES/EN**; el cuento se genera en el idioma del perfil.
- **Autenticación (JWT, US-45):** las rutas de datos exigen un **access token** en la cabecera
  `Authorization: Bearer <token>` (ver [Autenticación](#autenticación-jwt)).

> Flujo típico (vertical slice): **alta de adulto → crear perfil → generar cuento**.
> El alta del adulto con consentimiento es obligatoria antes de crear perfiles
> (la app es para menores de 2–6 años; ver [cumplimiento-menores.md](cumplimiento-menores.md)).

## Vocabularios cerrados

Validados en la entrada (un valor fuera de la lista devuelve `400`):

| Campo                  | Valores admitidos                                         |
| ---------------------- | --------------------------------------------------------- |
| `parentesco`           | `madre` · `padre` · `tutor_legal` · `abuelo_a` · `otro`   |
| `tema` / `intereses[]` | `animales` · `espacio` · `magia` · `aventuras` · `musica` |
| `estilo`               | `aventura` · `divertido` · `educativo`                    |
| `idioma`               | `es` · `en` (por defecto `es`)                            |
| `edad`                 | entero **2–6**                                            |

## Códigos de estado

| Código | Significado                                                    |
| ------ | -------------------------------------------------------------- |
| `200`  | OK (consultas)                                                 |
| `201`  | Recurso creado                                                 |
| `400`  | Datos inválidos (regla de dominio o validación de esquema)     |
| `401`  | No autorizado: falta el access token o es inválido/expirado    |
| `404`  | Recurso no encontrado (`NotFoundError`)                        |
| `409`  | Conflicto, p. ej. email ya registrado (`ConflictError`)        |
| `500`  | Error inesperado (se registra en el log; sin filtrar detalles) |

---

## Autenticación (JWT)

La sesión del adulto se autentica con **JSON Web Tokens** (US-45). El alta (`POST /guardians`) y el
login (`POST /guardians/login`) **emiten** un par de tokens:

- **`accessToken`** — vida corta (def. `15m`), se envía en cada petición a una ruta protegida como
  `Authorization: Bearer <accessToken>`.
- **`refreshToken`** — vida larga (def. `7d`), sirve para obtener un access nuevo en
  `POST /guardians/refresh` sin volver a iniciar sesión.

Es una **identificación ligera** (sin contraseña; ver [cumplimiento-menores.md](cumplimiento-menores.md),
C-13). El secreto de firma va en la variable de entorno `JWT_SECRET` (nunca en BD). El refresh es
_stateless_: no hay revocación en servidor; el "logout" lo hace el cliente descartando los tokens.

| Rutas                                                                                                            | Auth                                  |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `GET /health`, `GET /guardians/challenge`, `POST /guardians`, `POST /guardians/login`, `POST /guardians/refresh` | **Públicas**                          |
| Resto (`/profiles`, `/stories…`, `/activities…`, `/guardians/:id/profiles`, `/profiles/:id/history`)             | **Requieren** `Authorization: Bearer` |

Una ruta protegida sin token o con un token inválido/expirado responde **`401`** con el cuerpo de
error uniforme (`{ "error": { "tipo": "UnauthorizedError", ... } }`).

### Endurecimiento del API (US-92)

- **Rate limiting** en los endpoints de autenticación (`POST /guardians`, `POST /guardians/login`,
  `POST /guardians/refresh` y `GET /guardians/challenge`): al superar el umbral por IP responden
  **`429`** con el cuerpo de error uniforme (`tipo: "TooManyRequestsError"`). Límites configurables
  por env (`RATE_LIMIT_*`); tras el proxy de Render la IP real se deriva con `TRUST_PROXY`.
- **Puerta parental** en el alta: `POST /guardians` exige un reto resuelto (ver
  `GET /guardians/challenge`).
- **Cabeceras de seguridad** (`@fastify/helmet`) en todas las respuestas y **CORS** con allowlist
  (`CORS_ORIGINS`; sin lista se deniega cualquier origen cross-site en producción).

---

## `GET /health`

Estado del servicio (usado por el healthcheck de Docker).

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "service": "magyblob-backend" }
```

---

## `GET /guardians/challenge`

Emite un **reto de puerta parental** (US-92) que hay que resolver para dar de alta una cuenta.
**Pública** y **sin estado** (no toca BD): el `challengeToken` va firmado (HMAC) y caduca.

```bash
curl http://localhost:3000/guardians/challenge
```

**Respuesta `200`**

```json
{ "pregunta": "¿Cuánto es 7 + 5?", "challengeToken": "1783095530000.Xb3…" }
```

El cliente calcula la respuesta a la `pregunta` y la envía como `challengeRespuesta` junto con
`challengeToken` en `POST /guardians`. El token caduca (def. 5 min, `PARENTAL_CHALLENGE_TTL_MS`).

---

## `POST /guardians`

Da de alta al **adulto responsable** y registra su consentimiento. Escribe un
`AuditLog` de tipo `consentimiento`. **Pública** y con **auto-login**: además del
guardián, devuelve la sesión JWT (`accessToken` + `refreshToken`) para no exigir un
login extra en el onboarding. Exige superar la **puerta parental** (US-92).

**Body**

| Campo                    | Tipo    | Req. | Notas                                            |
| ------------------------ | ------- | ---- | ------------------------------------------------ |
| `nombre`                 | string  | sí   | no vacío                                         |
| `apellidos`              | string  | sí   | no vacío                                         |
| `email`                  | string  | sí   | único; base de la cuenta                         |
| `parentesco`             | string  | sí   | vocabulario `parentesco`                         |
| `telefono`               | string  | no   |                                                  |
| `password`               | string  | sí   | ≥8 con al menos una letra y un número (US-48/53) |
| `consentimientoAceptado` | boolean | sí   | debe ser `true` o se rechaza (`400`)             |
| `consentimientoVersion`  | string  | sí   | versión de los términos aceptados                |
| `challengeToken`         | string  | sí   | token de `GET /guardians/challenge` (US-92)      |
| `challengeRespuesta`     | number  | sí   | respuesta al reto; incorrecta/caducada → `400`   |

**Ejemplo**

```bash
curl -X POST http://localhost:3000/guardians \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ana",
    "apellidos": "García",
    "email": "ana@example.com",
    "parentesco": "madre",
    "password": "abcd1234",
    "consentimientoAceptado": true,
    "consentimientoVersion": "v1",
    "challengeToken": "1783095530000.Xb3…",
    "challengeRespuesta": 12
  }'
```

**Respuesta `201`** — el guardián + la sesión JWT:

```json
{
  "id": "b3eca48e-d77f-4869-951b-92dbce221c11",
  "nombre": "Ana",
  "apellidos": "García",
  "email": "ana@example.com",
  "parentesco": "madre",
  "consentimientoDado": true,
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

**Errores:** `400` sin consentimiento, datos inválidos o **reto parental no superado** · `409` email
ya registrado · `429` demasiadas peticiones.

> El email se **normaliza** (recorte + minúsculas) antes de guardarse, de modo que la unicidad y el
> login posterior casan aunque se teclee con mayúsculas o espacios.

---

## `POST /guardians/login`

Inicia sesión del **adulto** identificándolo por su email (login ligero, **sin contraseña**: la
autenticación robusta queda fuera del alcance del TFM). Escribe un `AuditLog` de tipo `login`.

**Body**

| Campo   | Tipo   | Req. | Notas                                      |
| ------- | ------ | ---- | ------------------------------------------ |
| `email` | string | sí   | formato de email; se normaliza para buscar |

**Ejemplo**

```bash
curl -X POST http://localhost:3000/guardians/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "ana@example.com" }'
```

**Respuesta `200`** — la cuenta del adulto + la sesión JWT (mismas claves que `POST /guardians`):

```json
{
  "id": "b3eca48e-d77f-4869-951b-92dbce221c11",
  "nombre": "Ana",
  "apellidos": "García",
  "email": "ana@example.com",
  "parentesco": "madre",
  "consentimientoDado": true,
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

**Errores:** `400` email con formato inválido · `404` no hay cuenta con ese email.

---

## `POST /guardians/refresh`

Renueva la sesión a partir de un **refresh token** válido (US-45). **Pública** (no requiere access
token). El refresh viaja en el cuerpo (la app es React Native/Expo, no usa cookies).

**Body**

| Campo          | Tipo   | Req. | Notas                          |
| -------------- | ------ | ---- | ------------------------------ |
| `refreshToken` | string | sí   | el `refreshToken` de la sesión |

```bash
curl -X POST http://localhost:3000/guardians/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "eyJhbGciOi..." }'
```

**Respuesta `200`** — un par de tokens nuevo:

```json
{ "accessToken": "eyJhbGciOi...", "refreshToken": "eyJhbGciOi..." }
```

**Errores:** `401` el refresh token es inválido, ha expirado o no es de tipo refresh · `400` body inválido.

---

## `GET /guardians/:guardianId/profiles` 🔒

Lista los perfiles de niño que tutela un adulto (soporte multi-niño). **Requiere** `Authorization: Bearer`.

```bash
curl http://localhost:3000/guardians/b3eca48e-d77f-4869-951b-92dbce221c11/profiles \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Respuesta `200`** — array de perfiles (ver forma en `POST /profiles`):

```json
[
  {
    "id": "b9a5faf1-d90e-48dc-a400-92194886c398",
    "guardianId": "b3eca48e-d77f-4869-951b-92dbce221c11",
    "nombre": "Mateo",
    "edad": 4,
    "idioma": "es",
    "avatar": "a1",
    "intereses": ["animales", "espacio"]
  }
]
```

---

## `POST /profiles` 🔒

Crea el perfil de un niño asociado a un adulto que **ya ha consentido**. Escribe
un `AuditLog` de tipo `crear`.

**Body**

| Campo        | Tipo     | Req. | Notas                                |
| ------------ | -------- | ---- | ------------------------------------ |
| `guardianId` | string   | sí   | id de un `Guardian` existente        |
| `nombre`     | string   | sí   | no vacío                             |
| `edad`       | integer  | sí   | 2–6                                  |
| `idioma`     | string   | no   | `es` \| `en` (por defecto `es`)      |
| `avatar`     | string   | sí   | id de avatar preset                  |
| `intereses`  | string[] | sí   | ≥1 valor del vocabulario de temática |

**Ejemplo**

```bash
curl -X POST http://localhost:3000/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "guardianId": "b3eca48e-d77f-4869-951b-92dbce221c11",
    "nombre": "Mateo",
    "edad": 4,
    "idioma": "es",
    "avatar": "a1",
    "intereses": ["animales", "espacio"]
  }'
```

**Respuesta `201`**

```json
{
  "id": "b9a5faf1-d90e-48dc-a400-92194886c398",
  "guardianId": "b3eca48e-d77f-4869-951b-92dbce221c11",
  "nombre": "Mateo",
  "edad": 4,
  "idioma": "es",
  "avatar": "a1",
  "intereses": ["animales", "espacio"]
}
```

**Errores:** `404` el adulto no existe · `400` adulto sin consentimiento, edad fuera
de rango o interés inválido.

---

## `POST /stories` 🔒

Genera (vía `AIProvider`) y **persiste** un cuento para un perfil, en el idioma del
perfil. Escribe un `InteractionEvent` de tipo `cuento_generado`.

**Body**

| Campo       | Tipo   | Req. | Notas                   |
| ----------- | ------ | ---- | ----------------------- |
| `profileId` | string | sí   | id de un `ChildProfile` |
| `tema`      | string | sí   | vocabulario de temática |
| `estilo`    | string | sí   | vocabulario de estilo   |

**Ejemplo**

```bash
curl -X POST http://localhost:3000/stories \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "b9a5faf1-d90e-48dc-a400-92194886c398",
    "tema": "animales",
    "estilo": "aventura"
  }'
```

**Respuesta `201`**

```json
{
  "id": "5f0e...e1",
  "profileId": "b9a5faf1-d90e-48dc-a400-92194886c398",
  "tema": "animales",
  "estilo": "aventura",
  "titulo": "Mateo y la aventura de animales",
  "cuerpo": "Había una vez Mateo, que soñaba con animales. ...",
  "idioma": "es",
  "estado": "nuevo",
  "proveedor": "local"
}
```

> `proveedor` es la IA que **realmente** generó el cuento (`mock` | `local` | `cloud`); ante un
> fallo del proveedor activo se cae a `mock` y se persiste `mock`.

**Errores:** `404` el perfil no existe · `400` tema o estilo fuera del vocabulario.

> **Modo de IA:** con `AI_PROVIDER=mock` (por defecto) el cuento es determinista y no
> requiere GPU. Con `AI_PROVIDER=local` se genera con Ollama (`gemma:2b`); si Ollama no
> responde, cae automáticamente al mock (la petición nunca falla por la IA).

---

## `POST /activities/recommend` 🔒

Recomienda (vía `AIProvider`) y **persiste** actividades para un perfil. Aplica un dedup
simple por título: no devuelve actividades cuyo título ya exista para ese perfil.

**Body**

| Campo       | Tipo    | Req. | Notas                                          |
| ----------- | ------- | ---- | ---------------------------------------------- |
| `profileId` | string  | sí   | id de un `ChildProfile`                        |
| `categoria` | string  | no   | acota a una categoría (`arte\|musica\|logica`) |
| `cantidad`  | integer | no   | cuántas generar, 1-5 (por defecto 3)           |

**Ejemplo**

```bash
curl -X POST http://localhost:3000/activities/recommend \
  -H "Content-Type: application/json" \
  -d '{ "profileId": "b9a5faf1-d90e-48dc-a400-92194886c398", "cantidad": 3 }'
```

**Respuesta `201`** — array de actividades:

```json
[
  {
    "id": "3971...d9",
    "profileId": "b9a5faf1-d90e-48dc-a400-92194886c398",
    "categoria": "arte",
    "titulo": "Actividad de arte nº 1",
    "descripcion": "Una propuesta sencilla de arte para jugar y aprender en casa.",
    "duracionMin": 10,
    "nivel": 1,
    "proveedor": "local"
  }
]
```

**Errores:** `404` el perfil no existe · `400` categoría fuera del vocabulario o cantidad
fuera de rango. (El dedup puede devolver menos elementos de los pedidos, o `[]` si todos
existían ya.)

---

## `POST /activities/:id/complete` 🔒

Registra que una actividad se completó con una valoración de 1 a 3 estrellas (US-10).
Escribe un `InteractionEvent` de tipo `actividad_completada`.

**Body:** `{ "valoracion": 1|2|3 }`. **Respuesta `200`:** la actividad con `valoracion` y
`completadaEn`. **Errores:** `404` la actividad no existe · `400` valoración fuera de 1-3.

---

## `POST /stories/:id/read` 🔒

Marca un cuento como leído (US-07). Idempotente.

**Respuesta `200`:** el cuento con `estado: "leido"`. **Errores:** `404` el cuento no existe.

---

## `GET /profiles/:profileId/history` 🔒

Devuelve el historial del perfil: sus cuentos y actividades, cada lista por fecha desc (US-08).

**Respuesta `200`:** `{ "stories": StoryOutput[], "activities": ActivityOutput[] }`.

---

## Ejemplo de flujo completo (bash)

Encadena las tres llamadas extrayendo los ids con [`jq`](https://jqlang.github.io/jq/):

El alta devuelve el `accessToken`, que se adjunta como `Authorization: Bearer` en las rutas protegidas:

```bash
BASE=http://localhost:3000

# Alta (pública): captura id + accessToken de la sesión
ALTA=$(curl -s -X POST $BASE/guardians -H "Content-Type: application/json" -d '{
  "nombre":"Ana","apellidos":"García","email":"ana@example.com",
  "parentesco":"madre","consentimientoAceptado":true,"consentimientoVersion":"v1"
}')
GID=$(echo "$ALTA" | jq -r .id)
TOKEN=$(echo "$ALTA" | jq -r .accessToken)

# Crear perfil (protegida): requiere el Bearer
PID=$(curl -s -X POST $BASE/profiles \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{
  \"guardianId\":\"$GID\",\"nombre\":\"Mateo\",\"edad\":4,\"idioma\":\"es\",
  \"avatar\":\"a1\",\"intereses\":[\"animales\"]
}" | jq -r .id)

# Generar cuento (protegida)
curl -s -X POST $BASE/stories \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{
  \"profileId\":\"$PID\",\"tema\":\"animales\",\"estilo\":\"aventura\"
}" | jq
```
