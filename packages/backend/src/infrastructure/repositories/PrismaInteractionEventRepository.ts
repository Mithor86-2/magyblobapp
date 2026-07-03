import { Prisma } from '../../generated/prisma/client.js';
import type { InteractionEvent } from '../../domain/entities/InteractionEvent.js';
import type { InteractionEventRepository } from '../../domain/repositories/InteractionEventRepository.js';
import type { PrismaClient } from '../db/prismaClient.js';

/** Repositorio de eventos de uso (primera parte) sobre PostgreSQL (Prisma). */
export class PrismaInteractionEventRepository implements InteractionEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(event: InteractionEvent): Promise<void> {
    await this.prisma.interactionEvent.create({
      data: {
        id: event.id,
        profileId: event.profileId,
        tipo: event.tipo,
        payload: (event.payload as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
        creadoEn: event.creadoEn,
      },
    });
  }
}
