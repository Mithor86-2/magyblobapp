/**
 * Setup común de Vitest para el app.
 *
 * Añade los matchers de `@testing-library/jest-dom` (`toBeDisabled`,
 * `toHaveAttribute`, `toBeVisible`, ...) a `expect`. Solo afectan a aserciones
 * sobre nodos del DOM, por lo que es inocuo para los tests en entorno `node`.
 */
import '@testing-library/jest-dom/vitest';
