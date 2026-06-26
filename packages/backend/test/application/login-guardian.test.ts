import { beforeEach, describe, expect, it } from 'vitest';
import { LoginGuardian } from '../../src/application/use-cases/LoginGuardian.js';
import { RegisterGuardian } from '../../src/application/use-cases/RegisterGuardian.js';
import { InvalidCredentialsError } from '../../src/domain/errors.js';
import {
  CLAVE_DE_PRUEBA,
  FakePasswordHasher,
  InMemoryGuardianRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

const PASSWORD = CLAVE_DE_PRUEBA;

describe('LoginGuardian', () => {
  let guardians: InMemoryGuardianRepository;
  let login: LoginGuardian;

  beforeEach(async () => {
    guardians = new InMemoryGuardianRepository();
    const hasher = new FakePasswordHasher();
    login = new LoginGuardian({ guardians, hasher });

    // Da de alta un adulto (con contraseña) contra el que iniciar sesión.
    await new RegisterGuardian({
      guardians,
      hasher,
      newId: secuencialIdGenerator('g'),
      now: relojFijo(),
    }).execute({
      nombre: 'Ana',
      apellidos: 'García',
      email: 'ana@example.com',
      parentesco: 'madre',
      password: PASSWORD,
      consentimientoAceptado: true,
      consentimientoVersion: 'v1',
    });
  });

  it('verifica email + contraseña correctos y devuelve la cuenta', async () => {
    const out = await login.execute({ email: 'ana@example.com', password: PASSWORD });
    expect(out.id).toBe('g-1');
    expect(out.email).toBe('ana@example.com');
    expect(out.consentimientoDado).toBe(true);
  });

  it('lanza InvalidCredentialsError si la contraseña es incorrecta', async () => {
    await expect(
      login.execute({ email: 'ana@example.com', password: 'incorrecta' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('lanza el MISMO InvalidCredentialsError si el email no existe (no filtra cuál falló)', async () => {
    await expect(
      login.execute({ email: 'desconocido@example.com', password: PASSWORD }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('normaliza el email (mayúsculas y espacios) y encuentra la cuenta', async () => {
    const out = await login.execute({ email: '  ANA@Example.com  ', password: PASSWORD });
    expect(out.id).toBe('g-1');
    expect(out.email).toBe('ana@example.com');
  });
});
