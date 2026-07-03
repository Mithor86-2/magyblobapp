import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Crea el cliente Prisma. Se instancia una sola vez en la raíz de composición
 * (no en los tests, que usan repos en memoria, para no abrir conexión a la DB).
 *
 * Prisma 7 es Rust-free y sin motor embebido: la conexión la aporta un **driver
 * adapter** (`@prisma/adapter-pg` sobre `pg`), no ya `datasource.url` del schema.
 * La cadena sale de `DATABASE_URL` (validada en el arranque por `config.ts`); la
 * conexión de `pg` es perezosa, así que instanciar sin URL no abre socket.
 */
export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
