/**
 * Tipado de las claves de traducción para `t()` y `useTranslation()` (US-57).
 * Toma el diccionario español como fuente de verdad de las claves disponibles;
 * el inglés comparte el shape (`en: typeof es`), así que basta con `es`.
 */
import 'react-i18next';
import type { es } from './locales/es';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof es;
    };
  }
}
