// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProfile, Guardian, GuardianSession } from '../../domain/types';

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

const session: GuardianSession = { ...guardian, accessToken: 'at-1', refreshToken: 'rt-1' };

beforeEach(() => {
  mem.clear();
  useAppStore.setState({
    guardian: null,
    consentVersion: null,
    currentProfile: null,
    accessToken: null,
    refreshToken: null,
  });
});

describe('useAppStore', () => {
  it('arranca sin sesión', () => {
    const s = useAppStore.getState();
    expect(s.guardian).toBeNull();
    expect(s.currentProfile).toBeNull();
  });

  it('setSession guarda el adulto, el consentimiento y los tokens', () => {
    useAppStore.getState().setSession(session, 'v1.0');
    const s = useAppStore.getState();
    expect(s.guardian).toEqual(guardian);
    expect(s.consentVersion).toBe('v1.0');
    expect(s.accessToken).toBe('at-1');
    expect(s.refreshToken).toBe('rt-1');
  });

  it('setTokens reemplaza los tokens (renovación) conservando guardián y perfil', () => {
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().setTokens({ accessToken: 'at-2', refreshToken: 'rt-2' });
    const s = useAppStore.getState();
    expect(s.accessToken).toBe('at-2');
    expect(s.refreshToken).toBe('rt-2');
    expect(s.guardian).toEqual(guardian);
    expect(s.currentProfile).toEqual(profile);
  });

  it('setProfile selecciona el perfil activo', () => {
    useAppStore.getState().setProfile(profile);
    expect(useAppStore.getState().currentProfile).toEqual(profile);
  });

  it('clearProfile borra el perfil pero conserva la sesión y los tokens', () => {
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().clearProfile();
    const s = useAppStore.getState();
    expect(s.currentProfile).toBeNull();
    expect(s.guardian).toEqual(guardian);
    expect(s.accessToken).toBe('at-1');
  });

  it('logout borra toda la sesión, incluidos los tokens', () => {
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().logout();
    const s = useAppStore.getState();
    expect(s.guardian).toBeNull();
    expect(s.consentVersion).toBeNull();
    expect(s.currentProfile).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
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
