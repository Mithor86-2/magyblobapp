# Plan — Feature 48: JWT para la sesión del usuario (US-45)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Rama: `feature/48-jwt-sesion` (desde `develop`). Historia: **US-45** (épica F, plataforma).

## Contexto

Qué existe ya (✅):

- ✅ **Login ligero por email** sin contraseña: caso de uso `LoginGuardian`
  ([application/use-cases/LoginGuardian.ts](../../packages/backend/src/application/use-cases/LoginGuardian.ts))
  - ruta `POST /guardians/login` ([routes/guardians.ts](../../packages/backend/src/routes/guardians.ts))
    que **devuelve el `Guardian` completo** y publica `guardian_login` en el bus.
- ✅ **Config centralizada** por env en [config.ts](../../packages/backend/src/config.ts) (`loadConfig`).
- ✅ **Rutas Fastify con Zod** (`fastify-type-provider-zod`) y validación en frontera (US-44).
- ✅ **Sesión en la app**: store Zustand persistido ([useAppStore.ts](../../packages/app/src/presentation/store/useAppStore.ts))
  guarda `guardian` + `currentProfile`; adaptador HTTP único
  ([infrastructure/http.ts](../../packages/app/src/infrastructure/http.ts)) con timeouts (US-43) y
  validación Zod de respuestas (US-44).

Qué falta (❌):

- ❌ **No hay autenticación**: cualquiera puede llamar a los endpoints; el login no emite credencial.
- ❌ La app **no envía** ninguna credencial en sus peticiones.

### Decisiones tomadas (con el usuario, 2026-06-25)

- **Alcance:** el login por email **emite un access JWT corto + refresh token**; el backend
  **protege rutas con `@fastify/jwt`**; la app guarda los tokens y envía `Authorization: Bearer`.
- **Sin contraseña** (NO se toca el modelo de datos): se conserva la **"identificación ligera"**
  declarada en [cumplimiento-menores.md](../cumplimiento-menores.md); JWT solo añade gestión de
  sesión/credencial sobre el login existente, no un factor de autenticación nuevo.
- **Refresh stateless (YAGNI):** el refresh token es un JWT firmado de vida larga, **sin tabla en
  BD**. El "logout" es de cliente (descartar tokens). La **revocación server-side queda fuera de
  alcance** (se documenta).
- **Un único secreto + claim `type` (decisión de implementación, revisada del plan inicial):** en
  vez de dos secretos/namespaces de `@fastify/jwt`, se usa **un secreto** y se distingue access vs
  refresh por el claim `type` del payload. Motivo: la augmentación de tipos del patrón namespaced es
  frágil para el gate de TypeScript; el secreto único cumple todos los criterios funcionales de
  US-45 y es más simple (YAGNI). Misma seguridad efectiva para el alcance del TFM.
- **Auto-login en el alta:** `POST /guardians` (registro) también emite la sesión, para que el flujo
  de onboarding (alta → crear/seleccionar perfil, rutas ya protegidas) no exija un login extra.
- **Transporte de tokens:** la app es **React Native/Expo (no navegador)** → los tokens viajan en el
  **cuerpo JSON** de la respuesta y se persisten en el store (AsyncStorage), no en cookie httpOnly.
- **Librería:** [`@fastify/jwt`](https://github.com/fastify/fastify-jwt) v10 (registro con `secret`,
  `reply.jwtSign`/`request.jwtVerify`, aumento de tipos `FastifyJWT`).
- **Secretos en env**, nunca en BD ni en el repo (coherente con US-18).

## Historias cubiertas

