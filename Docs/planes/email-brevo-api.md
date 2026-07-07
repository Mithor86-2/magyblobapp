# Plan — Feature: envío de email de verificación por API HTTP (Brevo)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

La verificación de email (US-93) se entregaba por **SMTP con nodemailer** (`SmtpEmailService`). En
producción (Render) **no funciona**: Render bloquea el egress SMTP (timeout en la conexión saliente a
Gmail por 465/587), así que `POST /guardians` caía en **500** al enviar el OTP. Antes ya se corrigió
un fallo distinto (nodemailer elegía IPv6 y Render no rutea IPv6 → `ENETUNREACH`; fix `family`/IPv4 en
v1.10.2), pero el bloqueo SMTP de Render es un límite de la plataforma, no del código.

Decidido con el usuario: sustituir el envío por un **proveedor transaccional vía API HTTPS**
(**Brevo**), que sale por el puerto 443 (permitido por Render). Brevo (free 300/día) permite enviar a
**cualquier destinatario** tras verificar un solo email remitente, sin necesidad de dominio propio —
adecuado para enviar OTP a emails de tutores arbitrarios en el TFM.

Qué existe ya (✅) y qué falta (❌):

- ✅ Puerto `EmailService` (`domain/services/EmailService.ts`) — no cambia.
- ✅ Composición de correo (`infrastructure/email/verificationEmail.ts`, `componerCorreoVerificacion`)
  con subject/text/html — se **reutiliza** tal cual.
- ✅ Caso de uso `SendEmailVerification` y flujo del alta (US-93) — no cambian.
- ✅ `SmtpEmailService` (se **mantiene** como fallback si solo hay SMTP configurado).
- ❌ Adaptador `BrevoEmailService` (HTTP) implementando `EmailService`.
- ❌ Selección de proveedor en `config.ts` (`BREVO_API_KEY`; Brevo preferido sobre SMTP).
- ❌ Cableado en `composition.ts`.
- ❌ Test unitario del adaptador (`fetch` mockeado).
- ❌ Docs: `despliegue.md`, `cumplimiento-menores.md`, US-93.

## Historias cubiertas

- US-93 — Verificación de titularidad del email por OTP
  ([épica F — plataforma](../historias-usuario/epic-f-plataforma.md)). Esta feature cambia el **canal
  de entrega** (API HTTP en vez de SMTP); los criterios de verificación no cambian.

## Diseño

- **Config** (`config.ts`): nuevo env `BREVO_API_KEY` (opcional). `EmailConfig` gana `provider?:
'smtp' | 'brevo'` y `brevo?: { apiKey }`. Selección en `leerConfigEmail`: si hay `BREVO_API_KEY`
  (+ `EMAIL_FROM`, remitente verificado en Brevo) → `provider='brevo'`; si no, si hay SMTP completo →
  `provider='smtp'`; si no → `enabled=false` (fallback: auto-verificado, como hoy).
- **Adaptador** (`infrastructure/email/BrevoEmailService.ts`): `POST https://api.brevo.com/v3/smtp/email`
  con header `api-key`, body `{ sender: { email: from }, to: [{ email }], subject, htmlContent,
textContent }`. Reutiliza `componerCorreoVerificacion`. Timeout con `AbortController`; en respuesta
  no-2xx lanza error (sin volcar el cuerpo con datos sensibles).
- **Composición**: elige `BrevoEmailService` o `SmtpEmailService` según `config.email.provider`.
- **Cumplimiento**: solo salen a Brevo el **email del adulto** y el **OTP**; nunca PII del menor
  (C-17). Brevo pasa a ser un procesador de datos de email en prod (desviación asumida del TFM,
  coherente con el modo cloud / Sentry; documentar en `cumplimiento-menores.md`).

## Tareas

- [x] ✅ `config.ts`: env `BREVO_API_KEY`, `EmailConfig.provider`/`brevo`, lógica de selección en
      `leerConfigEmail` (Brevo > SMTP > off) + warns.
- [x] ✅ `BrevoEmailService.ts`: adaptador HTTP sobre la API de Brevo (reutiliza `componerCorreo…`).
- [x] ✅ `composition.ts`: cableado por `provider`.
- [x] ✅ Test `BrevoEmailService.test.ts` (fetch mockeado: URL, header `api-key`, body, no-2xx→throw) + tests de selección de proveedor en `config.test.ts`.
- [x] ✅ `.env.example` (raíz): documentar `BREVO_API_KEY` + `EMAIL_FROM` + SMTP alternativo.
- [x] ✅ Docs: `despliegue.md` (Brevo en Render; nota del bloqueo SMTP), `cumplimiento-menores.md`
      (C-17 → Brevo procesador de email), US-93 (canal de entrega).
- [x] ✅ CHANGELOG backend `[Unreleased]` con la entrada.
- [ ] 🔄 Gate verde (`pnpm check`) + prueba con el usuario + cierre con `cerrar-feature`.

## Notas de cierre pendientes del release anterior

- v1.10.2 (fix IPv4) ya está desplegado en prod pero su entrada de CHANGELOG afirma que "desbloquea el
  alta en producción", lo cual **no** es cierto en Render por el bloqueo SMTP. Al **cerrar esta
  feature** (siguiente release) ajustar ese matiz y no dejar un GitHub Release aislado de v1.10.2.
