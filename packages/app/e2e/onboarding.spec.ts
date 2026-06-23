import { expect, test } from '@playwright/test';

/**
 * E2E de onboarding sobre Expo web contra el backend real (mock): la persona
 * adulta crea su cuenta (puerta parental incluida), crea un perfil de niño y
 * genera un cuento. Se localiza por rol/nombre accesible (coherente con US-30),
 * no por estructura ni estilos.
 */
test('onboarding: crear cuenta → crear perfil → generar cuento', async ({ page }) => {
  await page.goto('/');

  // Bienvenida
  await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  // Puerta parental: resolver la suma "a + b = ?"
  const pregunta = page.getByText(/\d+\s*\+\s*\d+\s*=/);
  await expect(pregunta).toBeVisible();
  const texto = (await pregunta.textContent()) ?? '';
  const m = texto.match(/(\d+)\s*\+\s*(\d+)/);
  expect(m).not.toBeNull();
  const suma = Number(m![1]) + Number(m![2]);
  await page.getByRole('button', { name: String(suma), exact: true }).click();

  // Formulario de alta del adulto (3 campos de texto en orden: nombre, apellidos, email)
  const campos = page.getByRole('textbox');
  await expect(campos).toHaveCount(3);
  await campos.nth(0).fill('Ana');
  await campos.nth(1).fill('García');
  await campos.nth(2).fill('ana.app.e2e@example.com');
  await page.getByRole('button', { name: 'Madre' }).click();
  await page.getByRole('button', { name: 'Acepto', exact: true }).click();
  await page.getByRole('button', { name: 'Aceptar y continuar' }).click();

  // Selección de perfil (sin perfiles aún) → crear el primero
  await page.getByRole('button', { name: 'Crear nuevo perfil' }).click();

  // Crear perfil de niño
  await page.getByPlaceholder('Tu nombre').fill('Mateo');
  await page.getByRole('button', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: 'zorro' }).click();
  await page.getByRole('button', { name: 'Animales' }).click();
  await page.getByRole('button', { name: '¡Listo!' }).click();

  // Pestañas: ir a "Cuentos" y generar
  await page.getByText('Cuentos', { exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Generar cuento' })).toBeVisible();
  await page.getByRole('button', { name: 'Generar cuento' }).click();

  // El cuento (mock determinista) aparece con el nombre del niño
  await expect(page.getByText(/Había una vez/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Mateo/).first()).toBeVisible();
});
