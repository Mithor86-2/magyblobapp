import type { Achievement as PrismaAchievement } from '../../generated/prisma/client.js';
import { Achievement } from '../../domain/entities/Achievement.js';
import type { AchievementRepository } from '../../domain/repositories/AchievementRepository.js';
import type { PrismaClient } from '../db/prismaClient.js';

/**
 * Repositorio de logros sobre PostgreSQL (Prisma). El desbloqueo es idempotente: usa
 * la unicidad `profileId`+`clave`; si el logro ya existía, no lo duplica ni cambia su
 * fecha (`update: {}`).
 */
export class PrismaAchievementRepository implements AchievementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProfile(profileId: string): Promise<Achievement[]> {
    const rows = await this.prisma.achievement.findMany({ where: { profileId } });
    return rows.map(toAchievement);
  }

  async unlock(achievement: Achievement): Promise<void> {
    await this.prisma.achievement.upsert({
      where: { profileId_clave: { profileId: achievement.profileId, clave: achievement.clave } },
      create: {
        id: achievement.id,
        profileId: achievement.profileId,
        clave: achievement.clave,
        desbloqueadoEn: achievement.desbloqueadoEn,
      },
      // Ya desbloqueado: no se toca (conserva la fecha original).
      update: {},
    });
  }
}

function toAchievement(row: PrismaAchievement): Achievement {
  return new Achievement({
    id: row.id,
    profileId: row.profileId,
    clave: row.clave,
    desbloqueadoEn: row.desbloqueadoEn,
  });
}
