-- US-68: logros/recompensas desbloqueados por perfil. Solo el hecho (clave + fecha);
-- el progreso se calcula en caliente. Unicidad por perfil+clave (desbloqueo idempotente).
-- Se elimina en cascada con el perfil (GDPR).
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "desbloqueadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievements_profileId_clave_key" ON "achievements"("profileId", "clave");

-- CreateIndex
CREATE INDEX "achievements_profileId_idx" ON "achievements"("profileId");

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
