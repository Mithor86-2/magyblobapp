import type { TestInfo } from '@playwright/test';

/**
 * Email único por test. El backend E2E usa un Postgres efímero que **persiste
 * estado durante toda la corrida** y cada test (en cada `project`/navegador) rehace
 * el alta del adulto; reutilizar un email fijo choca con "email ya registrado" y el
 * onboarding no avanza. Derivar el email de `project` + título del test lo hace
 * único y estable entre ejecuciones, así las N tests × M navegadores no colisionan.
 */
export function correoUnico(testInfo: TestInfo): string {
  const slug = `${testInfo.project.name}-${testInfo.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  return `e2e-${slug}@example.com`;
}
