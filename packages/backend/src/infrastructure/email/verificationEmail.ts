/**
 * Composición (pura) del correo de verificación (US-93). Aislada del transporte
 * SMTP para poder probarla sin red: dado un código, devuelve asunto y cuerpos
 * (texto y HTML). El correo es **bilingüe** (ES/EN) para no depender del idioma del
 * adulto, y solo contiene el código — ningún dato del menor.
 */
export interface CorreoVerificacion {
  subject: string;
  text: string;
  html: string;
}

/** Construye el asunto y los cuerpos del correo de verificación para un código dado. */
export function componerCorreoVerificacion(codigo: string): CorreoVerificacion {
  const subject = 'Tu código de verificación · Your verification code — magyblob';
  const text = [
    `Tu código de verificación de magyblob es: ${codigo}`,
    'Introdúcelo en la app para activar tu cuenta. Caduca en unos minutos.',
    'Si no has creado ninguna cuenta, ignora este correo.',
    '',
    `Your magyblob verification code is: ${codigo}`,
    'Enter it in the app to activate your account. It expires in a few minutes.',
    "If you didn't create an account, please ignore this email.",
  ].join('\n');
  const html = [
    '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">',
    '<h2>magyblob</h2>',
    '<p>Tu código de verificación es / Your verification code is:</p>',
    `<p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${codigo}</p>`,
    '<p>Introdúcelo en la app para activar tu cuenta. Caduca en unos minutos.<br>',
    'Enter it in the app to activate your account. It expires in a few minutes.</p>',
    '<p style="color: #888; font-size: 12px;">Si no has creado ninguna cuenta, ignora este correo. If you didn\'t create an account, please ignore this email.</p>',
    '</div>',
  ].join('');
  return { subject, text, html };
}
