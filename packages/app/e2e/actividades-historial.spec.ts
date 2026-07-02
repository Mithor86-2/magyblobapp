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
 * estilos. El contenido es determinista (modo mock, `MockProvider`), pero el **título
 * del cuento varía** (US-54), así que el historial se localiza por el prefijo estable de
 * la etiqueta accesible «Leer el cuento …», no por el título exacto. Valida el export web.
 *
 * Cada test de Playwright arranca con un contexto/página nuevos, así que el
 * onboarding se rehace dentro del propio test (el helper de abajo). El backend
 * persiste estado entre tests y navegadores, por eso cada test se da de alta con un
 * email único (`correoUnico`, ver `_correo.ts`) y así no choca con "email ya
 * registrado".
 */

/** Nombre del niño usado en este spec (aparece en el cuerpo del cuento del mock). */
const NOMBRE_NINO = 'Lucia';

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

  // Formulario de alta del adulto. Localizado por testID (robusto ante cambios en
  // el nº/orden de campos: nombre, apellidos, email y contraseña US-48).
  await expect(page.getByTestId('alta-nombre')).toBeVisible();
  await page.getByTestId('alta-nombre').fill('Marta');
  await page.getByTestId('alta-apellidos').fill('López');
  // Email único por test (ver `_correo.ts`): el backend persiste entre tests y
  // navegadores, así que un email fijo chocaría con "email ya registrado".
  await page.getByTestId('alta-email').fill(correo);
  await page.getByTestId('alta-password').fill('Contrasena123');
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

  // A1/A2 (US-73): al generar se navega al LECTOR (Stack raíz) con el cuento PAGINADO.
  // La primera página empieza con "Había una vez <nombre>, …" (mock determinista) y hay
  // indicador de página. Se asienta la frase completa (única del lector visible; el nombre
  // suelto también aparece oculto en las pestañas montadas detrás y daría un falso "hidden").
  await expect(page.getByText(new RegExp(`Había una vez ${NOMBRE_NINO}`))).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/Página 1 de/)).toBeVisible();

  // El lector es una pantalla del stack raíz montada SOBRE las pestañas y este navegador
  // no está enganchado al historial del navegador (no hay `linking`), así que `goBack()` no
  // sirve. Recargar rearranca la app: la sesión y el perfil persisten (US-49/US-50) y la
  // ruta inicial resuelve a las pestañas (`Main`); el cuento ya quedó guardado en backend.
  await page.reload();
  await expect(page.getByText('Historial', { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
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
  // El título varía (US-54), así que basta el prefijo estable de la etiqueta.
  await expect(page.getByRole('button', { name: /^Leer el cuento / }).first()).toBeVisible({
    timeout: 30_000,
  });
});
