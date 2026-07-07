import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrevoEmailService } from '../../src/infrastructure/email/BrevoEmailService.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Construye el adaptador con credenciales de prueba. */
function crear() {
  return new BrevoEmailService({ brevo: { apiKey: 'clave-brevo' }, from: 'remitente@ejemplo.com' });
}

describe('BrevoEmailService', () => {
  it('envía el OTP por POST a la API de Brevo con la api-key y el cuerpo correctos', async () => {
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify({ messageId: '<id>' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    await crear().enviarCodigoVerificacion({ email: 'tutor@correo.com', codigo: '123456' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['api-key']).toBe('clave-brevo');

    const body = JSON.parse(init.body as string);
    expect(body.sender.email).toBe('remitente@ejemplo.com');
    expect(body.to).toEqual([{ email: 'tutor@correo.com' }]);
    // El OTP viaja en el contenido del correo (texto y html), nunca datos del menor.
    expect(body.htmlContent).toContain('123456');
    expect(body.textContent).toContain('123456');
  });

  it('lanza si Brevo responde con un estado no-2xx', async () => {
    const fetchSpy = vi.fn(async () => new Response('unauthorized', { status: 401 }));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      crear().enviarCodigoVerificacion({ email: 'tutor@correo.com', codigo: '000111' }),
    ).rejects.toThrow(/401/);
  });

  it('no filtra la api-key en el mensaje de error', async () => {
    const fetchSpy = vi.fn(async () => new Response('nope', { status: 500 }));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      crear().enviarCodigoVerificacion({ email: 'tutor@correo.com', codigo: '222333' }),
    ).rejects.not.toThrow(/clave-brevo/);
  });
});
