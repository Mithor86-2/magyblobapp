import { beforeEach, describe, expect, it } from 'vitest';
import { VerifyEmail } from '../../src/application/use-cases/VerifyEmail.js';
import { Guardian } from '../../src/domain/entities/Guardian.js';
import { EmailVerification } from '../../src/domain/entities/EmailVerification.js';
import {
  DomainError,
  NotFoundError,
  TooManyRequestsError,
  VerificationCodeError,
} from '../../src/domain/errors.js';
import {
  FakePasswordHasher,
  HASH_DE_PRUEBA,
  InMemoryEmailVerificationRepository,
  InMemoryGuardianRepository,
} from '../support/doubles.js';

const AHORA = new Date('2026-07-03T12:00:00.000Z');

function guardianNoVerificado(): Guardian {
  return new Guardian({
    id: 'g-1',
    nombre: 'Ana',
    apellidos: 'García',
    email: 'ana@example.com',
    parentesco: 'madre',
    passwordHash: HASH_DE_PRUEBA,
    consentimiento: { dado: true, fecha: AHORA, version: 'v1' },
    emailVerificado: false,
    creadoEn: AHORA,
  });
}

/** El FakePasswordHasher casa cuando el hash es `hashed:<codigo>`. */
function verificacion(
  overrides: Partial<{ codigo: string; expiraEn: Date; intentos: number }> = {},
) {
  const codigo = overrides.codigo ?? '123456';
  return new EmailVerification({
    id: 'v-1',
    guardianId: 'g-1',
    codigoHash: `hashed:${codigo}`,
    expiraEn: overrides.expiraEn ?? new Date(AHORA.getTime() + 600_000),
    intentos: overrides.intentos ?? 0,
    creadoEn: AHORA,
  });
}

describe('VerifyEmail', () => {
  let guardians: InMemoryGuardianRepository;
  let verifications: InMemoryEmailVerificationRepository;
  let useCase: VerifyEmail;

  beforeEach(() => {
    guardians = new InMemoryGuardianRepository();
    verifications = new InMemoryEmailVerificationRepository();
    useCase = new VerifyEmail({
      guardians,
      verifications,
      hasher: new FakePasswordHasher(),
      now: () => AHORA,
      maxIntentos: 5,
    });
  });

  it('con el código correcto marca el email verificado y lo devuelve', async () => {
    await guardians.save(guardianNoVerificado());
    await verifications.guardar(verificacion());

    const out = await useCase.execute({ guardianId: 'g-1', codigo: '123456' });

    expect(out.emailVerificado).toBe(true);
    expect((await guardians.findById('g-1'))?.emailVerificado).toBe(true);
    expect((await verifications.buscarPorGuardian('g-1'))?.estaVerificado()).toBe(true);
  });

  it('sin la cuenta lanza NotFoundError (404)', async () => {
    await expect(useCase.execute({ guardianId: 'ausente', codigo: '123456' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('sin verificación pendiente lanza NotFoundError (404)', async () => {
    await guardians.save(guardianNoVerificado());
    await expect(useCase.execute({ guardianId: 'g-1', codigo: '123456' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('si ya está verificado lanza DomainError', async () => {
    await guardians.save(guardianNoVerificado());
    await verifications.guardar(verificacion().marcarVerificado(AHORA));
    await expect(useCase.execute({ guardianId: 'g-1', codigo: '123456' })).rejects.toThrow(
      DomainError,
    );
  });

  it('con código incorrecto suma un intento y lanza VerificationCodeError (400)', async () => {
    await guardians.save(guardianNoVerificado());
    await verifications.guardar(verificacion());

    await expect(useCase.execute({ guardianId: 'g-1', codigo: '000000' })).rejects.toThrow(
      VerificationCodeError,
    );
    expect((await verifications.buscarPorGuardian('g-1'))?.intentos).toBe(1);
    expect((await guardians.findById('g-1'))?.emailVerificado).toBe(false);
  });

  it('con código caducado lanza VerificationCodeError (400)', async () => {
    await guardians.save(guardianNoVerificado());
    await verifications.guardar(verificacion({ expiraEn: new Date(AHORA.getTime() - 1) }));

    await expect(useCase.execute({ guardianId: 'g-1', codigo: '123456' })).rejects.toThrow(
      VerificationCodeError,
    );
  });

  it('superado el máximo de intentos lanza TooManyRequestsError (429)', async () => {
    await guardians.save(guardianNoVerificado());
    await verifications.guardar(verificacion({ intentos: 5 }));

    await expect(useCase.execute({ guardianId: 'g-1', codigo: '123456' })).rejects.toThrow(
      TooManyRequestsError,
    );
  });
});
