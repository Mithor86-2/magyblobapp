-- CreateTable
CREATE TABLE "story_narrations" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "mp3" BYTEA NOT NULL,
    "voiceId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_narrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "story_narrations_storyId_key" ON "story_narrations"("storyId");

-- AddForeignKey
ALTER TABLE "story_narrations" ADD CONSTRAINT "story_narrations_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
