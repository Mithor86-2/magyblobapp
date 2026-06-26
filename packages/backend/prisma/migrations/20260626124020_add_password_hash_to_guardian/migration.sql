-- Añade `passwordHash` a `guardians` (US-48): la cuenta del adulto pasa a guardar
-- el hash de la contraseña (bcrypt) y el login a verificarla. El hash es irreversible
-- y nunca contiene la contraseña en claro.
--
-- La columna es NOT NULL. Para no romper filas preexistentes (entornos de desarrollo
-- con cuentas creadas antes de esta feature), se añade con un DEFAULT vacío temporal
-- que se retira acto seguido: las cuentas nuevas DEBEN aportar su hash (el dominio y
-- la ruta lo exigen), y una fila con hash vacío no puede iniciar sesión (bcrypt.compare
-- contra '' siempre falla → 401), así que ninguna contraseña queda aceptada por defecto.
ALTER TABLE "guardians" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "guardians" ALTER COLUMN "passwordHash" DROP DEFAULT;
