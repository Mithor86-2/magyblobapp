-- US-61: persistir el prompt (system + user) realmente usado para generar el
-- cuento/actividad. Columna nullable (filas existentes y modo anónimo no lo tienen).

-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "prompt" TEXT;

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "prompt" TEXT;
