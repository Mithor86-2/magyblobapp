-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "telefono" TEXT,
    "consentimientoDado" BOOLEAN NOT NULL,
    "consentimientoEn" TIMESTAMP(3) NOT NULL,
    "consentimientoVer" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "idioma" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "intereses" TEXT[],
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "estilo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'nuevo',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "duracionMin" INTEGER,
    "nivel" INTEGER,
    "completadaEn" TIMESTAMP(3),
    "valoracion" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_events" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "metadatos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "descripcion" TEXT,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guardians_email_key" ON "guardians"("email");

-- CreateIndex
CREATE INDEX "child_profiles_guardianId_idx" ON "child_profiles"("guardianId");

-- CreateIndex
CREATE INDEX "stories_profileId_idx" ON "stories"("profileId");

-- CreateIndex
CREATE INDEX "activities_profileId_idx" ON "activities"("profileId");

-- CreateIndex
CREATE INDEX "interaction_events_profileId_idx" ON "interaction_events"("profileId");

-- CreateIndex
CREATE INDEX "audit_logs_guardianId_idx" ON "audit_logs"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_events" ADD CONSTRAINT "interaction_events_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE SET NULL ON UPDATE CASCADE;
