-- Carga los parámetros del cuento por defecto en `app_settings`: temperatura 0.7 y longitud
-- 150–200 palabras. Se aplica con `prisma migrate deploy` al arrancar, de modo que un
-- `docker compose up` en limpio use estos valores sin necesidad de correr el seed.
-- Idempotente y respetuoso con el estado: `ON CONFLICT DO NOTHING` solo siembra si la clave no
-- existe, así que NO pisa una elección posterior del adulto (config conmutable en caliente).
INSERT INTO "app_settings" ("id", "key", "value", "descripcion", "actualizadoEn")
VALUES
  (gen_random_uuid(), 'story.temperature', '0.7', 'Creatividad del LLM (0-1).', now()),
  (
    gen_random_uuid(),
    'prompt.story.params',
    '{"palabrasMin":150,"palabrasMax":200,"rima":false,"formatos":["cuento","fabula","poema"]}',
    'Parámetros del cuento: longitud, rima y formatos (uno al azar por cuento).',
    now()
  )
ON CONFLICT ("key") DO NOTHING;
