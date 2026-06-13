import type { Story as PrismaStory } from '../../generated/prisma/index.js';
import { Story } from '../../domain/entities/Story.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import type { CodigoIdioma } from '../../domain/value-objects/Idioma.js';
import type { Estilo, EstadoStory, ProveedorIa, Tema } from '../../domain/vocabulary.js';
import type { PrismaClient } from '../db/prismaClient.js';

/** Repositorio de cuentos sobre PostgreSQL (Prisma). */
export class PrismaStoryRepository implements StoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(story: Story): Promise<void> {
    await this.prisma.story.upsert({
      where: { id: story.id },
      create: {
        id: story.id,
        profileId: story.profileId,
        tema: story.tema,
        estilo: story.estilo,
        titulo: story.titulo,
        cuerpo: story.cuerpo,
        idioma: story.idioma,
        estado: story.estado,
        proveedor: story.proveedor,
        creadoEn: story.creadoEn,
      },
      // Lo único mutable del cuento es su estado de lectura (US-07).
      update: { estado: story.estado },
    });
  }

  async findById(id: string): Promise<Story | null> {
    const row = await this.prisma.story.findUnique({ where: { id } });
    return row ? toStory(row) : null;
  }

  async findByProfile(profileId: string): Promise<Story[]> {
    const rows = await this.prisma.story.findMany({
      where: { profileId },
      orderBy: { creadoEn: 'desc' },
    });
    return rows.map(toStory);
  }
}

function toStory(row: PrismaStory): Story {
  return new Story({
    id: row.id,
    profileId: row.profileId,
    tema: row.tema as Tema,
    estilo: row.estilo as Estilo,
    titulo: row.titulo,
    cuerpo: row.cuerpo,
    idioma: row.idioma as CodigoIdioma,
    proveedor: row.proveedor as ProveedorIa,
    estado: row.estado as EstadoStory,
    creadoEn: row.creadoEn,
  });
}
