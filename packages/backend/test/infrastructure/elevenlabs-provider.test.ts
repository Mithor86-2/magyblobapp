import { describe, expect, it, vi } from 'vitest';
import { ElevenLabsProvider } from '../../src/infrastructure/tts/ElevenLabsProvider.js';

const VOICES = { es: 'voz-es-id', en: 'voz-en-id' } as const;

/** Doble de `fetch` que devuelve un MP3 no vacío (audio/mpeg). */
function fakeFetch() {
  return vi.fn(
    async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
  ) as unknown as typeof fetch;
}

function provider(
  fetchFn: typeof fetch,
  apiKey: string | undefined = 'xi-key',
): ElevenLabsProvider {
  return new ElevenLabsProvider({
    apiKey,
    model: 'eleven_multilingual_v2',
    voiceIdByLang: VOICES,
    fetchFn,
  });
}

/** Proveedor sin clave: la app degrada a la voz nativa cuando `synthesize` lanza. */
function providerSinClave(fetchFn: typeof fetch): ElevenLabsProvider {
  return new ElevenLabsProvider({
    apiKey: undefined,
    model: 'eleven_multilingual_v2',
    voiceIdByLang: VOICES,
    fetchFn,
  });
}

/** URL de la llamada `n` a `fetch`. */
function urlDeLaLlamada(fetchFn: typeof fetch, n = 0): string {
  return String((fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[n][0]);
}

describe('ElevenLabsProvider — selección de voz por idioma (US-55)', () => {
  it('usa la voz ES cuando el cuento está en español', async () => {
    const fetchFn = fakeFetch();
    const result = await provider(fetchFn).synthesize({ texto: 'Hola', idioma: 'es' });

    expect(result.voiceId).toBe(VOICES.es);
    expect(urlDeLaLlamada(fetchFn)).toContain(`/${VOICES.es}?`);
  });

  it('usa la voz EN cuando el cuento está en inglés', async () => {
    const fetchFn = fakeFetch();
    const result = await provider(fetchFn).synthesize({ texto: 'Hello', idioma: 'en' });

    expect(result.voiceId).toBe(VOICES.en);
    expect(urlDeLaLlamada(fetchFn)).toContain(`/${VOICES.en}?`);
  });

  it('envía el idioma del cuento como language_code a ElevenLabs', async () => {
    const fetchFn = fakeFetch();
    await provider(fetchFn).synthesize({ texto: 'Hola', idioma: 'es' });

    const [, opciones] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((opciones as RequestInit).body as string);
    expect(body.language_code).toBe('es');
    expect(body.model_id).toBe('eleven_multilingual_v2');
  });

  it('lanza sin clave (conserva el fallback a voz nativa) y no llama a la red', async () => {
    const fetchFn = fakeFetch();
    await expect(
      providerSinClave(fetchFn).synthesize({ texto: 'Hola', idioma: 'es' }),
    ).rejects.toThrow(/API key/i);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
