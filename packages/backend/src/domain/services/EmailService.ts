/**
 * Puerto de envío de correo transaccional (US-93). Como `AIProvider` o
 * `PasswordHasher`, la implementación concreta (SMTP con nodemailer) vive en
 * infraestructura, de modo que los casos de uso no dependen de la librería y los
 * tests la sustituyen por un doble.
 *
 * El único correo que el proyecto envía es el **código de verificación de email**
 * del adulto: transporta el email del adulto y un código numérico, **nunca** datos
 * del menor (ver C-17 en Docs/cumplimiento-menores.md).
 */
export interface EmailService {
  /** Envía al adulto el código OTP de verificación de su cuenta. */
  enviarCodigoVerificacion(datos: DatosCorreoVerificacion): Promise<void>;
}

/** Datos mínimos para enviar el correo de verificación (US-93). */
export interface DatosCorreoVerificacion {
  /** Dirección de destino (email del adulto que se está registrando). */
  email: string;
  /** Código OTP de 6 dígitos en claro (solo viaja en el correo, no se persiste). */
  codigo: string;
}
