/**
 * Composición (pura) del correo de verificación (US-93). Aislada del transporte
 * SMTP para poder probarla sin red: dado un código, devuelve asunto y cuerpos
 * (texto y HTML). El correo es **bilingüe** (ES/EN) para no depender del idioma del
 * adulto, y solo contiene el código — ningún dato del menor.
 *
 * Diseño acorde al app "Aprendizaje Mágico": paleta pastel (coral/menta sobre crema),
 * formas redondeadas y tono cálido y amable. Los colores replican los tokens de tema
 * del app (`presentation/theme/tokens.ts`); se fijan aquí como literales porque el
 * backend no importa código del app. La tipografía Quicksand no se puede garantizar en
 * un cliente de correo, así que se usa una pila de fuentes redondeadas con fallback.
 */
export interface CorreoVerificacion {
  subject: string;
  text: string;
  html: string;
}

/** Nombre de marca mostrado en el correo (coincide con el del app). */
const APP_NOMBRE = 'Aprendizaje Mágico';

// Paleta del app (light) — ver presentation/theme/tokens.ts.
const COLOR_CREMA = '#fff8f6'; // surface
const COLOR_CREMA_ALTA = '#f6e5de'; // surfaceContainerHigh (separador)
const COLOR_CORAL = '#9c4143'; // primary
const COLOR_MENTA_CONT = '#c2e7e2'; // secondaryContainer (caja del código)
const COLOR_COCOA = '#221a16'; // onSurface (texto)
const COLOR_COCOA_SUAVE = '#554242'; // onSurfaceVariant (texto secundario)
const COLOR_BORDE = '#dbc0bf'; // outline
const FUENTE = "'Quicksand','Segoe UI',system-ui,-apple-system,sans-serif";

/** Construye el asunto y los cuerpos del correo de verificación para un código dado. */
export function componerCorreoVerificacion(codigo: string): CorreoVerificacion {
  const subject = `✨ Tu código de verificación · Your verification code — ${APP_NOMBRE}`;

  const text = [
    `✨ ${APP_NOMBRE} ✨`,
    '',
    '¡Ya casi está! Confirma tu correo para empezar la aventura.',
    `Tu código de verificación es: ${codigo}`,
    'Escríbelo en la app para activar tu cuenta. Caduca en unos minutos.',
    'Si no has creado ninguna cuenta, puedes ignorar este correo.',
    '',
    'Almost there! Confirm your email to start the adventure.',
    `Your verification code is: ${codigo}`,
    'Enter it in the app to activate your account. It expires in a few minutes.',
    "If you didn't create an account, you can ignore this email.",
  ].join('\n');

  const html = [
    `<div style="margin:0;padding:24px;background-color:${COLOR_CREMA};font-family:${FUENTE};">`,
    `<div style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid ${COLOR_BORDE};border-radius:24px;padding:32px;text-align:center;">`,
    '<div style="font-size:44px;line-height:1;">🪄✨</div>',
    `<h1 style="color:${COLOR_CORAL};font-size:26px;font-weight:700;margin:12px 0 4px;">${APP_NOMBRE}</h1>`,
    `<p style="color:${COLOR_COCOA_SUAVE};font-size:16px;line-height:24px;margin:0 0 24px;">¡Ya casi está! Confirma tu correo para empezar la aventura.<br><span style="opacity:0.75;">Almost there! Confirm your email to start the adventure.</span></p>`,
    `<p style="color:${COLOR_COCOA};font-size:16px;margin:0 0 12px;">Tu código de verificación / Your verification code:</p>`,
    `<div style="display:inline-block;background-color:${COLOR_MENTA_CONT};color:${COLOR_COCOA};font-size:34px;font-weight:700;letter-spacing:10px;padding:16px 24px;border-radius:16px;">${codigo}</div>`,
    `<p style="color:${COLOR_COCOA_SUAVE};font-size:14px;line-height:22px;margin:20px 0 0;">Escríbelo en la app para activar tu cuenta. Caduca en unos minutos.<br>Enter it in the app to activate your account. It expires in a few minutes.</p>`,
    `<hr style="border:none;border-top:1px solid ${COLOR_CREMA_ALTA};margin:24px 0;">`,
    `<p style="color:${COLOR_COCOA_SUAVE};font-size:12px;line-height:18px;margin:0;opacity:0.8;">Si no has creado ninguna cuenta, puedes ignorar este correo.<br>If you didn't create an account, you can ignore this email.</p>`,
    '</div>',
    '</div>',
  ].join('');

  return { subject, text, html };
}
