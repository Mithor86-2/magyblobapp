// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProfile, Guardian } from '../../domain/types';

/**
 * Store de sesión (Zustand + persist). Tier IMPORTANT (Strategic Coverage, US-35):
 * gestiona la sesión del adulto y el perfil activo; el consentimiento es el ancla
 * del cumplimiento. AsyncStorage se sustituye por un doble en memoria.
 */
const mem = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: async (k: string) => {
      mem.delete(k);
    },
  },
}));

const { useAppStore } = await import('./useAppStore');

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

beforeEach(() => {
  mem.clear();
  useAppStore.setState({ guardian: null, consentVersion: null, currentProfile: null });
});

describe('useAppStore', () => {
  it('arranca sin sesión', () => {
    const s = useAppStore.getState();
    expect(s.guardian).toBeNull();
    expect(s.currentProfile).toBeNull();
  });

  it('setGuardian guarda el adulto y la versión de consentimiento', () => {
    useAppStore.getState().setGuardian(guardian, 'v1.0');
    expect(useAppStore.getState().guardian).toEqual(guardian);
    expect(useAppStore.getState().consentVersion).toBe('v1.0');
  });

  it('setProfile selecciona el perfil activo', () => {
    useAppStore.getState().setProfile(profile);
    expect(useAppStore.getState().currentProfile).toEqual(profile);
  });

  it('clearProfile borra el perfil pero conserva la sesión', () => {
    useAppStore.getState().setGuardian(guardian, 'v1.0');
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().clearProfile();
    const s = useAppStore.getState();
    expect(s.currentProfile).toBeNull();
    expect(s.guardian).toEqual(guardian);
  });

  it('logout borra toda la sesión', () => {
    useAppStore.getState().setGuardian(guardian, 'v1.0');
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().logout();
    const s = useAppStore.getState();
    expect(s.guardian).toBeNull();
    expect(s.consentVersion).toBeNull();
    expect(s.currentProfile).toBeNull();
  });

  it('migra el estado v0 descartando la sesión (el adulto vuelve a identificarse)', async () => {
    // Estado persistido en el formato antiguo (v0): no se puede reconstruir.
    mem.set('magyblob-app', JSON.stringify({ state: { guardianId: 'g-viejo' }, version: 0 }));
    await useAppStore.persist.rehydrate();
    const s = useAppStore.getState();
    expect(s.guardian).toBeNull();
    expect(s.currentProfile).toBeNull();
  });
});
