import { beforeEach, describe, expect, it } from 'vitest';
import { NarrateStory } from '../../src/application/use-cases/NarrateStory.js';
import { Story } from '../../src/domain/entities/Story.js';
import { NotFoundError } from '../../src/domain/errors.js';
import {
  FakeTTSProvider,
  InMemoryStoryNarrationRepository,
  InMemoryStoryRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

describe('NarrateStory', () => {
  let stories: InMemoryStoryRepository;
  let narrations: InMemoryStoryNarrationRepository;
  let tts: FakeTTSProvider;
  let useCase: NarrateStory;

  beforeEach(async () => {
    stories = new InMemoryStoryRepository();
    narrations = new InMemoryStoryNarrationRepository();
    tts = new FakeTTSProvider();
    await stories.save(
      new Story({
        id: 's-1',
        profileId: 'p-1',
        tema: 'animales',
        estilo: 'aventura',
        titulo: 'El zorro valiente',
        cuerpo: 'Había una vez un zorro.',
        idioma: 'es',
        proveedor: 'mock',
        creadoEn: new Date('2026-06-10T12:00:00.000Z'),
      }),
    );
    useCase = new NarrateStory({
      stories,
      narrations,
      tts,
      newId: secuencialIdGenerator('n'),
      now: relojFijo(),
    });
  });

  it('sintetiza y persiste la narración en cache-miss', async () => {
    const out = await useCase.execute({ storyId: 's-1' });
    expect(out.sintetizado).toBe(true);
    expect(out.mp3.length).toBeGreaterThan(0);
    expect(out.voiceId).toBe('voz-fake');
    expect(tts.llamadas).toBe(1);

    const guardada = await narrations.findByStory('s-1');
    expect(guardada?.mp3.length).toBeGreaterThan(0);
  });

  it('sirve de caché sin volver a sintetizar (cache-hit)', async () => {
    await useCase.execute({ storyId: 's-1' });
    const out = await useCase.execute({ storyId: 's-1' });
    expect(out.sintetizado).toBe(false);
    expect(tts.llamadas).toBe(1); // no se volvió a llamar a ElevenLabs
  });

  it('lanza NotFound si el cuento no existe', async () => {
    await expect(useCase.execute({ storyId: 'nope' })).rejects.toThrow(NotFoundError);
  });
});
