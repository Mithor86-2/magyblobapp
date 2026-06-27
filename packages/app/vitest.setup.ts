/**
 * Setup común de Vitest para el app.
 *
 * Añade los matchers de `@testing-library/jest-dom` (`toBeDisabled`,
 * `toHaveAttribute`, `toBeVisible`, ...) a `expect`. Solo afectan a aserciones
 * sobre nodos del DOM, por lo que es inocuo para los tests en entorno `node`.
 */
import '@testing-library/jest-dom/vitest';

/**
 * Inicializa i18n (US-57) para todos los tests. La init es síncrona
 * (`initImmediate: false`) y el idioma por defecto es `es`, así `t('clave')`
 * devuelve el texto en español desde el primer render. Se importa aquí porque
 * varios tests **mockean el store** (que es por donde se cargaba i18n de forma
 * transitiva), de modo que sin este import i18next quedaría sin inicializar y
 * `t` devolvería la clave en crudo.
 */
import './src/i18n';
