# Plan — Feature 52: Contraseña en el alta y login real (US-48)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Coordinación del lote en paralelo (feature **F-C**) en
> [coordinacion-mejoras-paralelo.md](coordinacion-mejoras-paralelo.md). Aquí va el **cómo** se trocea
> y ejecuta.
>
> Rama: `feature/52-password-login` (desde `develop`, en worktree). Historia: **US-48** (épica A).

## Contexto

Esta feature (F-C del lote de mejoras) **revierte la decisión declarada de "identificación ligera
por email, sin contraseña"** (Fase 5.5, criterio **C-10** de
[cumplimiento-menores.md](../cumplimiento-menores.md) y alcance de **US-19**). A partir de aquí el
alta del adulto guarda un **hash de la contraseña** y el login **verifica la contraseña** (deja de
ser una identificación ligera por email). Amplía **US-16** (alta) y **US-19** (login).

Qué existe ya (✅):

- ✅ **Alta** sin contraseña: caso de uso `RegisterGuardian`
  ([application/use-cases/RegisterGuardian.ts](../../packages/backend/src/application/use-cases/RegisterGuardian.ts)).
- ✅ **Login ligero por email** sin contraseña: caso de uso `LoginGuardian`
  ([application/use-cases/LoginGuardian.ts](../../packages/backend/src/application/use-cases/LoginGuardian.ts)).
- ✅ Rutas `POST /guardians` (alta) y `POST /guardians/login`
  ([routes/guardians.ts](../../packages/backend/src/routes/guardians.ts)), con Zod en frontera (US-44)
  y sesión JWT emitida en alta/login (US-45).
- ✅ Entidad `Guardian` ([domain/entities/Guardian.ts](../../packages/backend/src/domain/entities/Guardian.ts))
  y su repo Prisma ([infrastructure/repositories/PrismaGuardianRepository.ts](../../packages/backend/src/infrastructure/repositories/PrismaGuardianRepository.ts)).
- ✅ Pantallas app `ConsentScreen` (alta) y `LoginScreen` (login)
  ([packages/app/src/presentation/screens/](../../packages/app/src/presentation/screens/)).

Qué falta (❌):

- ❌ El `Guardian` **no tiene `passwordHash`**; el alta no pide ni guarda contraseña.
- ❌ El login **no verifica** nada más allá de la existencia del email.
- ❌ Las pantallas de alta/login **no tienen campo de contraseña**.

### Decisiones tomadas (lote en paralelo, 2026-06-26)

- **Cambio de postura:** el alta guarda hash y el login verifica contraseña → se actualiza
  `cumplimiento-menores.md` (C-10) y las historias US-16/US-19 (ampliadas por US-48).
- **Hasher:** dependencia nueva (**bcrypt** o **argon2**) tras un puerto de dominio `PasswordHasher`
  (`hash`/`verify`), para que el caso de uso no dependa de la librería y los tests usen un doble. La
  elección concreta (`bcryptjs` puro JS vs. `argon2` nativo) se decide en la Fase 0 según
  portabilidad del build (`docker compose up` debe seguir levantando sin pasos ocultos).
- **Mensaje genérico en login:** credencial inválida devuelve **401 genérico** sin distinguir email
  inexistente de contraseña errónea (no filtrar qué emails existen).
- **Nunca en claro:** la contraseña no se persiste ni se devuelve ni se registra en logs/`AuditLog`.
- **Migración Prisma:** **solo F-C migra** en este lote (las migraciones son secuenciales). Al tocar
  `prisma/schema.prisma` se actualiza `Docs/modelo-datos.md` en el **mismo cambio** (regla del CLAUDE.md).

## Historias cubiertas

