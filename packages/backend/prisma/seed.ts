import { createPrismaClient } from '../src/infrastructure/db/prismaClient.js';
import { syncAppSettings } from '../src/infrastructure/config/syncAppSettings.js';

/**
 * Seed de AppSetting: delega en `syncAppSettings` (US-68), que aplica la fuente única
 * `prisma/app-settings.json` de forma **versionada** e idempotente. NO contiene
 * secretos (las API keys y `DATABASE_URL` siguen en variables de entorno). Se
 * conserva `prisma:seed` como alias del sync para no romper flujos existentes.
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
  console.error('✖ Seed falló:', error instanceof Error ? error.message : error);
  process.exit(1);
});
