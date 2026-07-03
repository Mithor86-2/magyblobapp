-- Verificación de titularidad del email por OTP (US-93).
--
-- Añade `emailVerificado` a `guardians` (por defecto `false` para cuentas nuevas)
-- y crea la tabla `email_verifications` (estado transitorio del OTP: hash del
-- código, caducidad, intentos y consumo).
--
-- Backfill: las cuentas que ya existían antes de esta feature se marcan como
-- verificadas para no bloquear su acceso (fueron creadas cuando no había
-- verificación); las nuevas nacen `false` y deben validar el código si hay SMTP.
ALTER TABLE "guardians" ADD COLUMN "emailVerificado" BOOLEAN NOT NULL DEFAULT false;
UPDATE "guardians" SET "emailVerificado" = true;

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "verificadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_guardianId_key" ON "email_verifications"("guardianId");

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;
