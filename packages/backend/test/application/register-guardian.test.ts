import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterGuardian } from '../../src/application/use-cases/RegisterGuardian.js';
import { DomainError } from '../../src/domain/errors.js';
import type { RegisterGuardianInput } from '../../src/application/dto.js';
import {
  InMemoryGuardianRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

function inputValido(overrides: Partial<RegisterGuardianInput> = {}): RegisterGuardianInput {
  return {
    nombre: 'Ana',
    apellidos: 'García López',
    email: 'ana@example.com',
    parentesco: 'madre',
    consentimientoAceptado: true,
    consentimientoVersion: 'v1',
    ...overrides,
  };
}

describe('RegisterGuardian', () => {
  let guardians: InMemoryGuardianRepository;
  let useCase: RegisterGuardian;

  beforeEach(() => {
    guardians = new InMemoryGuardianRepository();
    useCase = new RegisterGuardian({
      guardians,
      newId: secuencialIdGenerator('g'),
      now: relojFijo(),
    });
  });

  it('da de alta al adulto con consentimiento', async () => {
    const out = await useCase.execute(inputValido());
    expect(out.id).toBe('g-1');
    expect(out.consentimientoDado).toBe(true);
    expect(guardians.items.size).toBe(1);
  });

  it('rechaza el alta si no se acepta el consentimiento', async () => {
    await expect(useCase.execute(inputValido({ consentimientoAceptado: false }))).rejects.toThrow(
      DomainError,
    );
    expect(guardians.items.size).toBe(0);
  });

  it('rechaza email duplicado', async () => {
    await useCase.execute(inputValido());
    await expect(useCase.execute(inputValido())).rejects.toThrow(DomainError);
  });

  it('rechaza email con formato inválido', async () => {
    await expect(useCase.execute(inputValido({ email: 'no-es-email' }))).rejects.toThrow(
      DomainError,
    );
  });
});
