# API HTTP — magyblobapp backend

Referencia de los endpoints expuestos por el backend (Fastify). Base URL por
defecto: **`http://localhost:3000`**.

- Formato de entrada/salida: **JSON** (`Content-Type: application/json`).
- Errores: cuerpo uniforme `{ "error": { "tipo": "...", "mensaje": "..." } }`.
- Idioma de la app: bilingüe **ES/EN**; el cuento se genera en el idioma del perfil.

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
| `404`  | Recurso no encontrado (`NotFoundError`)                        |
| `409`  | Conflicto, p. ej. email ya registrado (`ConflictError`)        |
| `500`  | Error inesperado (se registra en el log; sin filtrar detalles) |

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

## `POST /guardians`

Da de alta al **adulto responsable** y registra su consentimiento. Escribe un
`AuditLog` de tipo `consentimiento`.

**Body**

| Campo                    | Tipo    | Req. | Notas                                |
| ------------------------ | ------- | ---- | ------------------------------------ |
| `nombre`                 | string  | sí   | no vacío                             |
| `apellidos`              | string  | sí   | no vacío                             |
| `email`                  | string  | sí   | único; base de la cuenta             |
| `parentesco`             | string  | sí   | vocabulario `parentesco`             |
| `telefono`               | string  | no   |                                      |
| `consentimientoAceptado` | boolean | sí   | debe ser `true` o se rechaza (`400`) |
| `consentimientoVersion`  | string  | sí   | versión de los términos aceptados    |

**Ejemplo**

```bash
curl -X POST http://localhost:3000/guardians \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ana",
    "apellidos": "García",
    "email": "ana@example.com",
    "parentesco": "madre",
    "consentimientoAceptado": true,
    "consentimientoVersion": "v1"
  }'
```

**Respuesta `201`**

```json
{
  "id": "b3eca48e-d77f-4869-951b-92dbce221c11",
  "nombre": "Ana",
  "apellidos": "García",
  "email": "ana@example.com",
  "parentesco": "madre",
  "consentimientoDado": true
}
```

**Errores:** `400` sin consentimiento o datos inválidos · `409` email ya registrado.

---

## `GET /guardians/:guardianId/profiles`

Lista los perfiles de niño que tutela un adulto (soporte multi-niño).

```bash
curl http://localhost:3000/guardians/b3eca48e-d77f-4869-951b-92dbce221c11/profiles
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

## `POST /profiles`

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

## `POST /stories`

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
  "estado": "nuevo"
}
```

**Errores:** `404` el perfil no existe · `400` tema o estilo fuera del vocabulario.

> **Modo de IA:** con `AI_PROVIDER=mock` (por defecto) el cuento es determinista y no
> requiere GPU. Con `AI_PROVIDER=local` se genera con Ollama (`gemma:2b`); si Ollama no
> responde, cae automáticamente al mock (la petición nunca falla por la IA).

---

## `POST /activities/recommend`

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
    "nivel": 1
  }
]
```

**Errores:** `404` el perfil no existe · `400` categoría fuera del vocabulario o cantidad
fuera de rango. (El dedup puede devolver menos elementos de los pedidos, o `[]` si todos
existían ya.)

---

## `POST /activities/:id/complete`

Registra que una actividad se completó con una valoración de 1 a 3 estrellas (US-10).
Escribe un `InteractionEvent` de tipo `actividad_completada`.

**Body:** `{ "valoracion": 1|2|3 }`. **Respuesta `200`:** la actividad con `valoracion` y
`completadaEn`. **Errores:** `404` la actividad no existe · `400` valoración fuera de 1-3.

---

## `POST /stories/:id/read`

Marca un cuento como leído (US-07). Idempotente.

**Respuesta `200`:** el cuento con `estado: "leido"`. **Errores:** `404` el cuento no existe.

---

## `GET /profiles/:profileId/history`

Devuelve el historial del perfil: sus cuentos y actividades, cada lista por fecha desc (US-08).

**Respuesta `200`:** `{ "stories": StoryOutput[], "activities": ActivityOutput[] }`.

---

## Ejemplo de flujo completo (bash)

Encadena las tres llamadas extrayendo los ids con [`jq`](https://jqlang.github.io/jq/):

```bash
BASE=http://localhost:3000

GID=$(curl -s -X POST $BASE/guardians -H "Content-Type: application/json" -d '{
  "nombre":"Ana","apellidos":"García","email":"ana@example.com",
  "parentesco":"madre","consentimientoAceptado":true,"consentimientoVersion":"v1"
}' | jq -r .id)

PID=$(curl -s -X POST $BASE/profiles -H "Content-Type: application/json" -d "{
  \"guardianId\":\"$GID\",\"nombre\":\"Mateo\",\"edad\":4,\"idioma\":\"es\",
  \"avatar\":\"a1\",\"intereses\":[\"animales\"]
}" | jq -r .id)

curl -s -X POST $BASE/stories -H "Content-Type: application/json" -d "{
  \"profileId\":\"$PID\",\"tema\":\"animales\",\"estilo\":\"aventura\"
}" | jq
```
