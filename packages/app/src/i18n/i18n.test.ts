import { afterEach, describe, expect, it } from 'vitest';
import i18n, { cambiarIdiomaApp, DEFAULT_APP_LANGUAGE, esIdiomaApp, IDIOMAS_APP } from './index';

/**
 * Pruebas del sistema i18n (US-57): el idioma por defecto es `es`, `t` resuelve
 * las claves en español y en inglés según el idioma activo, y `cambiarIdiomaApp`
 * conmuta entre ambos. Se restaura `es` al final para no contaminar otros tests.
 */
afterEach(() => {
  void i18n.changeLanguage(DEFAULT_APP_LANGUAGE);
});

describe('i18n (US-57)', () => {
  it('arranca en español (idioma por defecto y de respaldo)', () => {
    expect(DEFAULT_APP_LANGUAGE).toBe('es');
    expect(IDIOMAS_APP).toEqual(['es', 'en']);
    expect(i18n.language).toBe('es');
    expect(i18n.t('common.createAccount')).toBe('Crear cuenta');
  });

  it('al cambiar a inglés, t devuelve el texto en inglés', () => {
    cambiarIdiomaApp('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('common.createAccount')).toBe('Create account');
    expect(i18n.t('nav.login')).toBe('Log in');
  });

  it('al volver a español, t devuelve el texto en español', () => {
    cambiarIdiomaApp('en');
    cambiarIdiomaApp('es');
    expect(i18n.t('common.createAccount')).toBe('Crear cuenta');
    expect(i18n.t('nav.login')).toBe('Iniciar sesión');
  });

  it('interpola variables en ambos idiomas', () => {
    cambiarIdiomaApp('es');
    expect(i18n.t('selectProfile.years', { edad: 4 })).toBe('4 años');
    cambiarIdiomaApp('en');
    expect(i18n.t('selectProfile.years', { edad: 4 })).toBe('4 years old');
  });

  it('traduce los vocabularios cerrados del dominio según el idioma', () => {
    cambiarIdiomaApp('es');
    expect(i18n.t('vocab.tema.musica')).toBe('Música');
    cambiarIdiomaApp('en');
    expect(i18n.t('vocab.tema.musica')).toBe('Music');
  });

  it('esIdiomaApp solo acepta los idiomas soportados', () => {
    expect(esIdiomaApp('es')).toBe(true);
    expect(esIdiomaApp('en')).toBe(true);
    expect(esIdiomaApp('fr')).toBe(false);
    expect(esIdiomaApp(null)).toBe(false);
    expect(esIdiomaApp(undefined)).toBe(false);
  });
});
