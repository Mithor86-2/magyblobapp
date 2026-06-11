import { beforeEach, describe, expect, it } from 'vitest';
import { CreateChildProfile } from '../../src/application/use-cases/CreateChildProfile.js';
import { RegisterGuardian } from '../../src/application/use-cases/RegisterGuardian.js';
import { DomainError } from '../../src/domain/errors.js';
import type { CreateChildProfileInput } from '../../src/application/dto.js';
import {
  InMemoryChildProfileRepository,
  InMemoryGuardianRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

describe('CreateChildProfile', () => {
  let guardians: InMemoryGuardianRepository;
  let profiles: InMemoryChildProfileRepository;
  let useCase: CreateChildProfile;
  let guardianId: string;

  beforeEach(async () => {
    guardians = new InMemoryGuardianRepository();
    profiles = new InMemoryChildProfileRepository();

    const register = new RegisterGuardian({
      guardians,
      newId: secuencialIdGenerator('g'),
      now: relojFijo(),
    });
    const guardian = await register.execute({
      nombre: 'Ana',
      apellidos: 'García',
      email: 'ana@example.com',
      parentesco: 'madre',
      consentimientoAceptado: true,
      consentimientoVersion: 'v1',
    });
    guardianId = guardian.id;

    useCase = new CreateChildProfile({
      profiles,
      guardians,
      newId: secuencialIdGenerator('p'),
      now: relojFijo(),
    });
  });

  function input(overrides: Partial<CreateChildProfileInput> = {}): CreateChildProfileInput {
    return {
      guardianId,
      nombre: 'Mateo',
      edad: 4,
      idioma: 'es',
      avatar: 'avatar-3',
      intereses: ['animales', 'espacio'],
      ...overrides,
    };
  }

  it('crea el perfil asociado a un adulto con consentimiento', async () => {
    const out = await useCase.execute(input());
    expect(out.id).toBe('p-1');
    expect(out.guardianId).toBe(guardianId);
    expect(out.edad).toBe(4);
    expect(out.intereses).toEqual(['animales', 'espacio']);
    expect(profiles.items.size).toBe(1);
  });

  it('aplica el idioma por defecto (es) si no se indica', async () => {
    const out = await useCase.execute(input({ idioma: undefined }));
    expect(out.idioma).toBe('es');
  });

  it('rechaza una edad fuera de rango', async () => {
    await expect(useCase.execute(input({ edad: 9 }))).rejects.toThrow(DomainError);
    expect(profiles.items.size).toBe(0);
  });

  it('rechaza si el adulto no existe', async () => {
    await expect(useCase.execute(input({ guardianId: 'inexistente' }))).rejects.toThrow(
      DomainError,
    );
  });

  it('rechaza un interés fuera del vocabulario', async () => {
    await expect(useCase.execute(input({ intereses: ['futbol'] }))).rejects.toThrow(DomainError);
  });
});
