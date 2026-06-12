/**
 * Estado global de la app (Zustand).
 *
 * Sesión del guardián (Fase 5.5): se **persiste** (AsyncStorage) el `guardian`
 * completo, la `consentVersion` y el `currentProfile` (perfil activo). Así un
 * adulto que vuelve recupera su sesión y su hijo seleccionado sin volver a
 * identificarse. `guardian` es el ancla del cumplimiento (todo perfil cuelga de
 * un Guardian). `logout()` borra la sesión y devuelve al onboarding.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../../infrastructure/storage';
import type { ChildProfile, Guardian } from '../../domain/types';

interface AppState {
  guardian: Guardian | null;
  consentVersion: string | null;
  currentProfile: ChildProfile | null;
  setGuardian: (guardian: Guardian, consentVersion: string) => void;
  setProfile: (profile: ChildProfile) => void;
  /** Limpia el perfil activo para volver a elegir entre los hijos del guardián. */
  clearProfile: () => void;
  /** Cierra la sesión: borra guardián y perfil, vuelve al onboarding. */
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      guardian: null,
      consentVersion: null,
      currentProfile: null,
      setGuardian: (guardian, consentVersion) => set({ guardian, consentVersion }),
      setProfile: (profile) => set({ currentProfile: profile }),
      clearProfile: () => set({ currentProfile: null }),
      logout: () => set({ guardian: null, consentVersion: null, currentProfile: null }),
    }),
    {
      name: 'magyblob-app',
      storage: persistStorage,
      // v1: la sesión pasa de `guardianId` (string) al `guardian` completo + perfil
      // activo. El estado v0 no puede reconstruir el guardián desde solo el id, así
      // que se descarta (el adulto vuelve a identificarse una vez).
      version: 1,
      migrate: () => ({ guardian: null, consentVersion: null, currentProfile: null }),
      partialize: (state) => ({
        guardian: state.guardian,
        consentVersion: state.consentVersion,
        currentProfile: state.currentProfile,
      }),
    },
  ),
);
