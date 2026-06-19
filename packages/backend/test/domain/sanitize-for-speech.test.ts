import { describe, expect, it } from 'vitest';
import { sanitizeForSpeech } from '../../src/domain/tts/sanitizeForSpeech.js';

describe('sanitizeForSpeech', () => {
  it('quita emojis del texto', () => {
    expect(sanitizeForSpeech('Hola 🦊 mundo 🌟')).toBe('Hola mundo');
  });

  it('quita emojis compuestos (ZWJ) y banderas', () => {
    expect(sanitizeForSpeech('familia 👨‍👩‍👧 y bandera 🇪🇸 fin')).toBe('familia y bandera fin');
  });

  it('no deja espacio huérfano antes de la puntuación', () => {
    expect(sanitizeForSpeech('El zorro 🦊, valiente 🦁.')).toBe('El zorro, valiente.');
  });

  it('respeta acentos y puntuación normales', () => {
    const texto = '¡Había una vez un búho que leía cuentos!';
    expect(sanitizeForSpeech(texto)).toBe(texto);
  });
});
