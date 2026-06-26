# Plan de coordinación — Lote de mejoras en paralelo (post-HITO 2)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md); protocolo de paralelismo en [../trabajo-en-paralelo.md](../trabajo-en-paralelo.md).
>
> Este documento es **solo la coordinación** del lote (DAG, conflictos, olas). El **cómo** detallado de
> cada feature lo escribe `abrir-feature` en su propio `Docs/planes/<branch>.md` al abrir el worktree.

## Objetivo

Ejecutar en paralelo, sin conflictos de merge, seis mejoras pedidas tras el cierre del HITO 2 (Fase 6).
Todas parten de `develop`, cada una en **su propio git worktree** (regla de paralelismo del CLAUDE.md).

## Decisiones de alcance (tomadas con el usuario, 2026-06-26)

- **2.4 + 2.6 se combinan** en una sola feature ("cuentos mejorados"): ambas reescriben `prompts.ts`,
  separarlas garantizaba conflicto.
- **2.3 con login real:** el alta guarda hash (bcrypt/argon2) y el login **verifica contraseña** (deja de
  ser magic-link por email). Revierte la postura de "identificación ligera" → actualizar
  `cumplimiento-menores.md`.
- **2.2 efímero:** el modo sin sesión genera y devuelve JSON **sin persistir nada, sin nombre de niño**,
  con rate-limit en memoria (3 cuentos + 3 actividades). **No toca el modelo de datos** y respeta C-1.

## Features del lote

| Ref | Feature                                                          | US (sugerida)        | Rama (sugerida)                        | Capa          | Depende de |
| --- | ---------------------------------------------------------------- | -------------------- | -------------------------------------- | ------------- | ---------- |
| F-A | Config validada con Zod                                          | US-46                | `feature/50-config-zod`                | backend       | —          |
| F-B | Cuentos mejorados (multi-tema/estilo + prompt + límite palabras) | US-47                | `feature/51-cuentos-multitema-prompt`  | backend + app | —          |
| F-C | Contraseña en el alta + login real                               | US-48                | `feature/52-password-login`            | backend + app | —          |
| F-D | Selección de perfil al arrancar                                  | US-49 (amplía US-02) | `feature/53-seleccion-perfil-arranque` | app           | —          |
| F-E | Dashboard/Home sin sesión (uso libre efímero)                    | US-50                | `feature/54-dashboard-anonimo`         | backend + app | F-B, F-D   |
| F-F | Ambiente de producción guiado                                    | US-51                | `feature/55-produccion-guiada`         | infra + docs  | F-A        |

> Numeración: la última US es US-45 → nuevas desde US-46. La última rama de feature fue `feature/49-*`
> → nuevas desde `feature/50-*`. `abrir-feature` confirma/ajusta al abrir cada una.

## Orden de ejecución (DAG en olas)

```
OLA 1 — 4 worktrees en paralelo (sin solaparse en ficheros):
  F-A  2.1   config.ts                          [aislada]
  F-B  2.4+2.6   pipeline de cuentos + StoryGeneratorScreen
  F-C  2.3   guardian/auth/prisma + Consent/Login screens
  F-D  2.5   useAppStore + App.tsx (initialRoute)

OLA 2 — arranca cuando su dependencia está en develop:
  F-E  2.2   tras F-B (stories.ts) + F-D (App.tsx)
  F-F  2.7   tras F-A (config con Zod sólida)
```

## Mapa de conflictos (por qué este reparto)

| Fichero                                  | Tareas        | Mitigación                                                                                                                                                    |
| ---------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompts.ts` (`buildStoryPrompt`)        | 2.4, 2.6      | **Combinadas en F-B** (un solo dueño)                                                                                                                         |
| `App.tsx` (`initialRoute`, ~L149)        | 2.5, 2.2      | F-D primero; F-E (2.2) en Ola 2 sobre el resultado                                                                                                            |
| `prisma/schema.prisma` (migración)       | 2.3, (2.4)    | Migraciones Prisma son secuenciales → **solo F-C migra**; F-B se diseña sin migración (persiste el tema/estilo en las columnas actuales, sin columnas nuevas) |
| `routes/stories.ts`                      | 2.4, 2.2      | F-B cambia el schema; F-E añade ruta anónima en Ola 2                                                                                                         |
| `application/dto.ts`, `app/.../types.ts` | 2.3, 2.4, 2.2 | Interfaces y secciones distintas; tolerable con `merge=union` de CHANGELOG (US-49) y rebase puntual                                                           |

## Banderas de cumplimiento (no son código)

- **F-E (2.2) — C-1:** modo anónimo **efímero**, sin persistir datos del niño ni nombre. Documentar en
  `cumplimiento-menores.md` que no se crea dato de menor sin consentimiento.
- **F-C (2.3) — identificación ligera:** revierte la decisión "sin contraseña" declarada en Fase 5.5 y
  `cumplimiento-menores.md`. Actualizar esa decisión y la US-19/US-16 afectadas.

## Notas técnicas por feature

- **F-A:** reescribir `loadConfig()` con un esquema Zod que **falle al arrancar** (`index.ts`) si en
  producción faltan/están mal `DATABASE_URL`, `JWT_SECRET`, etc. Ampliar `config.test.ts` (hoy solo cubre JWT).
- **F-B:** `tema`/`estilo` → arrays en ruta, `GenerateStoryInput`, `buildStoryPrompt` (interpolar lista
  legible), app `StoryGeneratorScreen` (chips multi-selección). Subir `palabrasMax` en `storyParams.ts` +
  seed de `AppSetting prompt.story.params`. **Sin migración Prisma** (decisión anti-conflicto).
- **F-C:** añadir `passwordHash` a Guardian (entidad + schema + migración), hasher (bcrypt/argon2, dep
  nueva), `RegisterGuardian` hashea, `LoginGuardian` verifica; rutas `guardians.ts` (alta + login) y
  pantallas `ConsentScreen`/`LoginScreen` con campo contraseña.
- **F-D:** `useAppStore` guarda `profiles: ChildProfile[]` (+ `setProfiles`, `partialize`); `App.tsx`
  `initialRoute`: con sesión y >1 perfil → `SelectProfile`; con exactamente 1 → auto-seleccionar y `Main`.
- **F-E:** casos de uso `GenerateStoryAnonymous`/`RecommendActivitiesAnonymous` (no persisten), rutas
  públicas `/stories/anonymous` y `/activities/recommend/anonymous`, rate-limit en memoria (hook
  `onRequest`); app: `DashboardScreen` como ruta inicial sin sesión + gateways anónimos.
- **F-F:** `render.yaml` (Docker, contexto raíz, dockerfile `packages/backend/Dockerfile`, branch `main`,
  health `/health`, env `sync:false`), `Docs/despliegue.md` (Neon + Render + Groq), `EXPO_PUBLIC_API_URL`
  de la app a prod, excepción de cumplimiento de Groq documentada.

## Definition of Done (cada feature)

- `pnpm check` verde (typecheck + lint + format + tests) tras cada fase.
- Tests nuevos co-localizados (caso de uso + endpoint / componente).
- US-NN creada/actualizada + trazabilidad en `historias-usuario/README.md`.
- `cumplimiento-menores.md` actualizado donde aplique (F-C, F-E).
- Pruebas con el usuario antes del cierre; `finish` solo tras confirmación explícita.
