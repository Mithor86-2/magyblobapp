/**
 * Estado global de la app (Zustand).
 *
 * Sesión del guardián (Fase 5.5 + JWT US-45): se **persiste** (AsyncStorage) el
 * `guardian` completo, la `consentVersion`, el `currentProfile` (perfil activo) y
 * los **tokens JWT** (`accessToken` corto + `refreshToken` largo). Así un adulto
 * que vuelve recupera su sesión autenticada y su hijo seleccionado sin volver a
 * identificarse. `guardian` es el ancla del cumplimiento (todo perfil cuelga de un
 * Guardian). `logout()` borra la sesión (incluidos los tokens) y vuelve al onboarding.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../../infrastructure/storage';
import { setActiveChildName } from '../../infrastructure/sentry';
import type { ChildProfile, Guardian, GuardianSession, SessionTokens } from '../../domain/types';

interface AppState {
  guardian: Guardian | null;
  consentVersion: string | null;
  currentProfile: ChildProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Abre sesión tras alta/login: guarda el guardián, el consentimiento y los tokens. */
  setSession: (session: GuardianSession, consentVersion: string) => void;
  /** Reemplaza los tokens tras una renovación (refresh-on-401). */
  setTokens: (tokens: SessionTokens) => void;
  setProfile: (profile: ChildProfile) => void;
  /** Limpia el perfil activo para volver a elegir entre los hijos del guardián. */
  clearProfile: () => void;
  /** Cierra la sesión: borra guardián, perfil y tokens, vuelve al onboarding. */
  logout: () => void;
}

const SESION_VACIA = {
  guardian: null,
  consentVersion: null,
  currentProfile: null,
  accessToken: null,
  refreshToken: null,
} as const;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...SESION_VACIA,
      setSession: (session, consentVersion) => {
        const { accessToken, refreshToken, ...guardian } = session;
        set({ guardian, consentVersion, accessToken, refreshToken });
      },
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      // Al cambiar el perfil activo, registra/limpia el nombre del niño en Sentry
      // para redactarlo de los eventos antes de salir a terceros (US-40 / C-12).
      setProfile: (profile) => {
        setActiveChildName(profile.nombre);
        set({ currentProfile: profile });
      },
      clearProfile: () => {
        setActiveChildName(undefined);
        set({ currentProfile: null });
      },
      logout: () => {
        setActiveChildName(undefined);
        set({ ...SESION_VACIA });
      },
    }),
    {
      name: 'magyblob-app',
      storage: persistStorage,
      // Tras rehidratar la sesión persistida, re-registra el nombre del niño activo
      // para que el scrubbing de Sentry siga protegiéndolo al reabrir la app.
      onRehydrateStorage: () => (state) => setActiveChildName(state?.currentProfile?.nombre),
      // v2: la sesión incorpora los tokens JWT (US-45). El estado v0/v1 no los tiene,
      // así que se descarta (el adulto vuelve a identificarse una vez para obtenerlos).
      version: 2,
      migrate: () => ({ ...SESION_VACIA }),
      partialize: (state) => ({
        guardian: state.guardian,
        consentVersion: state.consentVersion,
        currentProfile: state.currentProfile,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