- **US-48 — Contraseña en el alta y login real** ([épica A](../historias-usuario/epic-a-perfil.md#us-48)),
  que amplía **US-16** y **US-19**.

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha. Cada fase incluye **crear test → ejecutar test
(`pnpm check` verde) → actualizar docs** según la regla del DoD.

### Fase 0 — Andamiaje (dependencia del hasher + puerto)

- [x] ✅ Elegir y añadir la dependencia de hashing (`bcrypt`/`bcryptjs` o `argon2`) a
      `packages/backend`, verificando que `docker compose up` sigue levantando sin pasos ocultos.
- [x] ✅ Definir el puerto de dominio `PasswordHasher` (`hash(plano)`, `verify(plano, hash)`) en
      `packages/backend/src/domain/` (sin dependencia de framework).
- [x] ✅ Implementación de infraestructura del `PasswordHasher` (adaptador sobre la librería elegida).
- [x] ✅ **Test:** test unitario del adaptador (hash ≠ plano, `verify` true/false).
- [x] ✅ **Ejecutar test** (`pnpm check` verde).
- [x] ✅ **Docs:** `CHANGELOG` backend (`Added`).

### Fase 1 — Modelo de datos: `passwordHash` en Guardian

- [x] ✅ Añadir `passwordHash` a la entidad de dominio `Guardian`
      ([domain/entities/Guardian.ts](../../packages/backend/src/domain/entities/Guardian.ts)).
- [x] ✅ Añadir el campo a `prisma/schema.prisma` (modelo `Guardian`) y crear la **migración** Prisma.
- [x] ✅ Adaptar `PrismaGuardianRepository` (persistir/leer `passwordHash`) y los seeds si procede.
- [x] ✅ **Regla del CLAUDE.md (no se difiere):** actualizar
      [Docs/modelo-datos.md](../modelo-datos.md) en el **mismo cambio** — bloque `mermaid erDiagram`
      (campo nuevo) y revisar la parte conceptual (minimización: el hash no es dato de menor; nunca
      en claro).
- [x] ✅ **Test:** ajustar dobles in-memory del repo (incluyen `passwordHash`).
- [x] ✅ **Ejecutar test** (`pnpm check` verde).
- [x] ✅ **Docs:** `CHANGELOG` backend (`Added`/`Changed`).

### Fase 2 — Alta: `RegisterGuardian` hashea (backend)

- [x] ✅ `RegisterGuardian` recibe la contraseña en el DTO de entrada, la **hashea** vía
      `PasswordHasher` y guarda solo el `passwordHash`; **nunca** devuelve la contraseña.
- [x] ✅ Ruta `POST /guardians` ([routes/guardians.ts](../../packages/backend/src/routes/guardians.ts)):
      esquema Zod con el campo `password` (mínimo de robustez/longitud) → `400` si no cumple.
- [x] ✅ **Test:** caso de uso (`RegisterGuardian.test.ts`, hasher de prueba — guarda hash, no claro) +
      endpoint (`test/routes/guardians.test.ts`, alta con/sin contraseña válida).
- [x] ✅ **Ejecutar test** (`pnpm check` verde).
- [x] ✅ **Docs:** `CHANGELOG` backend.

### Fase 3 — Login: `LoginGuardian` verifica contraseña (backend)

- [x] ✅ `LoginGuardian` recibe email + contraseña, normaliza el email, busca el `Guardian` y
      **verifica** la contraseña contra `passwordHash` vía `PasswordHasher`; credencial inválida →
      **401 genérico** (no distingue email inexistente de contraseña errónea).
- [x] ✅ Mantener el `AuditLog` `accion=login` con `guardianId` (sin registrar la contraseña).
- [x] ✅ Ruta `POST /guardians/login`: esquema Zod con `password`; respuesta inalterada (sesión JWT).
- [x] ✅ **Test:** caso de uso (`LoginGuardian.test.ts`: ok / contraseña errónea / email inexistente) +
      endpoint (`test/routes/guardians.test.ts`: 200 con credencial correcta, 401 genérico, 400 por
      validación).
- [x] ✅ **Ejecutar test** (`pnpm check` verde).
- [x] ✅ **Docs:** `CHANGELOG` backend (`Changed`/`Security`).

### Fase 4 — Campo contraseña en la app (alta y login)

- [x] ✅ `ConsentScreen` ([presentation/screens/ConsentScreen.tsx](../../packages/app/src/presentation/screens/ConsentScreen.tsx)):
      campo **contraseña** (secureTextEntry) en el alta; validación de longitud mínima; gateway de
      `register` envía la contraseña.
- [x] ✅ `LoginScreen` ([presentation/screens/LoginScreen.tsx](../../packages/app/src/presentation/screens/LoginScreen.tsx)):
      campo **contraseña**; gateway de `login` la envía; mensaje de error genérico ante 401.
- [x] ✅ Ajustar tipos/gateway HTTP (`domain` + `infrastructure/http`) para los nuevos campos.
- [x] ✅ **Test:** test de componente (user-centric) de `ConsentScreen`/`LoginScreen` (campo
      contraseña, validación mínima, envío del valor).
- [x] ✅ **Ejecutar test** (`pnpm check` verde).
- [x] ✅ **Docs:** `CHANGELOG` app (`Added`/`Changed`).

### Fase 5 — Cumplimiento, documentación y cierre

- [x] ✅ **Actualizar [cumplimiento-menores.md](../cumplimiento-menores.md) (cambio de postura, no se
      difiere):** revisar **C-10** — ya no es "identificación ligera sin contraseña"; el login
      verifica contraseña con hash (bcrypt/argon2), el hash va en BD pero **nunca** en claro y la
      contraseña no se registra en logs. Coherencia con C-13 (JWT) y con US-16/US-19/US-48.
- [x] ✅ **US-48** y la trazabilidad de [historias-usuario/README.md](../historias-usuario/README.md)
      reflejadas (hecho en el andamiaje; revisar al cierre).
- [x] ✅ [phases.md](../phases.md): feature reflejada en el lote de Mejoras.
- [ ] ❌ Cierre con la skill **`cerrar-feature`** (delega versionado en `versionar`): gate verde,
      **pruebas con el usuario**, y `finish`/merge **solo tras confirmación explícita**. _(Pendiente:
      la implementación está completa y el gate en verde; falta la confirmación del usuario y el
      `finish` — no se ejecuta sin su "sí".)_

## Verificación (DoD)

- `pnpm check` verde (typecheck + lint + format + tests) tras cada fase.
- Tests nuevos co-localizados: caso de uso (`RegisterGuardian`/`LoginGuardian` con hasher de prueba),
  endpoint (`guardians.ts`: alta con contraseña, login 200/401/400) y componente
  (`ConsentScreen`/`LoginScreen`).
- `docker compose up` sigue levantando la pila (la dependencia del hasher no añade pasos ocultos).
- Migración Prisma aplicable; `Docs/modelo-datos.md` actualizado en el mismo cambio.
- `cumplimiento-menores.md` actualizado (cambio de postura sobre la contraseña).
- Pruebas con el usuario antes del cierre; `finish` solo tras confirmación explícita.
