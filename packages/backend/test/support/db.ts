import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { PrismaClient } from '../../src/generated/prisma/index.js';

const require = createRequire(import.meta.url);
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Ruta ABSOLUTA al CLI de Prisma (resuelta desde su package.json), para no
 * invocar un comando vía `PATH` (evita PATH hijacking; regla sonarjs). */
function resolverPrismaCli(): string {
  const pkgJson = require.resolve('prisma/package.json');
  const { bin } = JSON.parse(readFileSync(pkgJson, 'utf8')) as { bin: { prisma: string } };
  return path.join(path.dirname(pkgJson), bin.prisma);
}

/**
 * Base de datos PostgreSQL **real y efímera** para los tests de integración de
 * persistencia. Arranca un contenedor con Testcontainers, le aplica las
 * migraciones de Prisma (`prisma migrate deploy`) y devuelve un `PrismaClient`
 * apuntando a él. Cada test aísla su estado con `truncate()`.
 *
 * Requiere un daemon de Docker en marcha (igual que `docker compose`); por eso
 * estos tests viven en una suite aparte (`vitest.integration.config.ts`) y no en
 * el `pnpm test` rápido del día a día.
 */
export interface TestDb {
  readonly prisma: PrismaClient;
  readonly url: string;
  truncate(): Promise<void>;
  stop(): Promise<void>;
}

export async function startTestDb(): Promise<TestDb> {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer(
    'postgres:16-alpine',
  ).start();
  const url = container.getConnectionUri();

  // Aplica el historial real de migraciones contra el contenedor (no `db push`):
  // así se ejercita el mismo SQL que producción (defaults, cascadas, índices).
  // `process.execPath` (node) y el CLI se invocan por ruta absoluta, sin PATH.
  execFileSync(process.execPath, [resolverPrismaCli(), 'migrate', 'deploy'], {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });

  const prisma = new PrismaClient({ datasourceUrl: url });

  return {
    prisma,
    url,
    async truncate() {
      const tablas = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
      `;
      if (tablas.length === 0) return;
      const lista = tablas.map((t) => `"${t.tablename}"`).join(', ');
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`);
    },
    async stop() {
      await prisma.$disconnect();
      await container.stop();
    },
  };
}
