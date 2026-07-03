# Plan — Feature 93: Verificación de email al crear la cuenta (OTP 6 dígitos vía SMTP)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

- ✅ Ya existe: alta `POST /guardians` con auto-login (JWT), puerta parental server-side (US-92), hash de
  contraseña (US-48), patrón Observer (eventos → `AuditLog`), config validada con Zod, rutas Fastify con
  Zod. Variables `SMTP_HOST/PORT/USER/PASSWORD` **declaradas** en `.env.example`.
- ❌ Falta: **no hay `nodemailer` ni servicio de email**; el email del alta **no se verifica**. En C-16/US-92
  quedó como mejora futura ("doble opt-in / verificación de titularidad del email").

### Decisiones (con el usuario)

- **Bloqueo duro:** con SMTP, el alta crea la cuenta `emailVerificado=false`, envía OTP y **no** emite
  sesión; los tokens se emiten **solo** al validar el código (`POST /guardians/verify-email`).
- **Sin SMTP → auto-verificar** (patrón "sin key cae a mock"): la cuenta queda verificada y el alta
  auto-loguea como hoy, preservando `docker compose up` reproducible.
- **OTP:** 6 dígitos, hash bcrypt (reutiliza `PasswordHasher`), caduca 10 min, máx. 5 intentos, reenvío
  con cooldown 60 s.

## Historias cubiertas

- US-93 — Verificación de titularidad del email por OTP (SMTP) ([épica F](../historias-usuario/epic-f-plataforma.md#us-93))

## Tareas

### B1 — Config, dependencia y esquema de datos

- [ ] ❌ Añadir `nodemailer` (+ `@types/nodemailer` dev) al backend.
- [ ] ❌ `src/config.ts`: parsear SMTP (opcional) + `EMAIL_FROM`; derivar `email.enabled`; params OTP
      (`OTP_TTL_MS`, `OTP_MAX_INTENTOS`, `OTP_RESEND_COOLDOWN_MS`) y rate-limit `RATE_LIMIT_VERIFY_*`/`RATE_LIMIT_RESEND_*`. Ampliar `config.test.ts`.
- [ ] ❌ `.env.example`: documentar SMTP + `EMAIL_FROM` + params OTP (nota "sin SMTP → auto-verificado").
- [ ] ❌ `prisma/schema.prisma`: `Guardian.emailVerificado` + modelo `EmailVerification`; migración
      `add_email_verification` con backfill `emailVerificado=true` para filas existentes.
- [ ] ❌ `Docs/modelo-datos.md`: `erDiagram` + entidades (enforced).

### B2 — Dominio

- [ ] ❌ Puerto `EmailService` (`enviarCodigoVerificacion`).
- [ ] ❌ Puerto `CodeGenerator` (`generar` 6 dígitos).
- [ ] ❌ `EmailVerificationRepository` (guardar/buscar/borrar por guardián).
- [ ] ❌ Entidad `EmailVerification` (invariantes: expiración, intentos).
- [ ] ❌ `errors.ts`: `VerificationCodeError` (400); reutilizar `TooManyRequestsError`/`NotFoundError`.

### B3 — Aplicación (+ tests co-localizados)

- [ ] ❌ Servicio `SendEmailVerification` (generar→hashear→persistir→enviar), reutilizable.
- [ ] ❌ `RegisterGuardian` (modificar): rama con/sin SMTP; output con `emailVerificado`. Test actualizado.
- [ ] ❌ `VerifyEmail` (nuevo) + `verify-email.test.ts`.
- [ ] ❌ `ResendEmailVerification` (nuevo) + `resend-email-verification.test.ts`.
- [ ] ❌ DTOs en `dto.ts`.

### B4 — Infraestructura y rutas (+ tests)

- [ ] ❌ `SmtpEmailService` (nodemailer) + función pura de plantilla ES/EN (test).
- [ ] ❌ `CryptoCodeGenerator` (`crypto.randomInt`) + test de formato.
- [ ] ❌ `PrismaEmailVerificationRepository` + test de integración (Testcontainers).
- [ ] ❌ Subscriber `email_verificado` → `AuditLog`.
- [ ] ❌ `dependencies.ts`: cablear SMTP solo si `email.enabled`.
- [ ] ❌ Rutas `POST /guardians` (respuesta condicional), `POST /guardians/verify-email`,
      `POST /guardians/resend-verification` + `guardians.test.ts` + dobles/servidor de test.

### A1 — App: dominio/HTTP/schemas

- [ ] ❌ `types.ts` (`RegisterOutcome`), `gateways.ts` (`verifyEmail`, `resendVerification`).
- [ ] ❌ `http.ts` (rama de alta + verify + resend), `schemas.ts` (unión) + `http.test.ts`.

### A2 — App: pantalla/navegación/i18n

- [ ] ❌ `VerifyEmailScreen.tsx` (código 6 dígitos, reenviar, errores).
- [ ] ❌ `navigation.ts` + `App.tsx` (ruta `VerifyEmail`), `ConsentScreen.tsx` (ramificar).
- [ ] ❌ i18n `es.ts`/`en.ts` (bloque `verify`).

### A3 — Tests app

- [ ] ❌ Test de componente `VerifyEmailScreen` (Vitest + jsdom).
- [ ] ❌ `http.test.ts` (arriba). E2E onboarding sigue verde sin cambios (modo sin SMTP).

### Docs y cierre

- [x] ✅ US-93 creada + trazabilidad en `README.md`.
- [ ] ❌ `Docs/cumplimiento-menores.md`: fila **C-17**.
- [ ] ❌ `Docs/phases.md`: entrada de la feature.
- [ ] ❌ CHANGELOG backend + app bajo `## [Unreleased]` (versionado diferido).
- [ ] ❌ Gate `pnpm check` verde → pruebas manuales con el usuario → `cerrar-feature` (tras confirmación).

## Verificación (DoD)

Ver la sección de verificación del plan aprobado: gate `pnpm check`, `test:integration`/`test:e2e` con
Docker, prueba local con SMTP (recibir email → introducir código → sesión) y sin SMTP (auto-verificado).
