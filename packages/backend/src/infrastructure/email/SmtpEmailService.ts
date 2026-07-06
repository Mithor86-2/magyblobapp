import net from 'node:net';
import { promises as dns } from 'node:dns';
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
 *
 * **IPv4 forzado (Render y otros PaaS sin salida IPv6).** nodemailer 9 resuelve el
 * host SMTP a IPv4 **e** IPv6 y elige una dirección al azar; si le toca la IPv6 de
 * Gmail, la conexión falla con `ENETUNREACH`/`ETIMEDOUT` porque Render no rutea IPv6
 * (y la opción `family` la ignora, pues resuelve el DNS por su cuenta). Por eso
 * resolvemos nosotros el registro A (IPv4) y pasamos la IP como `host`: al recibir
 * una IP, nodemailer se salta su resolución y nunca intenta IPv6. `tls.servername`
 * conserva el nombre original para validar el certificado (SNI). Resolvemos en cada
 * envío (volumen de OTP bajo) para no cachear una IP que rote.
 */
export class SmtpEmailService implements EmailService {
  private readonly smtp: SmtpConfig;
  private readonly from: string;
  private readonly timeout: number;

  constructor(options: SmtpEmailServiceOptions) {
    this.smtp = options.smtp;
    this.from = options.from;
    this.timeout = options.timeoutMs ?? 10_000;
  }

  /** Resuelve el host SMTP a una IPv4 (o lo deja como está si ya es una IP). */
  private async resolverIPv4(): Promise<string> {
    if (net.isIP(this.smtp.host)) return this.smtp.host;
    const [direccion] = await dns.resolve4(this.smtp.host);
    if (!direccion) {
      throw new Error(`No se pudo resolver una IPv4 para el host SMTP "${this.smtp.host}".`);
    }
    return direccion;
  }

  async enviarCodigoVerificacion(datos: DatosCorreoVerificacion): Promise<void> {
    const host = await this.resolverIPv4();
    const transporter: Transporter = nodemailer.createTransport({
      host,
      port: this.smtp.port,
      secure: this.smtp.port === 465,
      // Se conecta a la IPv4 resuelta, pero valida el certificado contra el nombre real.
      tls: { servername: this.smtp.host },
      auth: { user: this.smtp.user, pass: this.smtp.password },
      connectionTimeout: this.timeout,
      greetingTimeout: this.timeout,
      socketTimeout: this.timeout,
    });
    const { subject, text, html } = componerCorreoVerificacion(datos.codigo);
    await transporter.sendMail({ from: this.from, to: datos.email, subject, text, html });
  }
}
