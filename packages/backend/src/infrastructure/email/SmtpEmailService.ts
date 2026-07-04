import nodemailer, { type Transporter } from 'nodemailer';
import type { DatosCorreoVerificacion, EmailService } from '../../domain/services/EmailService.js';
import type { SmtpConfig } from '../../config.js';
import { componerCorreoVerificacion } from './verificationEmail.js';

/** Opciones del adaptador SMTP: credenciales + remitente + timeout de conexión. */
export interface SmtpEmailServiceOptions {
  smtp: SmtpConfig;
  from: string;
  /** Timeout de conexión/envío en ms (por defecto 10 s). */
  timeoutMs?: number;
}

/**
 * Adaptador de `EmailService` sobre SMTP con nodemailer (US-93). Solo se construye
 * cuando hay SMTP configurado (`config.email.enabled`); en otro caso no se cablea y
 * la verificación se omite. El puerto 465 implica conexión TLS implícita (`secure`).
 * Solo envía el correo de verificación (email del adulto + código); ninguna PII del
 * menor. La `SMTP_PASSWORD` vive en env, nunca en logs ni en BD.
 */
export class SmtpEmailService implements EmailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(options: SmtpEmailServiceOptions) {
    const timeout = options.timeoutMs ?? 10_000;
    this.from = options.from;
    this.transporter = nodemailer.createTransport({
      host: options.smtp.host,
      port: options.smtp.port,
      secure: options.smtp.port === 465,
      auth: { user: options.smtp.user, pass: options.smtp.password },
      connectionTimeout: timeout,
      greetingTimeout: timeout,
      socketTimeout: timeout,
    });
  }

  async enviarCodigoVerificacion(datos: DatosCorreoVerificacion): Promise<void> {
    const { subject, text, html } = componerCorreoVerificacion(datos.codigo);
    await this.transporter.sendMail({ from: this.from, to: datos.email, subject, text, html });
  }
}
