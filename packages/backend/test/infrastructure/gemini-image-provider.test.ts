import { describe, expect, it, vi } from 'vitest';
import { GeminiImageProvider } from '../../src/infrastructure/ai/GeminiImageProvider.js';

/** Doble de `fetch` con la forma `:predict` de Imagen: predictions[].bytesBase64Encoded. */
function fakeFetch(body: unknown, init?: { status?: number; statusText?: string }) {
  return vi.fn(
    async () =>
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status: init?.status ?? 200,
        statusText: init?.statusText ?? 'OK',
      }),
  ) as unknown as typeof fetch;
}

function provider(fetchFn: typeof fetch): GeminiImageProvider {
  return new GeminiImageProvider({ apiKey: 'gem-test', fetchFn });
}

describe('GeminiImageProvider', () => {
  it('devuelve una data URL a partir de la primera predicción', async () => {
    const fetchFn = fakeFetch({
      predictions: [{ bytesBase64Encoded: 'QUJD', mimeType: 'image/png' }],
    });
    const url = await provider(fetchFn).generateImage('un gato feliz');
    expect(url).toBe('data:image/png;base64,QUJD');
  });

  it('usa image/png por defecto si no viene mimeType', async () => {
    const fetchFn = fakeFetch({ predictions: [{ bytesBase64Encoded: 'WFla' }] });
    const url = await provider(fetchFn).generateImage('prompt');
    expect(url).toBe('data:image/png;base64,WFla');
  });

  it('llama al endpoint :predict con la API key en x-goog-api-key y sampleCount 1', async () => {
    const fetchFn = fakeFetch({ predictions: [{ bytesBase64Encoded: 'QQ==' }] });
    await provider(fetchFn).generateImage('un bosque encantado');
    const [url, opciones] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict',
    );
    const init = opciones as RequestInit;
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('gem-test');
    const reqBody = JSON.parse(init.body as string);
    expect(reqBody.instances).toEqual([{ prompt: 'un bosque encantado' }]);
    expect(reqBody.parameters).toEqual({ sampleCount: 1 });
  });

  it('devuelve null (best-effort, no lanza) ante un error HTTP', async () => {
    const fetchFn = fakeFetch('boom', { status: 500, statusText: 'Server Error' });
    expect(await provider(fetchFn).generateImage('x')).toBeNull();
  });

  it('devuelve null si la respuesta no trae imagen en base64', async () => {
    const fetchFn = fakeFetch({ predictions: [{}] });
    expect(await provider(fetchFn).generateImage('x')).toBeNull();
  });

  it('devuelve null si el cuerpo no es JSON parseable', async () => {
    const fetchFn = fakeFetch('<<no json>>');
    expect(await provider(fetchFn).generateImage('x')).toBeNull();
  });

  it('devuelve null si fetch rechaza (red/timeout)', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    expect(await provider(fetchFn).generateImage('x')).toBeNull();
  });
});
