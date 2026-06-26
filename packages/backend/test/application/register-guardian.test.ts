import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterGuardian } from '../../src/application/use-cases/RegisterGuardian.js';
import { DomainError } from '../../src/domain/errors.js';
import type { RegisterGuardianInput } from '../../src/application/dto.js';
import {
  CLAVE_DE_PRUEBA,
  FakePasswordHasher,
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
    password: CLAVE_DE_PRUEBA,
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
      hasher: new FakePasswordHasher(),
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

  it('hashea la contraseña con el PasswordHasher y guarda el hash, no el plano', async () => {
    const clave = 'MiClaveSegura';
    await useCase.execute(inputValido({ password: clave }));
    const guardado = [...guardians.items.values()][0];
    // El doble hashea con prefijo; lo relevante es que NO se guarda el plano tal cual.
    expect(guardado.passwordHash).not.toBe(clave);
    expect(guardado.passwordHash).toBe(`hashed:${clave}`);
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

  it('normaliza el email y rechaza el duplicado aunque cambie el caso/espacios', async () => {
    await useCase.execute(inputValido({ email: 'ana@example.com' }));
    await expect(useCase.execute(inputValido({ email: '  ANA@Example.com  ' }))).rejects.toThrow(
      DomainError,
    );
  });

  it('rechaza email con formato inválido', async () => {
    await expect(useCase.execute(inputValido({ email: 'no-es-email' }))).rejects.toThrow(
      DomainError,
    );
  });
});
