import { describe, expect, it } from 'vitest';
import { sanitizeForSpeech } from './sanitizeForSpeech';

/**
 * Tier CORE (Strategic Coverage 100/80/0, US-35): este saneo decide qué texto
 * se le lee en voz alta a un niño con la voz nativa. Si dejara pasar emojis, el
 * dispositivo leería "emoji cara sonriente"; espejo del sanitizador del backend.
 */
describe('sanitizeForSpeech (app)', () => {
  it('elimina emojis y pictogramas', () => {
    expect(sanitizeForSpeech('Hola 👋 mundo 🌍')).toBe('Hola mundo');
  });

  it('elimina banderas (region indicators)', () => {
    expect(sanitizeForSpeech('Bandera 🇪🇸 aquí')).toBe('Bandera aquí');
  });

  it('elimina ZWJ y selectores de variación', () => {
    expect(sanitizeForSpeech('familia 👨‍👩‍👧 fin')).toBe('familia fin');
  });

  it('colapsa espacios múltiples', () => {
    expect(sanitizeForSpeech('uno    dos\t\ttres')).toBe('uno dos tres');
  });

  it('pega los signos de puntuación que quedan sueltos al quitar el emoji', () => {
    expect(sanitizeForSpeech('Mira 🌟, qué bonito')).toBe('Mira, qué bonito');
  });

  it('recorta los extremos', () => {
    expect(sanitizeForSpeech('  hola  ')).toBe('hola');
  });

  it('deja intacto un texto sin emojis', () => {
    expect(sanitizeForSpeech('Érase una vez un zorro.')).toBe('Érase una vez un zorro.');
  });
});
