import { beforeEach, describe, expect, it } from 'vitest';
import { CreateChildProfile } from '../../src/application/use-cases/CreateChildProfile.js';
import { ListProfiles } from '../../src/application/use-cases/ListProfiles.js';
import { RegisterGuardian } from '../../src/application/use-cases/RegisterGuardian.js';
import {
  InMemoryChildProfileRepository,
  InMemoryGuardianRepository,
  relojFijo,
  secuencialIdGenerator,
} from '../support/doubles.js';

describe('ListProfiles', () => {
  let guardians: InMemoryGuardianRepository;
  let profiles: InMemoryChildProfileRepository;
  let listProfiles: ListProfiles;
  let create: CreateChildProfile;
  let guardianId: string;

  beforeEach(async () => {
    guardians = new InMemoryGuardianRepository();
    profiles = new InMemoryChildProfileRepository();

    const register = new RegisterGuardian({
      guardians,
      newId: secuencialIdGenerator('g'),
      now: relojFijo(),
    });
    guardianId = (
      await register.execute({
        nombre: 'Ana',
        apellidos: 'García',
        email: 'ana@example.com',
        parentesco: 'madre',
        consentimientoAceptado: true,
        consentimientoVersion: 'v1',
      })
    ).id;

    create = new CreateChildProfile({
      profiles,
      guardians,
      newId: secuencialIdGenerator('p'),
      now: relojFijo(),
    });
    listProfiles = new ListProfiles({ profiles });
  });

  it('devuelve los perfiles del adulto', async () => {
    await create.execute({
      guardianId,
      nombre: 'Mateo',
      edad: 4,
      avatar: 'a1',
      intereses: ['animales'],
    });
    await create.execute({
      guardianId,
      nombre: 'Sofía',
      edad: 5,
      avatar: 'a2',
      intereses: ['magia'],
    });

    const out = await listProfiles.execute({ guardianId });
    expect(out).toHaveLength(2);
    expect(out.map((p) => p.nombre).sort()).toEqual(['Mateo', 'Sofía']);
  });

  it('devuelve lista vacía si el adulto no tiene perfiles', async () => {
    const out = await listProfiles.execute({ guardianId: 'otro' });
    expect(out).toEqual([]);
  });
});
