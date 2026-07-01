-- US-69: enseñanza/valor opcional que dirige la moraleja del cuento.
-- Vocabulario cerrado en el dominio (amistad | emociones | valentia | honestidad);
-- NULL en filas anteriores y cuando el adulto no elige ninguna.
ALTER TABLE "stories" ADD COLUMN "ensenanza" TEXT;
