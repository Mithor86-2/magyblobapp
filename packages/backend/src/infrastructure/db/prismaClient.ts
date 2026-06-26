import { PrismaClient } from '../../generated/prisma/index.js';

/**
 * Crea el cliente Prisma. Se instancia una sola vez en la raíz de composición
 * (no en los tests, que usan repos en memoria, para no abrir conexión a la DB).
 */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}

export type { PrismaClient };
