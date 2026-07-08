import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createPrismaClient } from '../src/infrastructure/db/prismaClient.js';
import { PrismaGuardianRepository } from '../src/infrastructure/repositories/PrismaGuardianRepository.js';
import { PrismaChildProfileRepository } from '../src/infrastructure/repositories/PrismaChildProfileRepository.js';
import { BcryptPasswordHasher } from '../src/infrastructure/auth/BcryptPasswordHasher.js';
import { Guardian } from '../src/domain/entities/Guardian.js';
import { ChildProfile } from '../src/domain/entities/ChildProfile.js';
import { Edad } from '../src/domain/value-objects/Edad.js';
import { Idioma } from '../src/domain/value-objects/Idioma.js';

/**
 * Seed idempotente del **usuario de prueba** para la entrega del TFM (US-105, FASE 7).
 *
 * El formulario de entrega exige credenciales de prueba porque la app tiene login. Este
 * script siembra una cuenta genérica (no personal) con un perfil de niño en la BD que
 * apunte `DATABASE_URL` — pensado para ejecutarse **contra producción** (Neon) una vez:
 *
 * ```bash
 * DATABASE_URL="<url-neon>" pnpm --filter @magyblob/backend seed:test-user
 * ```
 *
 * Para probarlo **en local** contra la pila de Docker (`pnpm up:mock`/`up:local`): si no defines
 * `DATABASE_URL` en el shell, el script carga el `.env` de la raíz del repo (donde está la URL del
 * Postgres de `docker compose`). La `DATABASE_URL` del shell **tiene prioridad** sobre el `.env`.
 *
 * Es **idempotente**: si el guardián ya existe (búsqueda por email) no crea nada ni falla,
 * así que puede re-ejecutarse sin duplicar datos. Reutiliza las entidades de dominio, el
 * `BcryptPasswordHasher` y los repos Prisma para que el mapeo sea idéntico al del alta real.
 *
 * Cumplimiento: la contraseña se guarda **hasheada** (bcrypt), nunca en claro; la
 * `DATABASE_URL` llega por variable de entorno y no se embebe en el repo. El email queda
 * **verificado** (para entrar sin OTP) y el **consentimiento** otorgado.
 */

// Contraseña de la cuenta de PRUEBA: es intencionadamente conocida y está documentada en el README
// (la exige el formulario de entrega del TFM). Se puede sobrescribir por entorno; el valor por
// defecto es el documentado.
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- credencial de prueba deliberada y pública
const PASSWORD_PRUEBA = process.env.SEED_TEST_USER_PASSWORD ?? 'S12345678s';

const USUARIO_PRUEBA = {
  email: 'usuariotest@mail.com',
  password: PASSWORD_PRUEBA,
  nombre: 'Sutanito',
  apellidos: 'Test',
  parentesco: 'madre',
  consentimientoVersion: '1.0',
} as const;

const NINO_PRUEBA = {
  nombre: 'Fulanito',
  edad: 3,
  idioma: 'es',
  avatar: 'zorro',
  intereses: ['animales', 'magia'],
} as const;

/**
 * Garantiza que `DATABASE_URL` está definida. Si el shell no la trae, intenta cargar el `.env`
 * de la raíz del repo (útil al ejecutar en local contra el Postgres de `docker compose`). Si sigue
 * sin estar, aborta con un mensaje claro en vez del error críptico de Prisma al conectar en vacío.
 */
function asegurarDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    // La raíz del repo está tres niveles por encima de este script (packages/backend/prisma).
    const raizRepo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
    const envRaiz = resolve(raizRepo, '.env');
    if (existsSync(envRaiz)) {
      process.loadEnvFile(envRaiz);
    }
  }
  if (!process.env.DATABASE_URL) {
    console.error(
      '✖ DATABASE_URL no está definida. Ejecuta el seed apuntando a una BD alcanzable, p. ej.:\n' +
        '  · Producción (Neon):  DATABASE_URL="<url-neon>" pnpm --filter @magyblob/backend seed:test-user\n' +
        '  · Local (docker):     pnpm up:mock  (levanta Postgres)  →  pnpm --filter @magyblob/backend seed:test-user',
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  asegurarDatabaseUrl();
  const prisma = createPrismaClient();
  const guardianes = new PrismaGuardianRepository(prisma);
  const perfiles = new PrismaChildProfileRepository(prisma);
  const hasher = new BcryptPasswordHasher();

  try {
    const existente = await guardianes.findByEmail(USUARIO_PRUEBA.email);
    if (existente) {
      const susPerfiles = await perfiles.findByGuardian(existente.id);
      console.log(
        `✓ El usuario de prueba (${USUARIO_PRUEBA.email}) ya existe ` +
          `(${susPerfiles.length} perfil/es). No se crea nada (idempotente).`,
      );
      return;
    }

    const ahora = new Date();
    const guardian = new Guardian({
      id: randomUUID(),
      nombre: USUARIO_PRUEBA.nombre,
      apellidos: USUARIO_PRUEBA.apellidos,
      email: USUARIO_PRUEBA.email,
      parentesco: USUARIO_PRUEBA.parentesco,
      passwordHash: await hasher.hash(USUARIO_PRUEBA.password),
      consentimiento: { dado: true, fecha: ahora, version: USUARIO_PRUEBA.consentimientoVersion },
      emailVerificado: true,
      creadoEn: ahora,
    });
    await guardianes.save(guardian);

    const perfil = new ChildProfile({
      id: randomUUID(),
      guardianId: guardian.id,
      nombre: NINO_PRUEBA.nombre,
      edad: Edad.create(NINO_PRUEBA.edad),
      idioma: Idioma.create(NINO_PRUEBA.idioma),
      avatar: NINO_PRUEBA.avatar,
      intereses: [...NINO_PRUEBA.intereses],
      creadoEn: ahora,
    });
    await perfiles.save(perfil);

    console.log(
      `✓ Usuario de prueba sembrado: ${guardian.email} ` +
        `(perfil "${perfil.nombre}", ${perfil.edad.value} años).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Se imprime el error completo (no solo `.message`): los errores de conexión de Prisma llevan el
  // detalle útil fuera de `message`, y un `message` vacío no dice nada.
  console.error('✖ Seed del usuario de prueba falló:');
  console.error(error);
  process.exit(1);
});
