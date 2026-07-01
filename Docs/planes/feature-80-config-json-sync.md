# Plan — Feature 80: Configuración del app por JSON con sync versionado (US-70)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo**.

## Contexto

La configuración ajustable en caliente (`AppSetting`) estaba en un array TS hardcodeado en
`prisma/seed.ts`, aplicado a mano y sin ejecutarse en el arranque. Se pasa a un **JSON versionado**
(fuente única) que se sincroniza a la BD, para gestionar migraciones/actualizaciones de configuración
de forma reproducible y **sin pisar los cambios hechos en caliente**.

Decisiones (con el usuario): sync en **arranque + script `config:sync`**; política **versionada por
clave** (solo reaplica cuando sube la `version`).

## Historias cubiertas

- US-70 — Configuración del app por JSON con sync versionado ([épica E](../historias-usuario/epic-e-config.md#us-70))

## Tareas

- [x] ✅ Esquema: `version Int @default(0)` en `AppSetting` + migración `add_version_to_app_settings`;
      `Docs/modelo-datos.md` actualizado (diagrama + sección + fuente JSON).
- [x] ✅ Fuente única `prisma/app-settings.json` (value tipado string/number/boolean/objeto; `version`
      por clave; sin secretos).
- [x] ✅ Lógica pura `src/infrastructure/config/appSettings.ts` (Zod + normalización a texto +
      `loadAppSettingsJson` + `decidirAccion`) con tests unitarios.
- [x] ✅ Orquestación IO `src/infrastructure/config/syncAppSettings.ts` (crear/actualizar/omitir,
      huérfanas, resumen) — excluida de cobertura unitaria (→ `test:integration`).
- [x] ✅ Entradas: arranque en `buildProductionDeps` (guardado por `DATABASE_URL`), script
      `config:sync` (`prisma/sync-settings.ts`), `seed` delega en el mismo mecanismo.
- [x] ✅ Tests: unitarios (`appSettings.test.ts`) + integración Postgres real
      (`test/integration-db/app-settings.sync.test.ts`: crea/omite-preserva/actualiza/huérfanas/idempotente).
- [x] ✅ Docs: US-70 (épica E) + trazabilidad (README) + `CHANGELOG` (Unreleased) + este plan.
- [x] ✅ Gate `pnpm check` verde (backend 326 + app 194); `config:sync` verificado contra BD local
      (crea 5 + actualiza 3; 2ª pasada 8 omitidas, idempotente).
- [ ] ⬜ Pruebas con el usuario → confirmación → cierre con `cerrar-feature` (versionado diferido).

## Verificación

- `pnpm --filter @magyblob/backend config:sync` (idempotente; subir una `version` → esa clave se
  actualiza; cambio en caliente de `ai.cloud` + resync → no se pisa).
- `docker compose up` limpio: el arranque puebla `AppSetting` sin pasos manuales.
- `pnpm --filter @magyblob/backend test:integration` (Docker) cubre el sync contra Postgres real.
