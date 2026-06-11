import type { SettingsRepository } from '../../domain/repositories/SettingsRepository.js';
import type { PrismaClient } from '../db/prismaClient.js';

/** Lee configuración ajustable en caliente de la tabla AppSetting. */
export class PrismaSettingsRepository implements SettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(key: string): Promise<string | null> {
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }
}
