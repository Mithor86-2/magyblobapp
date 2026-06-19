import { NotFoundError } from '../../domain/errors.js';
import { StoryNarration } from '../../domain/entities/StoryNarration.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import type { StoryNarrationRepository } from '../../domain/repositories/StoryNarrationRepository.js';
import type { TTSProvider } from '../../domain/tts/TTSProvider.js';
import { sanitizeForSpeech } from '../../domain/tts/sanitizeForSpeech.js';
import type { Clock, IdGenerator } from '../ports.js';
import type { NarrateStoryRequest, NarrationResult } from '../dto.js';

export interface NarrateStoryDeps {
  stories: StoryRepository;
  narrations: StoryNarrationRepository;
  tts: TTSProvider;
  newId: IdGenerator;
  now: Clock;
}

/**
 * Devuelve el audio de un cuento. Cachea: si ya se sintetizó, lo sirve de BD sin
 * volver a llamar a ElevenLabs (ni gastar créditos). En cache-miss sintetiza,
 * persiste y marca `sintetizado` para que la ruta registre el evento de uso.
 *
 * Si la síntesis falla (red/timeout/clave ausente) el error se propaga: la app
 * lo trata como señal para narrar con la voz nativa del dispositivo.
 */
export class NarrateStory {
  constructor(private readonly deps: NarrateStoryDeps) {}

  async execute(input: NarrateStoryRequest): Promise<NarrationResult> {
    const story = await this.deps.stories.findById(input.storyId);
    if (!story) {
      throw new NotFoundError(`No existe el cuento con id "${input.storyId}".`);
    }

    const cacheada = await this.deps.narrations.findByStory(story.id);
    if (cacheada) {
      return {
        mp3: cacheada.mp3,
        voiceId: cacheada.voiceId,
        profileId: story.profileId,
        sintetizado: false,
      };
    }

    // Se narra el cuerpo sin emojis (los motores TTS los leen de forma rara).
    const audio = await this.deps.tts.synthesize({
      texto: sanitizeForSpeech(story.cuerpo),
      idioma: story.idioma,
    });

    const narration = new StoryNarration({
      id: this.deps.newId(),
      storyId: story.id,
      mp3: audio.mp3,
      voiceId: audio.voiceId,
      idioma: story.idioma,
      creadoEn: this.deps.now(),
    });
    await this.deps.narrations.save(narration);

    return {
      mp3: narration.mp3,
      voiceId: narration.voiceId,
      profileId: story.profileId,
      sintetizado: true,
    };
  }
}
