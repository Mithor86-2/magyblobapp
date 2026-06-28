-- US-63: marcar cuentos y actividades como favoritos. Flag booleano por
-- cuento/actividad (que ya cuelgan de un perfil); "favoritas por perfil" sin
-- tabla nueva. NOT NULL con DEFAULT false: las filas existentes quedan en false.

-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "favorito" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "favorito" BOOLEAN NOT NULL DEFAULT false;
