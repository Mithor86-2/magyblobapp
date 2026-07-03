import type { StoryNarration as PrismaStoryNarration } from '../../generated/prisma/client.js';
import { StoryNarration } from '../../domain/entities/StoryNarration.js';
import type { StoryNarrationRepository } from '../../domain/repositories/StoryNarrationRepository.js';
import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import type { PrismaClient } from '../db/prismaClient.js';

/** Caché de narraciones sobre PostgreSQL (Prisma). Mapea `Bytes` ↔ `Uint8Array`. */
export class PrismaStoryNarrationRepository implements StoryNarrationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByStory(storyId: string): Promise<StoryNarration | null> {
    const row = await this.prisma.storyNarration.findUnique({ where: { storyId } });
    return row ? toNarration(row) : null;
  }

  async save(narration: StoryNarration): Promise<void> {
    await this.prisma.storyNarration.upsert({
      where: { storyId: narration.storyId },
      create: {
        id: narration.id,
        storyId: narration.storyId,
        mp3: Buffer.from(narration.mp3),
        voiceId: narration.voiceId,
        idioma: narration.idioma,
        creadoEn: narration.creadoEn,
      },
      // La narración es inmutable; el upsert evita carreras de doble síntesis.
      update: {},
    });
  }
}

function toNarration(row: PrismaStoryNarration): StoryNarration {
  return new StoryNarration({
    id: row.id,
    storyId: row.storyId,
    mp3: new Uint8Array(row.mp3),
    voiceId: row.voiceId,
    idioma: row.idioma as CodigoIdioma,
    creadoEn: row.creadoEn,
  });
}
