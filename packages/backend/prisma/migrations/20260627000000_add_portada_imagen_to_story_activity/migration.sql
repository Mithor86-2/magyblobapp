-- US-59: portadas de imagen de cuentos y actividades (data URL generada con
-- Gemini/Imagen, o NULL si no se generó; la app cae al respaldo local).

-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "portada" TEXT;

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "imagen" TEXT;
