import { randomUUID } from 'node:crypto';
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

async function main(): Promise<void> {
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
  console.error(
    '✖ Seed del usuario de prueba falló:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
