import { beforeEach, describe, expect, it } from 'vitest';
import { ResendEmailVerification } from '../../src/application/use-cases/ResendEmailVerification.js';
import { SendEmailVerification } from '../../src/application/services/SendEmailVerification.js';
import { Guardian } from '../../src/domain/entities/Guardian.js';
import { DomainError, NotFoundError, TooManyRequestsError } from '../../src/domain/errors.js';
import {
  FakeCodeGenerator,
  FakeEmailService,
  FakePasswordHasher,
  HASH_DE_PRUEBA,
  InMemoryEmailVerificationRepository,
  InMemoryGuardianRepository,
} from '../support/doubles.js';

const AHORA = new Date('2026-07-03T12:00:00.000Z');

function guardian(overrides: Partial<{ emailVerificado: boolean }> = {}): Guardian {
  return new Guardian({
    id: 'g-1',
    nombre: 'Ana',
    apellidos: 'García',
    email: 'ana@example.com',
    parentesco: 'madre',
    passwordHash: HASH_DE_PRUEBA,
    consentimiento: { dado: true, fecha: AHORA, version: 'v1' },
    emailVerificado: overrides.emailVerificado ?? false,
    creadoEn: AHORA,
  });
}

describe('ResendEmailVerification', () => {
  let guardians: InMemoryGuardianRepository;
  let verifications: InMemoryEmailVerificationRepository;
  let email: FakeEmailService;
  let now: Date;
  let useCase: ResendEmailVerification;

  beforeEach(() => {
    guardians = new InMemoryGuardianRepository();
    verifications = new InMemoryEmailVerificationRepository();
    email = new FakeEmailService();
    now = AHORA;
    const sender = new SendEmailVerification({
      emailService: email,
      codeGenerator: new FakeCodeGenerator('654321'),
      hasher: new FakePasswordHasher(),
      verifications,
      newId: () => 'v-new',
      now: () => now,
      ttlMs: 600_000,
    });
    useCase = new ResendEmailVerification({
      guardians,
      verifications,
      sender,
      now: () => now,
      cooldownMs: 60_000,
    });
  });

  it('reenvía un código nuevo cuando no hay envío previo', async () => {
    await guardians.save(guardian());
    await useCase.execute({ guardianId: 'g-1' });
    expect(email.enviados).toHaveLength(1);
    expect(email.enviados[0].codigo).toBe('654321');
  });

  it('rechaza el reenvío dentro del cooldown (429)', async () => {
    await guardians.save(guardian());
    await useCase.execute({ guardianId: 'g-1' }); // primer envío en AHORA
    // Segundo intento inmediato (mismo instante) → dentro del cooldown.
    await expect(useCase.execute({ guardianId: 'g-1' })).rejects.toThrow(TooManyRequestsError);
    expect(email.enviados).toHaveLength(1);
  });

  it('permite reenviar pasado el cooldown', async () => {
    await guardians.save(guardian());
    await useCase.execute({ guardianId: 'g-1' });
    now = new Date(AHORA.getTime() + 60_001);
    await useCase.execute({ guardianId: 'g-1' });
    expect(email.enviados).toHaveLength(2);
  });

  it('no reenvía si el email ya está verificado', async () => {
    await guardians.save(guardian({ emailVerificado: true }));
    await expect(useCase.execute({ guardianId: 'g-1' })).rejects.toThrow(DomainError);
    expect(email.enviados).toHaveLength(0);
  });

  it('lanza NotFoundError si la cuenta no existe', async () => {
    await expect(useCase.execute({ guardianId: 'ausente' })).rejects.toThrow(NotFoundError);
  });
});
