/**
 * Estado global de la app (Zustand).
 *
 * - `guardianId` se **persiste** (AsyncStorage): el alta del adulto con su
 *   consentimiento ocurre una vez; al reabrir la app saltamos directos a crear
 *   perfil. Es el ancla del cumplimiento (todo perfil cuelga de un Guardian).
 * - `currentProfile` es **transitorio** (sesión actual): el perfil recién creado
 *   sobre el que se genera el cuento. No se persiste en este slice.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChildProfileOutput } from '../api/types';

interface AppState {
  guardianId: string | null;
  consentVersion: string | null;
  currentProfile: ChildProfileOutput | null;
  setGuardian: (id: string, consentVersion: string) => void;
  setProfile: (profile: ChildProfileOutput) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      guardianId: null,
      consentVersion: null,
      currentProfile: null,
      setGuardian: (id, consentVersion) => set({ guardianId: id, consentVersion }),
      setProfile: (profile) => set({ currentProfile: profile }),
      reset: () => set({ guardianId: null, consentVersion: null, currentProfile: null }),
    }),
    {
      name: 'magyblob-app',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo el ancla de cumplimiento se persiste; el perfil es de sesión.
      partialize: (state) => ({
        guardianId: state.guardianId,
        consentVersion: state.consentVersion,
      }),
    },
  ),
);
