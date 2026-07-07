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

const otroProfile: ChildProfile = {
  id: 'p-2',
  guardianId: 'g-1',
  nombre: 'Lucía',
  edad: 5,
  idioma: 'es',
  avatar: 'a2',
  intereses: ['espacio'],
};

const session: GuardianSession = { ...guardian, accessToken: 'at-1', refreshToken: 'rt-1' };

beforeEach(() => {
  mem.clear();
  useAppStore.setState({
    guardian: null,
    consentVersion: null,
    currentProfile: null,
    profiles: [],
    accessToken: null,
    refreshToken: null,
    sessionDataError: false,
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

  it('arranca con la lista de perfiles vacía', () => {
    expect(useAppStore.getState().profiles).toEqual([]);
  });

  it('setProfiles guarda la lista de hijos del guardián (fuente única del arranque)', () => {
    useAppStore.getState().setProfiles([profile, otroProfile]);
    expect(useAppStore.getState().profiles).toEqual([profile, otroProfile]);
  });

  it('clearProfile conserva la lista de perfiles (solo limpia el activo)', () => {
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().setProfiles([profile, otroProfile]);
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().clearProfile();
    expect(useAppStore.getState().currentProfile).toBeNull();
    expect(useAppStore.getState().profiles).toEqual([profile, otroProfile]);
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

  it('logout borra toda la sesión, incluidos los tokens y la lista de perfiles', () => {
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().setProfiles([profile, otroProfile]);
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().logout();
    const s = useAppStore.getState();
    expect(s.guardian).toBeNull();
    expect(s.consentVersion).toBeNull();
    expect(s.currentProfile).toBeNull();
    expect(s.profiles).toEqual([]);
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
  });

  it('arranca sin marca de error de datos (US-98)', () => {
    expect(useAppStore.getState().sessionDataError).toBe(false);
  });

  it('reportDataInconsistency cierra la sesión y activa sessionDataError (US-98)', () => {
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().setProfiles([profile, otroProfile]);
    useAppStore.getState().setProfile(profile);
    useAppStore.getState().reportDataInconsistency();
    const s = useAppStore.getState();
    expect(s.sessionDataError).toBe(true);
    expect(s.guardian).toBeNull();
    expect(s.currentProfile).toBeNull();
    expect(s.profiles).toEqual([]);
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
  });

  it('clearDataError baja la marca de error de datos (US-98)', () => {
    useAppStore.getState().reportDataInconsistency();
    expect(useAppStore.getState().sessionDataError).toBe(true);
    useAppStore.getState().clearDataError();
    expect(useAppStore.getState().sessionDataError).toBe(false);
  });

  it('arranca con el idioma del app por defecto (es)', () => {
    expect(useAppStore.getState().appLanguage).toBe('es');
  });

  it('arranca con la preferencia de tema por defecto (system, US-66)', () => {
    expect(useAppStore.getState().themePreference).toBe('system');
  });

  it('setThemePreference cambia la preferencia de tema (US-66)', () => {
    useAppStore.getState().setThemePreference('dark');
    expect(useAppStore.getState().themePreference).toBe('dark');
    useAppStore.getState().setThemePreference('light');
    expect(useAppStore.getState().themePreference).toBe('light');
    // Restaura el default para no contaminar otros tests.
    useAppStore.getState().setThemePreference('system');
  });

  it('logout NO borra la preferencia de tema (es preferencia de UI, US-66)', () => {
    useAppStore.getState().setThemePreference('dark');
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().logout();
    expect(useAppStore.getState().themePreference).toBe('dark');
    useAppStore.getState().setThemePreference('system');
  });

  it('persiste la preferencia de tema (partialize incluye `themePreference`, US-66)', async () => {
    useAppStore.getState().setThemePreference('light');
    await Promise.resolve();
    const persisted = JSON.parse(mem.get('magyblob-app') ?? '{}');
    expect(persisted.state.themePreference).toBe('light');
    useAppStore.getState().setThemePreference('system');
  });

  it('setAppLanguage cambia el idioma de la interfaz (US-57)', () => {
    useAppStore.getState().setAppLanguage('en');
    expect(useAppStore.getState().appLanguage).toBe('en');
    useAppStore.getState().setAppLanguage('es');
    expect(useAppStore.getState().appLanguage).toBe('es');
  });

  it('logout NO borra el idioma del app (es preferencia de UI, no de sesión)', () => {
    useAppStore.getState().setAppLanguage('en');
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().logout();
    expect(useAppStore.getState().appLanguage).toBe('en');
    // Restaura el idioma por defecto para no contaminar otros tests.
    useAppStore.getState().setAppLanguage('es');
  });

  it('persiste el idioma del app (partialize incluye `appLanguage`)', async () => {
    useAppStore.getState().setAppLanguage('en');
    await Promise.resolve();
    const persisted = JSON.parse(mem.get('magyblob-app') ?? '{}');
    expect(persisted.state.appLanguage).toBe('en');
    useAppStore.getState().setAppLanguage('es');
  });

  it('persiste la lista de perfiles (partialize incluye `profiles`)', async () => {
    useAppStore.getState().setSession(session, 'v1.0');
    useAppStore.getState().setProfiles([profile, otroProfile]);
    // Espera a que el middleware persist vuelque el estado a AsyncStorage.
    await Promise.resolve();
    const persisted = JSON.parse(mem.get('magyblob-app') ?? '{}');
    expect(persisted.state.profiles).toEqual([profile, otroProfile]);
  });

  it('migra el estado v2 descartando la sesión (cambia el shape persistido, v3)', async () => {
    // Estado persistido sin la lista de perfiles (v2): no se rehidrata.
    mem.set(
      'magyblob-app',
      JSON.stringify({ state: { guardian, accessToken: 'at-viejo' }, version: 2 }),
    );
    await useAppStore.persist.rehydrate();
    const s = useAppStore.getState();
    expect(s.guardian).toBeNull();
    expect(s.currentProfile).toBeNull();
    expect(s.profiles).toEqual([]);
  });
});
