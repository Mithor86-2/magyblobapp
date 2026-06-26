import { describe, expect, it } from 'vitest';
import type { ChildProfile, Guardian } from '../domain/types';
import { resolveInitialRoute } from './initialRoute';

/**
 * Lógica de arranque (US-49): qué pantalla muestra el app al recuperar la sesión
 * persistida, según haya sesión, perfil activo y cuántos hijos tenga el guardián.
 * Función pura → se prueba sin montar el árbol de navegación.
 */
const guardian: Guardian = {
  id: 'g-1',
  nombre: 'Ana',
  apellidos: 'García',
  email: 'ana@example.com',
  parentesco: 'madre',
  consentimientoDado: true,
};

const profile: ChildProfile = {
  id: 'p-1',
  guardianId: 'g-1',
  nombre: 'Mateo',
  edad: 4,
  idioma: 'es',
  avatar: 'a1',
  intereses: ['animales'],
};

const otroProfile: ChildProfile = { ...profile, id: 'p-2', nombre: 'Lucía', edad: 5 };

describe('resolveInitialRoute', () => {
  it('sin sesión → Dashboard (inicio sin sesión, US-50), sin auto-selección', () => {
    const { route, autoSelect } = resolveInitialRoute({
      guardian: null,
      currentProfile: null,
      profiles: [],
    });
    expect(route).toBe('Dashboard');
    expect(autoSelect).toBeNull();
  });

  it('con sesión y perfil activo → Main, sin auto-selección', () => {
    const { route, autoSelect } = resolveInitialRoute({
      guardian,
      currentProfile: profile,
      profiles: [profile, otroProfile],
    });
    expect(route).toBe('Main');
    expect(autoSelect).toBeNull();
  });

  it('con sesión, sin perfil activo y un único hijo → auto-selecciona ese perfil y Main', () => {
    const { route, autoSelect } = resolveInitialRoute({
      guardian,
      currentProfile: null,
      profiles: [profile],
    });
    expect(route).toBe('Main');
    expect(autoSelect).toEqual(profile);
  });

  it('con sesión, sin perfil activo y varios hijos → SelectProfile, sin auto-selección', () => {
    const { route, autoSelect } = resolveInitialRoute({
      guardian,
      currentProfile: null,
      profiles: [profile, otroProfile],
    });
    expect(route).toBe('SelectProfile');
    expect(autoSelect).toBeNull();
  });

  it('con sesión, sin perfil activo y ningún hijo → SelectProfile (invita a crear el primero)', () => {
    const { route, autoSelect } = resolveInitialRoute({
      guardian,
      currentProfile: null,
      profiles: [],
    });
    expect(route).toBe('SelectProfile');
    expect(autoSelect).toBeNull();
  });
});
