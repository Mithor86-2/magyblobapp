/**
 * Inicialización de i18n del app (US-57).
 *
 * `i18next` + `react-i18next` con los recursos `es`/`en` **empaquetados en
 * build-time** (sin red ni descarga de traducciones en runtime, conforme a
 * Docs/cumplimiento-menores.md). La init es **síncrona** (recursos en memoria,
 * sin backend asíncrono ni `Suspense`): `t('clave')` devuelve la cadena correcta
 * desde el primer render, por lo que los componentes funcionan con la instancia
 * global sin envolverlos en un Provider (lo que mantienen los tests existentes).
 *
 * El **idioma por defecto y de respaldo es `es`**: los textos en español se
 * conservan idénticos bajo claves, así las pruebas user-centric que consultan
 * por texto en español siguen verdes. El idioma real del app lo decide
 * `useAppStore.appLanguage` (persistido); aquí solo se fija el arranque.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { es } from './locales/es';
import { en } from './locales/en';

export const IDIOMAS_APP = ['es', 'en'] as const;
export type AppLanguage = (typeof IDIOMAS_APP)[number];

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'es';

/** ¿Es `code` uno de los idiomas soportados por la interfaz del app? */
export function esIdiomaApp(code: string | null | undefined): code is AppLanguage {
  return code === 'es' || code === 'en';
}

/**
 * Sugerencia inicial del idioma a partir del dispositivo (`expo-localization`):
 * solo se usa en el primer arranque (sin preferencia guardada) y únicamente si el
 * idioma del dispositivo es uno de los soportados; en cualquier otro caso, `es`.
 */
export function detectDeviceLanguage(): AppLanguage {
  try {
    const code = getLocales()[0]?.languageCode;
    return esIdiomaApp(code) ? code : DEFAULT_APP_LANGUAGE;
  } catch {
    return DEFAULT_APP_LANGUAGE;
  }
}

export const resources = {
  es: { translation: es },
  en: { translation: en },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_APP_LANGUAGE,
  fallbackLng: DEFAULT_APP_LANGUAGE,
  supportedLngs: [...IDIOMAS_APP],
  // RN/Hermes: el formato de plurales v4 evita la dependencia de Intl.PluralRules.
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
  // Init **síncrona** (recursos en memoria): `initAsync: false` (antes
  // `initImmediate`, renombrado en i18next v24) evita el diferido por defecto, de
  // modo que `t` resuelve desde el primer render sin Suspense (lo que necesitan los
  // tests, que renderizan sin Provider ni `await`).
  initAsync: false,
  react: { useSuspense: false },
});

/** Cambia el idioma de la interfaz (lo invoca el store al fijar `appLanguage`). */
export function cambiarIdiomaApp(lng: AppLanguage): void {
  void i18n.changeLanguage(lng);
}

export default i18n;
