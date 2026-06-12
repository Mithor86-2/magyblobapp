import { beforeEach, describe, expect, it } from 'vitest';
import { LoginGuardian } from '../../src/application/use-cases/LoginGuardian.js';
import { RegisterGuardian } from '../../src/application/use-cases/RegisterGuardian.js';
import { NotFoundError } from '../../src/domain/errors.js';
import {
  InMemoryGuardianRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

describe('LoginGuardian', () => {
  let guardians: InMemoryGuardianRepository;
  let login: LoginGuardian;

  beforeEach(async () => {
    guardians = new InMemoryGuardianRepository();
    login = new LoginGuardian({ guardians });

    // Da de alta un adulto contra el que iniciar sesión.
    await new RegisterGuardian({
      guardians,
      newId: secuencialIdGenerator('g'),
      now: relojFijo(),
    }).execute({
      nombre: 'Ana',
      apellidos: 'García',
      email: 'ana@example.com',
      parentesco: 'madre',
      consentimientoAceptado: true,
      consentimientoVersion: 'v1',
    });
  });

  it('identifica al adulto por su email y devuelve su cuenta', async () => {
    const out = await login.execute({ email: 'ana@example.com' });
    expect(out.id).toBe('g-1');
    expect(out.email).toBe('ana@example.com');
    expect(out.consentimientoDado).toBe(true);
  });

  it('lanza NotFoundError si no hay cuenta con ese email', async () => {
    await expect(login.execute({ email: 'desconocido@example.com' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('normaliza el email (mayúsculas y espacios) y encuentra la cuenta', async () => {
    const out = await login.execute({ email: '  ANA@Example.com  ' });
    expect(out.id).toBe('g-1');
    expect(out.email).toBe('ana@example.com');
  });
});
