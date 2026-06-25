import { expect, test, type Page } from '@playwright/test';
import { correoUnico } from './_correo';

/**
 * E2E de **actividades** e **historial** sobre Expo web contra el backend real
 * (mock), extendiendo el recorrido de onboarding de `onboarding.spec.ts` (US-32).
 *
 * Cubre los dos flujos de la zona infantil que solo tenían pruebas de componente:
 *  - Actividades recomendadas (US-09) y marcar una como realizada (US-10).
 *  - Historial de cuentos (US-08): el cuento generado aparece en "Cuentos mágicos".
 *
 * Se localiza por rol/nombre accesible (coherente con US-30), no por estructura ni
 * estilos. El contenido es determinista (modo mock, `MockProvider`): el cuento se
 * titula «{nombre} y la aventura de {tema}» y las actividades «Actividad de
 * {categoria} nº {n}». Valida el export web (Chromium), no la app nativa.
 *
 * Cada test de Playwright arranca con un contexto/página nuevos, así que el
 * onboarding se rehace dentro del propio test (el helper de abajo). El backend
 * persiste estado entre tests y navegadores, por eso cada test se da de alta con un
 * email único (`correoUnico`, ver `_correo.ts`) y así no choca con "email ya
 * registrado".
 */

/** Nombre del niño usado en este spec; aparece en el título del cuento del mock. */
const NOMBRE_NINO = 'Lucia';
/** Tema preseleccionado a partir del interés "Animales" → valor de vocabulario `animales`. */
const TITULO_CUENTO = new RegExp(`${NOMBRE_NINO} y la aventura de animales`);

/**
 * Recorre el onboarding (bienvenida → puerta parental → alta del adulto → crear
 * perfil → generar cuento) hasta dejar la app con perfil activo y un cuento ya
 * generado. Reutiliza el mismo patrón que `onboarding.spec.ts` sin tocarlo.
 */
async function completarOnboarding(page: Page, correo: string): Promise<void> {
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

  // Formulario de alta del adulto (3 campos: nombre, apellidos, email)
  const campos = page.getByRole('textbox');
  await expect(campos).toHaveCount(3);
  await campos.nth(0).fill('Marta');
  await campos.nth(1).fill('López');
  // Email único por test (ver `_correo.ts`): el backend persiste entre tests y
  // navegadores, así que un email fijo chocaría con "email ya registrado".
  await campos.nth(2).fill(correo);
  await page.getByRole('button', { name: 'Madre' }).click();
  await page.getByRole('button', { name: 'Acepto', exact: true }).click();
  await page.getByRole('button', { name: 'Aceptar y continuar' }).click();

  // Selección de perfil (sin perfiles aún) → crear el primero
  await page.getByRole('button', { name: 'Crear nuevo perfil' }).click();

  // Crear perfil de niño
  await page.getByPlaceholder('Tu nombre').fill(NOMBRE_NINO);
  await page.getByRole('button', { name: '4', exact: true }).click();
  await page.getByRole('button', { name: 'zorro' }).click();
  await page.getByRole('button', { name: 'Animales' }).click();
  await page.getByRole('button', { name: '¡Listo!' }).click();

  // Pestaña "Cuentos" → generar un cuento (queda en el historial del perfil)
  await page.getByText('Cuentos', { exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Generar cuento' })).toBeVisible();
  await page.getByRole('button', { name: 'Generar cuento' }).click();

  // El cuento (mock determinista) aparece con el nombre del niño
  await expect(page.getByText(/Había una vez/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(new RegExp(NOMBRE_NINO)).first()).toBeVisible();
}

test('actividades: generar recomendadas y marcar una como realizada', async ({
  page,
}, testInfo) => {
  await completarOnboarding(page, correoUnico(testInfo));

  // Ir a la pestaña "Actividades"
  await page.getByText('Actividades', { exact: true }).first().click();
  await expect(page.getByText('Actividades para hoy')).toBeVisible();

  // Generar actividades recomendadas (US-09)
  await page.getByRole('button', { name: 'Generar actividades' }).click();

  // Aparecen tarjetas del mock: «Actividad de {categoria} nº {n}».
  // Con categoría "Todas" el mock devuelve 3 (arte, musica, logica).
  await expect(page.getByText(/Actividad de arte nº 1/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Actividad de \w+ nº \d+/).first()).toBeVisible();

  // Marcar la primera actividad como realizada (US-10): "Realizado" → valoración.
  await page.getByRole('button', { name: 'Realizado' }).first().click();
  // Tras pulsar "Realizado" aparece la valoración en estrellas (botones accesibles
  // "N estrella(s)"); elegimos 3 estrellas.
  await page.getByRole('button', { name: '3 estrellas' }).first().click();

  // Efecto observable: la tarjeta pasa a "¡Hecha!".
  await expect(page.getByText('¡Hecha!').first()).toBeVisible();
});

test('historial: el cuento generado aparece en "Cuentos mágicos"', async ({ page }, testInfo) => {
  await completarOnboarding(page, correoUnico(testInfo));

  // Ir a la pestaña "Historial"
  await page.getByText('Historial', { exact: true }).first().click();
  await expect(page.getByText('Tu historial')).toBeVisible();

  // El cuento recién generado aparece bajo la sección "Cuentos mágicos" (US-08).
  await expect(page.getByText('Cuentos mágicos')).toBeVisible();
  // La tarjeta de cuento es un botón con etiqueta accesible "Leer el cuento {título}".
  await expect(
    page.getByRole('button', { name: new RegExp(`Leer el cuento ${TITULO_CUENTO.source}`) }),
  ).toBeVisible({ timeout: 30_000 });
});
