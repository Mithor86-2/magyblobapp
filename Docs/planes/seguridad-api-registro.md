# PLAN — Endurecimiento de seguridad del API público (registro/login)

> **Estado:** borrador para aprobar. Desarrolla el **cómo** cerrar los huecos de seguridad
> detectados en la superficie pública del backend desplegado en Render
> (`https://magyblobapp.onrender.com`). El alcance global vive en
> [plan-ejecucion-master.md](../plan-ejecucion-master.md); el cumplimiento con menores en
> [cumplimiento-menores.md](../cumplimiento-menores.md).

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecho

## Contexto

Auditoría (2026-07-03) de la superficie pública del backend en producción. Se **confirmó en vivo**
que el API acepta operaciones sensibles apuntando directamente a él, sin las protecciones habituales
de una app en producción — y siendo una **app infantil**, el listón de consentimiento parental
verificable (C-1, C-10 de [cumplimiento-menores.md](../cumplimiento-menores.md)) es más alto.

### Hallazgos confirmados (evidencia en vivo)

| #   | Hallazgo                                                                                                                                                            | Sev.           | Evidencia                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | **Registro directo sin fricción anti-bot.** `POST /guardians` crea cuenta + emite JWT (auto-login). Sin captcha ni verificación de humanidad.                       | ALTA           | Registro real → `HTTP 201` + `accessToken`/`refreshToken` válidos.                                                                                                     |
| H2  | **Sin rate limiting en auth.** Ni registro, ni login, ni refresh tienen límite de tasa. Fuerza bruta / credential stuffing / alta masiva viables.                   | ALTA           | 12 logins fallidos seguidos → 12×`401`, ningún `429`. No hay `@fastify/rate-limit`.                                                                                    |
| H3  | **Sin verificación de email (doble opt-in).** Cualquiera registra cuentas con emails arbitrarios (incluso ajenos). Debilita el consentimiento parental verificable. | ALTA           | `RegisterGuardian` crea la cuenta sin token de verificación; no existe endpoint de verify.                                                                             |
| H4  | **Sin CORS explícito.** No hay `@fastify/cors`. La app RN nativa no lo necesita, pero sí un cliente web (existe E2E de Expo-web).                                   | MEDIA          | Preflight `OPTIONS` → `404`; sin cabeceras `Access-Control-*`.                                                                                                         |
| H5  | **Sin cabeceras de seguridad (Helmet).** Faltan `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, CSP.                                                           | MEDIA          | Respuesta de `/health` sin cabeceras de seguridad (solo las de Cloudflare).                                                                                            |
| H6  | **Sesión JWT sin revocación.** Refresh stateless, sin blacklist ni `tokenVersion`: el logout no invalida tokens; una contraseña cambiada no expulsa sesiones.       | MEDIA          | `auth.ts` — refresh stateless por diseño.                                                                                                                              |
| H7  | **`JWT_SECRET` degradable.** En producción, si falta, se usa el secreto de dev conocido (solo `WARNING`, no error). Si eso ocurriera, se podrían **forjar tokens**. | ALTA si aplica | `config.ts:207-214` (`resolverSecretoJwt`). **No verificado en vivo** (el test de forja se bloqueó por seguridad); requiere comprobación manual en el panel de Render. |

### Fortalezas ya presentes (no tocar, referencia)

Bcrypt (10 rondas), validación Zod estricta (`.strict()`, password 8–128 con letra+número),
errores 401 genéricos (no filtran si el email existe), rate-limit en el modo anónimo, email
normalizado, TTL de access token corto (15m). Ver informe de auditoría.

## Decisiones abiertas (requieren tu confirmación)

- **D1 — Verificación de email (H3):** enviar email de verificación exige un proveedor de correo
  (SMTP/servicio), lo que roza la regla "sin terceros" de
  [cumplimiento-menores.md](../cumplimiento-menores.md) (C-2). Opciones:
  (a) SMTP propio/minimizado y documentarlo como desviación controlada;
  (b) **puerta parental server-side sin email** (reto de conocimiento adulto / challenge) como
  sustituto pragmático para el TFM;
  (c) diferir H3 y documentarlo como limitación conocida.
  **Recomendación:** (b) para el TFM (evita terceros y aún así sube el listón anti-bot), dejando (a)
  como mejora futura.
- **D2 — Alcance a abordar ahora:** ¿cerramos solo lo ALTA (H1, H2, H7) o también MEDIA (H4–H6)?
  **Recomendación:** Fase 0 + Fase 1 (H2/H7) de inmediato; el resto por prioridad.

---

## Fase 0 — Contención inmediata (sin código, hoy) ⬜

Objetivo: cerrar el riesgo más grave (forja de tokens) y limpiar el rastro del test.

- ⬜ **T0.1 — Verificar `JWT_SECRET` en Render.** Confirmar en el panel que la env `JWT_SECRET` está
  fijada a un valor largo y aleatorio (≠ `dev-insecure-jwt-secret-change-me-in-production`). Si no lo
  está, **fijarla/rotarla ya** (invalida sesiones existentes, aceptable). Mitiga H7.
- ⬜ **T0.2 — Borrar la cuenta de prueba** creada durante la auditoría:
  `email = sec-test-delete-me-1783095528@example.com` (`guardianId f882d8d6-2324-4ab7-b5d2-fed4988eeba6`).
- ⬜ **T0.3 — Revisar logs de Render** para confirmar que no se registran secretos ni contraseñas.

## Fase 1 — Rate limiting en auth (H2, H1) ⬜

Objetivo: frenar fuerza bruta, credential stuffing y alta masiva. Es la mitigación de mayor
impacto/menor coste.

- ⬜ **T1.1 — Añadir `@fastify/rate-limit`** al backend y registrarlo en `server.ts`.
- ⬜ **T1.2 — `trustProxy` + IP real.** Render está tras Cloudflare (`server: cloudflare`): habilitar
  `trustProxy` en Fastify y derivar la IP de `X-Forwarded-For` para que el límite sea por cliente
  real, no por la IP del proxy. Reutilizar el criterio de `anonymousRateLimit.ts`.
- ⬜ **T1.3 — Límites por endpoint** (más estrictos que un global):
  - `POST /guardians/login` — p. ej. 5–10/min por IP (+ opcional por email).
  - `POST /guardians` (registro) — p. ej. 3–5/hora por IP.
  - `POST /guardians/refresh` — límite moderado.
  - Respuesta `429` reutilizando `TooManyRequestsError`.
- ⬜ **T1.4 — Tests de integración** (`app.inject`) que verifican el `429` al superar el umbral en
  login y registro. Co-localizados según convención.
- ⬜ **T1.5 — Documentar** en [cumplimiento-menores.md](../cumplimiento-menores.md) y en la historia
  de usuario correspondiente.

## Fase 2 — Anti-bot / verificación en el alta (H3, H1) ⬜

Objetivo: subir el listón del consentimiento parental verificable. **Bloqueado por D1.**

- ⬜ **T2.1 — Decidir D1** (a/b/c) con el usuario.
- ⬜ **T2.2 — Implementar la opción elegida** (según D1):
  - Si (b): challenge/puerta parental server-side previo al alta.
  - Si (a): campo `emailVerificado` + token firmado con expiración + endpoint de verificación +
    envío por proveedor SMTP minimizado; no auto-login hasta verificar.
- ⬜ **T2.3 — Tests** del nuevo flujo.
- ⬜ **T2.4 — Actualizar** modelo de datos / historias / cumplimiento si aplica.

## Fase 3 — Cabeceras y CORS (H5, H4) ⬜

- ⬜ **T3.1 — `@fastify/helmet`** con configuración razonable para API JSON (sin romper la app).
- ⬜ **T3.2 — `@fastify/cors`** con allowlist de orígenes (dev de Expo-web + prod web si existe);
  denegar por defecto. La app nativa no se ve afectada.
- ⬜ **T3.3 — Verificar** cabeceras en `/health` y preflight tras el cambio.

## Fase 4 — Gestión de sesión / revocación (H6) ⬜

- ⬜ **T4.1 — Estrategia de invalidación:** `tokenVersion` en `Guardian` (simple) o blacklist de `jti`
  en BD. Recomendado `tokenVersion` por simplicidad (YAGNI).
- ⬜ **T4.2 — Rotación de refresh** e invalidación al logout / cambio de contraseña.
- ⬜ **T4.3 — Endpoint de logout** + tests.

## Definition of Done

- Gate verde: `pnpm check` (typecheck + lint + format:check + test).
- Tests de integración nuevos (429 en auth; flujo anti-bot; sesión) en verde.
- `docker compose up` reproducible.
- Docs actualizadas ([cumplimiento-menores.md](../cumplimiento-menores.md), historias de usuario,
  este plan con sus marcas).
- Verificación en vivo tras desplegar: repetir la ráfaga de login → aparece `429`.

## Notas de método

- Cada fase es una feature independiente desde `develop` (skill `abrir-feature`); si se abordan en
  paralelo, un worktree por feature.
- No implementar nada hasta aprobar el alcance (D2) y D1.
