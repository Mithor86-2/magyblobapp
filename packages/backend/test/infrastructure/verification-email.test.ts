import { describe, expect, it } from 'vitest';
import { componerCorreoVerificacion } from '../../src/infrastructure/email/verificationEmail.js';

describe('componerCorreoVerificacion', () => {
  it('incluye el código en asunto/texto/html y es bilingüe', () => {
    const { subject, text, html } = componerCorreoVerificacion('123456');
    expect(subject).toContain('verificación');
    expect(subject).toContain('verification');
    expect(text).toContain('123456');
    expect(html).toContain('123456');
    // Bilingüe: contiene marcas de ambos idiomas.
    expect(text).toContain('código');
    expect(text).toContain('code');
  });

  it('no filtra otros datos: solo transporta el código dado', () => {
    const { text } = componerCorreoVerificacion('000111');
    expect(text).toContain('000111');
    expect(text).not.toContain('123456');
  });
});
