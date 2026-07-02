-- US-78: "Continuar la historia". Id del cuento del que este es continuación, para
-- encadenar capítulos. NULL en un cuento inicial y en filas anteriores.
ALTER TABLE "stories" ADD COLUMN "continuacionDe" TEXT;
