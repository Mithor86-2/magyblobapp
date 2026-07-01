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
import { cambiarIdiomaApp, DEFAULT_APP_LANGUAGE, type AppLanguage } from '../../i18n';
// Tipo y default del tema desde `tokens` (no desde `ThemeProvider`) para evitar el
// ciclo de import store→ThemeProvider→store: `tokens` no depende del store.
import { DEFAULT_THEME_PREFERENCE, type ThemePreference } from '../theme/tokens';
import type { ChildProfile, Guardian, GuardianSession, SessionTokens } from '../../domain/types';

interface AppState {
  guardian: Guardian | null;
  consentVersion: string | null;
  currentProfile: ChildProfile | null;
  /** Hijos del guardián cargados en la sesión: fuente única para decidir el arranque (US-49). */
  profiles: ChildProfile[];
  accessToken: string | null;
  refreshToken: string | null;
  /**
   * Idioma de la **interfaz** del app (US-57), distinto del idioma del PERFIL del
   * niño (que gobierna la generación de los cuentos en el backend). Se persiste y
   * se cambia desde la zona de adultos; al fijarlo se aplica a i18next.
   */
  appLanguage: AppLanguage;
  /** Cambia el idioma de la interfaz y lo aplica a i18next (US-57). */
  setAppLanguage: (lng: AppLanguage) => void;
  /**
   * Preferencia de tema de la interfaz (US-66): `system` sigue al SO, o se fuerza
   * `light`/`dark`. Es preferencia de UI (como `appLanguage`): se persiste y NO se
   * borra al cerrar sesión. El esquema efectivo lo resuelve el `ThemeProvider`.
   */
  themePreference: ThemePreference;
  /** Fija la preferencia de tema (Automático/Claro/Oscuro) desde la zona de adultos (US-66). */
  setThemePreference: (preference: ThemePreference) => void;
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
      // El idioma del app es una preferencia de UI: arranca con la sugerencia del
      // dispositivo y NO se borra al cerrar sesión (a diferencia de la sesión).
      appLanguage: DEFAULT_APP_LANGUAGE,
      setAppLanguage: (lng) => {
        cambiarIdiomaApp(lng);
        set({ appLanguage: lng });
      },
      // El tema es una preferencia de UI: arranca siguiendo al sistema y NO se
      // borra al cerrar sesión (como el idioma del app).
      themePreference: DEFAULT_THEME_PREFERENCE,
      setThemePreference: (preference) => set({ themePreference: preference }),
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
      // para que el scrubbing de Sentry siga protegiéndolo al reabrir la app, y
      // aplica a i18next el idioma del app persistido (US-57); si no hay (estado
      // migrado o primer arranque), usa el idioma por defecto `es` (feature 64: ya
      // no se detecta el idioma del dispositivo; lo elige la persona adulta).
      onRehydrateStorage: () => (state) => {
        setActiveChildName(state?.currentProfile?.nombre);
        cambiarIdiomaApp(state?.appLanguage ?? DEFAULT_APP_LANGUAGE);
      },
      // v5 (US-66): el estado incorpora `themePreference` (tema de la interfaz). v4
      // (US-57) añadió `appLanguage`; v3 añadió la lista de `profiles` (US-49). El
      // estado anterior se descarta (el adulto vuelve a identificarse una vez); el
      // idioma cae a `es` y el tema a `system` (seguir al SO).
      version: 5,
      migrate: () => ({
        ...SESION_VACIA,
        appLanguage: DEFAULT_APP_LANGUAGE,
        themePreference: DEFAULT_THEME_PREFERENCE,
      }),
      partialize: (state) => ({
        guardian: state.guardian,
        consentVersion: state.consentVersion,
        currentProfile: state.currentProfile,
        profiles: state.profiles,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        appLanguage: state.appLanguage,
        themePreference: state.themePreference,
      }),
    },
  ),
);
