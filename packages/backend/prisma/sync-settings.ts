import { createPrismaClient } from '../src/infrastructure/db/prismaClient.js';
import { syncAppSettings } from '../src/infrastructure/config/syncAppSettings.js';

/**
 * Script `config:sync`: aplica `prisma/app-settings.json` a la tabla `AppSetting`
 * de forma versionada e idempotente (US-68). Reutiliza `syncAppSettings`, el mismo
 * mecanismo que corre en el arranque del backend. No contiene secretos.
 */
async function main(): Promise<void> {
  const prisma = createPrismaClient();
  try {
    await syncAppSettings(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('✖ config:sync falló:', error instanceof Error ? error.message : error);
  process.exit(1);
});
