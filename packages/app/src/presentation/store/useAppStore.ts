/**
 * Estado global de la app (Zustand).
 *
 * Sesión del guardián (Fase 5.5 + JWT US-45): se **persiste** (AsyncStorage) el
 * `guardian` completo, la `consentVersion`, el `currentProfile` (perfil activo),
 * la lista de `profiles` del guardián (US-49) y los **tokens JWT** (`accessToken`
 * corto + `refreshToken` largo). Así un adulto que vuelve recupera su sesión
 * autenticada y su hijo seleccionado sin volver a identificarse. `guardian` es el
 * ancla del cumplimiento (todo perfil cuelga de un Guardian). `profiles` es la
 * fuente única para decidir el arranque (auto-seleccionar el único perfil, US-49).
 * `logout()` borra la sesión (incluidos los tokens) y vuelve al onboarding.
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
  /** Hijos del guardián cargados en la sesión: fuente única para decidir el arranque (US-49). */
  profiles: ChildProfile[];
  accessToken: string | null;
  refreshToken: string | null;
  /** Abre sesión tras alta/login: guarda el guardián, el consentimiento y los tokens. */
  setSession: (session: GuardianSession, consentVersion: string) => void;
  /** Reemplaza los tokens tras una renovación (refresh-on-401). */
  setTokens: (tokens: SessionTokens) => void;
  setProfile: (profile: ChildProfile) => void;
  /** Guarda la lista de hijos del guardián (fuente única para el arranque, US-49). */
  setProfiles: (profiles: ChildProfile[]) => void;
  /** Limpia el perfil activo para volver a elegir entre los hijos del guardián. */
  clearProfile: () => void;
  /** Cierra la sesión: borra guardián, perfil y tokens, vuelve al onboarding. */
  logout: () => void;
}

const SESION_VACIA = {
  guardian: null,
  consentVersion: null,
  currentProfile: null,
  profiles: [] as ChildProfile[],
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
      setProfiles: (profiles) => set({ profiles }),
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
      // v3: la sesión incorpora la lista de `profiles` del guardián (US-49), que cambia
      // el shape persistido. El estado v0/v1/v2 no la tiene, así que se descarta (el adulto
      // vuelve a identificarse una vez para reconstruir la sesión).
      version: 3,
      migrate: () => ({ ...SESION_VACIA }),
      partialize: (state) => ({
        guardian: state.guardian,
        consentVersion: state.consentVersion,
        currentProfile: state.currentProfile,
        profiles: state.profiles,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
