import type { ChildProfile as PrismaChildProfile } from '../../generated/prisma/client.js';
import { ChildProfile } from '../../domain/entities/ChildProfile.js';
import type { ChildProfileRepository } from '../../domain/repositories/ChildProfileRepository.js';
import { Edad } from '../../domain/value-objects/Edad.js';
import { Idioma } from '../../domain/value-objects/Idioma.js';
import type { Tema } from '../../domain/vocabulary.js';
import type { PrismaClient } from '../db/prismaClient.js';

/** Repositorio de perfiles sobre PostgreSQL (Prisma). */
export class PrismaChildProfileRepository implements ChildProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(profile: ChildProfile): Promise<void> {
    await this.prisma.childProfile.create({
      data: {
        id: profile.id,
        guardianId: profile.guardianId,
        nombre: profile.nombre,
        edad: profile.edad.value,
        idioma: profile.idioma.value,
        avatar: profile.avatar,
        intereses: [...profile.intereses],
        creadoEn: profile.creadoEn,
      },
    });
  }

  async findById(id: string): Promise<ChildProfile | null> {
    const row = await this.prisma.childProfile.findUnique({ where: { id } });
    return row ? toChildProfile(row) : null;
  }

  async findByGuardian(guardianId: string): Promise<ChildProfile[]> {
    const rows = await this.prisma.childProfile.findMany({
      where: { guardianId },
      orderBy: { creadoEn: 'asc' },
    });
    return rows.map(toChildProfile);
  }
}

function toChildProfile(row: PrismaChildProfile): ChildProfile {
  return new ChildProfile({
    id: row.id,
    guardianId: row.guardianId,
    nombre: row.nombre,
    edad: Edad.create(row.edad),
    idioma: Idioma.create(row.idioma),
    avatar: row.avatar,
    intereses: row.intereses as Tema[],
    creadoEn: row.creadoEn,
  });
}
