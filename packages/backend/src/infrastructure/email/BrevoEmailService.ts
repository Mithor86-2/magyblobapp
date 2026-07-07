import type { DatosCorreoVerificacion, EmailService } from '../../domain/services/EmailService.js';
import type { BrevoConfig } from '../../config.js';
import { componerCorreoVerificacion } from './verificationEmail.js';

/** Opciones del adaptador Brevo: credenciales de API + remitente + timeout. */
export interface BrevoEmailServiceOptions {
  brevo: BrevoConfig;
  /** Remitente verificado en Brevo (env `EMAIL_FROM`). */
  from: string;
  /** Timeout de la petición HTTP en ms (por defecto 10 s). */
  timeoutMs?: number;
}

/** Endpoint del email transaccional de Brevo (API v3). */
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Adaptador de `EmailService` sobre la **API HTTP de Brevo** (US-93). Envía el correo
 * de verificación por `POST /v3/smtp/email` (HTTPS, puerto 443), a diferencia del
 * `SmtpEmailService`: en PaaS como Render el egress SMTP está bloqueado, así que la
 * API HTTP es la vía que funciona en producción.
 *
 * Solo transporta el **email del adulto** y el **código OTP**; nunca PII del menor
 * (C-17). La `BREVO_API_KEY` vive solo en variables de entorno, nunca en logs ni en BD.
 * En una respuesta no-2xx lanza un error genérico (sin volcar el cuerpo, que podría
 * incluir el email del destinatario).
 */
export class BrevoEmailService implements EmailService {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly timeout: number;

  constructor(options: BrevoEmailServiceOptions) {
    this.apiKey = options.brevo.apiKey;
    this.from = options.from;
    this.timeout = options.timeoutMs ?? 10_000;
  }

  async enviarCodigoVerificacion(datos: DatosCorreoVerificacion): Promise<void> {
    const { subject, text, html } = componerCorreoVerificacion(datos.codigo);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const respuesta = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: this.from },
          to: [{ email: datos.email }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
        signal: controller.signal,
      });
      if (!respuesta.ok) {
        throw new Error(`Brevo respondió ${respuesta.status} al enviar el código de verificación.`);
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
