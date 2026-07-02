import { expect, test } from '@playwright/test';
import { correoUnico } from './_correo';

/**
 * E2E de onboarding sobre Expo web contra el backend real (mock): la persona
 * adulta crea su cuenta (puerta parental incluida), crea un perfil de niño y
 * genera un cuento. Se localiza por rol/nombre accesible (coherente con US-30),
 * no por estructura ni estilos.
 */
test('onboarding: crear cuenta → crear perfil → generar cuento', async ({ page }, testInfo) => {
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

  // Formulario de alta del adulto. Se localiza por testID (robusto ante cambios en
  // el nº o el orden de campos: nombre, apellidos, email y contraseña US-48).
  await expect(page.getByTestId('alta-nombre')).toBeVisible();
  await page.getByTestId('alta-nombre').fill('Ana');
  await page.getByTestId('alta-apellidos').fill('García');
  await page.getByTestId('alta-email').fill(correoUnico(testInfo));
  await page.getByTestId('alta-password').fill('Contrasena123');
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
  await page.getByText('Cuentos', { exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Generar cuento' })).toBeVisible();
  await page.getByRole('button', { name: 'Generar cuento' }).click();

  // A1/A2 (US-73): al generar se abre el LECTOR con el cuento PAGINADO. La primera
  // página empieza con "Había una vez <nombre>, …" (mock determinista) y hay indicador
  // de página. Se asienta la frase completa (única del lector visible; el nombre suelto
  // también aparece oculto en las pestañas montadas detrás y daría un falso "hidden").
  await expect(page.getByText(/Había una vez Mateo/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Página 1 de/)).toBeVisible();
});
