import type { TestInfo } from '@playwright/test';

/**
 * Email único por test. El backend E2E usa un Postgres efímero que **persiste
 * estado durante toda la corrida** y cada test (en cada `project`/navegador) rehace
 * el alta del adulto; reutilizar un email fijo choca con "email ya registrado" y el
 * onboarding no avanza. Derivar el email de `project` + título del test lo hace
 * único y estable entre ejecuciones, así las N tests × M navegadores no colisionan.
 *
 * Incluye también `retry`: en un reintento (`retries: 1` en CI) el Postgres efímero
 * ya tiene el alta del intento anterior, así que sin variar el email el retry chocaría
 * con "email ya registrado" y fallaría siempre (anulando el reintento). Cada intento
 * usa por tanto un email distinto.
 */
export function correoUnico(testInfo: TestInfo): string {
  // Se trunca la base ANTES de añadir el sufijo de reintento, para que `-rN` nunca
  // se corte (si no, dos intentos podrían acabar con el mismo email tras el slice).
  const base = `${testInfo.project.name}-${testInfo.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 44);
  return `e2e-${base}-r${testInfo.retry}@example.com`;
}
