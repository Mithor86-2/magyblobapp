import type { Activity as PrismaActivity } from '../../generated/prisma/client.js';
import { Activity } from '../../domain/entities/Activity.js';
import type { ActivityRepository } from '../../domain/repositories/ActivityRepository.js';
import type { Categoria, ProveedorIa } from '../../domain/vocabulary.js';
import type { PrismaClient } from '../db/prismaClient.js';

/** Repositorio de actividades sobre PostgreSQL (Prisma). */
export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(activity: Activity): Promise<void> {
    await this.prisma.activity.upsert({
      where: { id: activity.id },
      create: {
        id: activity.id,
        profileId: activity.profileId,
        categoria: activity.categoria,
        titulo: activity.titulo,
        descripcion: activity.descripcion,
        instrucciones: activity.instrucciones ?? null,
        duracionMin: activity.duracionMin ?? null,
        nivel: activity.nivel ?? null,
        proveedor: activity.proveedor,
        imagen: activity.imagen ?? null,
        prompt: activity.prompt ?? null,
        completadaEn: activity.completadaEn ?? null,
        valoracion: activity.valoracion ?? null,
        favorito: activity.favorito,
        creadoEn: activity.creadoEn,
      },
      update: {
        completadaEn: activity.completadaEn ?? null,
        valoracion: activity.valoracion ?? null,
        favorito: activity.favorito,
      },
    });
  }

  async findById(id: string): Promise<Activity | null> {
    const row = await this.prisma.activity.findUnique({ where: { id } });
    return row ? toActivity(row) : null;
  }

  async findByProfile(profileId: string): Promise<Activity[]> {
    const rows = await this.prisma.activity.findMany({
      where: { profileId },
      orderBy: { creadoEn: 'desc' },
    });
    return rows.map(toActivity);
  }
}

function toActivity(row: PrismaActivity): Activity {
  return new Activity({
    id: row.id,
    profileId: row.profileId,
    categoria: row.categoria as Categoria,
    titulo: row.titulo,
    descripcion: row.descripcion,
    instrucciones: row.instrucciones ?? undefined,
    duracionMin: row.duracionMin ?? undefined,
    nivel: row.nivel ?? undefined,
    proveedor: row.proveedor as ProveedorIa,
    imagen: row.imagen ?? undefined,
    prompt: row.prompt ?? undefined,
    completadaEn: row.completadaEn ?? undefined,
    valoracion: row.valoracion ?? undefined,
    favorito: row.favorito,
    creadoEn: row.creadoEn,
  });
}
