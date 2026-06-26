-- Carga el modo cloud como configuración por defecto (ACTIVO) en `app_settings`.
-- Se aplica con `prisma migrate deploy` al arrancar el backend, de modo que un
-- `docker compose up` en limpio queda con el modo cloud cargado, sin pasos ocultos.
-- Idempotente y respetuoso con el estado: `ON CONFLICT DO NOTHING` solo siembra el
-- valor si la clave aún no existe, así que NO pisa una elección posterior del adulto
-- (el modo cloud es conmutable en caliente desde la BD).
-- Sin la API key del target en env, el backend cae automáticamente al modo base.
INSERT INTO "app_settings" ("id", "key", "value", "descripcion", "actualizadoEn")
VALUES (
  gen_random_uuid(),
  'ai.cloud',
  '{"activo":true,"target":"groq","model":"llama-3.3-70b-versatile"}',
  'Modo cloud por defecto (ON). {activo,target,model}; key del target en env.',
  now()
)
ON CONFLICT ("key") DO NOTHING;