- **US-45 — Sesión autenticada del adulto con JWT** ([épica F](../historias-usuario/epic-f-plataforma.md#us-45))

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha. Cada fase incluye **crear test → ejecutar test
(`pnpm check` verde) → actualizar docs** según la regla del DoD.

### Fase 0 — Andamiaje (deps, secretos, config) ✅

- [x] ✅ Añadir `@fastify/jwt` (v10) a `packages/backend`.
- [x] ✅ Extender [config.ts](../../packages/backend/src/config.ts) con `auth`: `secret`, `accessTtl`
      (def. `15m`), `refreshTtl` (def. `7d`), leídos de env (`JWT_SECRET`/`JWT_ACCESS_TTL`/
      `JWT_REFRESH_TTL`) con defaults **solo de desarrollo**.
- [x] ✅ `.env.example` + `docker-compose.yml`: variables `JWT_SECRET` (+ TTLs) documentadas; sin
      secreto real versionado.
- [x] ✅ **Test:** `config.test.ts` cubre el parseo (default vs. override + secreto en blanco).
- [x] ✅ **Ejecutar test** (`pnpm check` verde) + `auth.ts` 100% cobertura.
- [x] ✅ **Docs:** `CHANGELOG` backend (`Added`/`Security`).

### Fase 1 — Emisión de tokens en el login (backend) ✅

- [x] ✅ Registrar `@fastify/jwt` (módulo [auth.ts](../../packages/backend/src/auth.ts)) con secreto
      único y `expiresIn` del access; aumento de tipos `FastifyJWT` (payload `{ guardianId, email,
type }`). Helper `signSession` firma access + refresh (refresh con TTL propio).
- [x] ✅ `POST /guardians/login` (y `POST /guardians`, auto-login) devuelven el `Guardian` +
      `{ accessToken, refreshToken }`. Se mantiene `guardian_login`/`guardian_registrado` en el bus.
- [x] ✅ Nueva ruta `POST /guardians/refresh`: valida el refresh token (claim `type=refresh`) y emite
      un par nuevo; 401 ante token inválido/expirado o de tipo incorrecto. Entrada validada con Zod.
- [x] ✅ **Test:** `test/routes/auth.test.ts` — login emite tokens; refresh 200/401; tipos cruzados.
- [x] ✅ **Ejecutar test** (`pnpm check` verde).
- [x] ✅ **Docs:** `CHANGELOG` backend.

### Fase 2 — Protección de rutas (backend) ✅

- [x] ✅ Decorador `authenticate` (hook `onRequest`) que verifica el access token y lanza
      `UnauthorizedError` → 401 uniforme por el manejo de errores centralizado.
- [x] ✅ Aplicado a `GET /guardians/:id/profiles`, `POST /profiles`, `POST /stories`,
      `POST /stories/:id/read`, `GET /stories/:id/narration`, `POST /activities/recommend`,
      `POST /activities/:id/complete`, `GET /profiles/:id/history`. **Públicas:** `GET /health`,
      `POST /guardians`, `POST /guardians/login`, `POST /guardians/refresh`.
- [x] ✅ (Coherencia) **Diferido y documentado:** no se verifica que `guardianId`/`profileId` de la
      ruta sean del token (solo se exige token válido). Fuera de alcance del TFM (un guardián
      autenticado no obtiene datos cruzados por la UI; mejora futura).
- [x] ✅ **Test:** auth.test.ts (401 sin token / 200 con token); los tests de rutas existentes
      adjuntan un token vía helper `authHeaders(app)`.
- [x] ✅ **Ejecutar test** (`pnpm check` verde, 203 tests backend).
- [x] ✅ **Docs:** `CHANGELOG` backend (`Security`).

### Fase 3 — Sesión autenticada en la app ✅

- [x] ✅ Store: persiste `accessToken` + `refreshToken`; `setSession` (alta/login), `setTokens`
      (renovación); `logout` los limpia; migración de persistencia a **v2** (descarta sesión previa).
- [x] ✅ `http.ts`: puerto `SessionStore`; adjunta `Authorization: Bearer` en rutas protegidas; ante
      **401** renueva con el refresh (`POST /guardians/refresh`) y reintenta una vez; si falla →
      `onAuthExpired()` (logout). La narración adjunta el Bearer y degrada a voz nativa ante 401.
- [x] ✅ Gateways: `login`/`register` devuelven `GuardianSession`; nuevo `guardians.refresh`. Sesión
      cableada en el composition root sobre el store, sin acoplar pantallas.
- [x] ✅ **Test:** `useAppStore.test.ts` (tokens) y `http.test.ts` (Authorization, 401→refresh→
      reintento, refresh fallido→logout, sin sesión). `http.ts` 100% cobertura.
- [x] ✅ **Ejecutar test** (`pnpm check` verde, 98 tests app).
- [x] ✅ **Docs:** `CHANGELOG` app (`Added`/`Changed`/`Security`).

### Fase 4 — Documentación y cierre 🔄

- [x] ✅ **US-45** en [epic-f-plataforma.md](../historias-usuario/epic-f-plataforma.md) con criterios
      Gherkin + fila en la trazabilidad y la cabecera del [índice](../historias-usuario/README.md).
- [x] ✅ [cumplimiento-menores.md](../cumplimiento-menores.md): JWT **no** introduce terceros ni red
      externa (no afecta C-2/C-5); identificación ligera intacta; secretos en env; revocación
      stateless documentada como limitación asumida.
- [x] ✅ [phases.md](../phases.md): feature reflejada en la Fase 6.
- [ ] 🔄 Cierre con la skill **`cerrar-feature`**: gate verde ✅, versión SemVer, mover `CHANGELOG` a
      versión fechada, **pruebas con el usuario**, y `finish` **tras confirmación**.

## Verificación (DoD)

- `pnpm check` verde (typecheck + lint + format + tests) tras cada fase.
- Tests nuevos: emisión de tokens, refresh (200/401), rutas protegidas (401 sin token), store y
  `http.ts` (Authorization + refresh-on-401).
- `docker compose up` sigue levantando la pila (con secretos de desarrollo por defecto).
- Pruebas con el usuario antes del cierre.
