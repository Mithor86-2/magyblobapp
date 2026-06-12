# Plan — Fase 5.5: Sesión del guardián y multi-perfil

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md) (sección **FASE 5.5**). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Hoy la app solo persiste `guardianId` en AsyncStorage tras el consentimiento (alta). **No** hay
forma de que un guardián que vuelve (o entra en otro dispositivo) recupere su cuenta, ni de elegir
entre varios hijos, ni de cerrar sesión. Esta fase añade una **sesión de guardián** completa,
separando la zona de adultos (tras puerta parental) de la zona infantil.

Qué existe ya (✅):

- ✅ `GuardianRepository.findByEmail` en el dominio (lo usa `RegisterGuardian` para el email único).
- ✅ Caso de uso `ListProfiles` + ruta `GET /guardians/:id/profiles` (backend, Fase 3).
- ✅ Alta `POST /guardians` con consentimiento; `guardianId` persistido en la app (Fase 4).
- ✅ Componente de **puerta parental** en la app (suma aleatoria, app v0.3.1).
- ✅ `AuditLog` escrito en la frontera HTTP (acciones `consentimiento`, `crear`).

Qué falta (❌): login por email, sesión persistida con `guardian` + `activeProfileId`, pantalla de
selección de perfil, onboarding con "Ya tengo cuenta", área parental y cierre de sesión.

### Decisión tomada con el usuario

- **Login ligero por email, sin contraseña ni verificación robusta de edad.** Se identifica al
  guardián por su email (vía `GuardianRepository.findByEmail`). La autenticación robusta queda
  **fuera del alcance del TFM** y se declara como tal (coherente con
  [cumplimiento-menores.md](../cumplimiento-menores.md) y con la limitación anotada en phases.md).
  Esto **diverge de los criterios literales de US-19** ("factor de autenticación", "sesión válida"):
  se ajustará la US-19 para describir el login ligero y dejar la autenticación fuerte como mejora
  futura.

## Historias cubiertas

- **US-19** — Inicio de sesión del adulto ([épica A](../historias-usuario/epic-a-perfil.md#us-19)).
  Se reescriben sus criterios al **login ligero por email** acordado.
- **US-02** — Listar y seleccionar perfiles ([épica A](../historias-usuario/epic-a-perfil.md#us-02)).
  Esta fase materializa la **selección de perfil activo** y la pantalla "Seleccionar perfil".

## Tareas

### F1 — Identificar al guardián (backend) ✅

- [x] ✅ Caso de uso `LoginGuardian` (identifica por email vía `GuardianRepository.findByEmail`,
      ya existente) + DTO de entrada/salida; `NotFoundError` si no hay cuenta con ese email.
- [x] ✅ Ruta `POST /guardians/login` con validación de esquema (email por `pattern`, misma regex
      que la entidad `Guardian`, porque ajv-formats no está cableado) en la entrada.
- [x] ✅ `AuditLog` `accion=login` con el `guardianId` como actor, escrito en la frontera HTTP
      (coherente con cómo se escriben `consentimiento`/`crear`).
- [x] ✅ Tests: caso de uso `LoginGuardian` (dobles in-memory, éxito + `NotFoundError`) +
      test de integración de la ruta (`app.inject`: 200 con guardián, 404 email inexistente,
      400 email inválido). `pnpm check` verde (97 tests backend).

### F2 — Sesión y selección de perfil activo (app) ✅

- [x] ✅ Store: sesión persistida ampliada — guarda el `guardian` completo (no solo el id) y el
      `currentProfile` activo (sobrevive a reinicios), más `consentVersion`; nuevas acciones
      `clearProfile` y `logout`. Migración de persistencia a v1 (descarta el estado v0).
- [x] ✅ Gateways `profiles.list` (`GET /guardians/:id/profiles`) y `guardians.login`
      (`POST /guardians/login`) en `infrastructure/http`.
- [x] ✅ Pantalla **Seleccionar perfil** (lista de hijos con avatar+nombre+edad + "crear nuevo");
      fija el `currentProfile`. Estados de carga/error/reintento.
- [x] ✅ Onboarding revisado: pantalla **Bienvenida** (crear cuenta / "Ya tengo cuenta" → **Login**
      por email); con sesión → selección de perfil → pestañas. Ruta inicial calculada en `App.tsx`.
- [x] ✅ Tests del gateway (contrato de cable) de `login` y `list`. `pnpm check` verde (11 tests
      app + 99 backend) y bundle validado (`expo export`).

### F3 — Área parental y cierre de sesión (app)

- [ ] ❌ Zona de adultos protegida por la **puerta parental** (componente existente) para gestión
      de cuenta/perfiles, separada de la zona infantil.
- [ ] ❌ Acción **Cerrar sesión / cambiar guardián** (reset del store → vuelve al onboarding,
      borra `guardian`/`activeProfileId` de AsyncStorage).

### Cierre

- [ ] ❌ Actualizar US-19 (login ligero) y US-02 (selección de perfil) + tabla de trazabilidad.
- [ ] ❌ Actualizar [../phases.md](../phases.md) (FASE 5.5) y [../memory.md](../memory.md) (decisión
      del login ligero).
- [ ] ❌ Docs + cierre con la skill **cerrar-feature** (gate `pnpm check`, versión SemVer,
      CHANGELOG por paquete, merge tras confirmación del usuario y pruebas).

## DoD (de phases.md)

Un guardián puede registrarse, salir y volver a entrar por email recuperando su sesión; elegir
entre sus hijos; acceder a la zona de adultos solo tras la puerta parental; y cerrar sesión.
`pnpm check` verde + bundle (`expo export`) + e2e del login contra PostgreSQL.
