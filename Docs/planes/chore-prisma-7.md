# Plan — chore/prisma-7: migración a Prisma 7

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo**.

## Contexto

Dependabot subió **solo `@prisma/client` a 7.8.0** (PR #18) dejando el CLI `prisma` en 6.x. Prisma
exige cliente y CLI en la **misma versión**: el `prisma generate` del CLI 6 falló copiando
`runtime/library.d.ts` (ENOENT) → `postinstall` roto → **CI de develop en rojo** (Gate + Docker).
Decisión del usuario: **migrar a Prisma 7 en condiciones** (no revertir).

Prisma 7 trae breaking changes grandes (guía consultada vía Context7):

- Generador `prisma-client-js` → nuevo **`prisma-client`** (Rust-free, ESM), `output` obligatorio,
  emite **`.ts`** (lo compila `tsc`, no hay motor/binario ni assets que copiar).
- **`datasource.url` deja de ir en el schema**: la URL de Migrate se declara en `prisma.config.ts`
  y el runtime conecta con un **driver adapter** (`@prisma/adapter-pg` sobre `pg`).

## Historias cubiertas

Sin US de producto: chore de dependencias/infraestructura de datos. No cambia el modelo
([modelo-datos.md](../modelo-datos.md) intacto: no se tocó ninguna entidad/campo/relación/índice).

## Tareas

- [x] ✅ Emparejar versiones: `@prisma/client` y `prisma` a `^7.8.0`.
- [x] ✅ Generador `prisma-client` (ESM) en `schema.prisma`; quitar `datasource.url`.
- [x] ✅ `prisma.config.ts` con `schema`, `migrations` y `datasource.url` desde `process.env.DATABASE_URL`
      (no el helper `env()`, que es estricto y rompe `generate` sin BD en CI/Docker).
- [x] ✅ Driver adapter `@prisma/adapter-pg` + `pg` (+ `@types/pg`) en `createPrismaClient` y en
      `test/support/db.ts` (adiós `datasourceUrl`, eliminado en v7).
- [x] ✅ Imports del cliente `generated/prisma/index.js` → `.../client.js` (9 en src + 2 en test).
- [x] ✅ Build: quitar `cp -r src/generated dist/generated` (tsc compila el `.ts` generado a `dist`).
- [x] ✅ `Dockerfile`: copiar `prisma.config.ts` en build (postinstall) y runtime (`migrate deploy`).
- [x] ✅ Validación: gate + coverage + integración (30/30) + e2e backend (3/3) + `docker build`, verde.
- [x] ✅ CHANGELOG backend (`Changed`) bajo `## [Unreleased]`.
- [ ] ❌ Cierre con `cerrar-feature` (versión + merge a develop, previa confirmación) — pone develop en verde.

## Pendiente aparte (no de esta rama)

Dependabot dejó en develop otros **majors sueltos de Expo 57** (`expo-haptics`, `babel-preset-expo`)
con `expo` aún en 56. El gate unitario pasa, pero conviene decidir si subir Expo 56→57 en bloque
(SDK entero) o revertir esos parciales. Ver también los PRs abiertos de majors (#20 expo, #16
@vitest/coverage-v8 4, #13 @types/node 26).
