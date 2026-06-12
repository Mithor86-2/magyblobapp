---
name: nuevo-caso-uso
description: Andamia un vertical slice del backend de magyblobApp respetando Clean Architecture — interfaz de repositorio en domain, caso de uso + DTOs en application con su test co-localizado (dobles in-memory), repo Prisma en infrastructure, ruta Fastify con validación por JSON Schema y su test de integración. Úsala al añadir un caso de uso o endpoint nuevo al backend.
---

# Nuevo caso de uso (backend)

Guía para añadir un caso de uso de extremo a extremo en **`packages/backend`** sin romper el
layering _enforced_. La regla del proyecto es la invariante: **las dependencias apuntan hacia
dentro**. Si el lint (`no-restricted-imports`) bloquea un import, el diseño está mal, no el lint.

Trabaja de **dentro hacia fuera** (dominio → aplicación → infraestructura → ruta). Cada artefacto
con su test. Vocabulario de dominio en español, andamiaje en inglés.

Patrón de referencia ya en el repo: `CreateChildProfile` y `GenerateStory`.

## 1. Dominio — interfaz y (si hace falta) entidad

- **Interfaz de repositorio** en `src/domain/repositories/<Entidad>Repository.ts`. Métodos `async`
  que devuelven `Promise<Entidad | null>` o `Promise<void>`. Solo importa entidades del dominio,
  jamás Prisma ni nada de infra.

  ```ts
  import type { Activity } from '../entities/Activity.js';
  export interface ActivityRepository {
    save(activity: Activity): Promise<void>;
    findById(id: string): Promise<Activity | null>;
    findByProfile(profileId: string): Promise<Activity[]>;
  }
  ```

- **Entidad** en `src/domain/entities/<Entidad>.ts` solo si no existe: clase **inmutable**
  (`readonly`), constructor que recibe una `interface <Entidad>Props` y **valida invariantes**
  lanzando `DomainError` (de `src/domain/errors.ts`). Usa value-objects (`Edad`, `Idioma`) y
  vocabularios (`vocabulary.ts`), no tipos primitivos sueltos. Copia arrays con `[...]`.

> Recuerda los imports `.js` en todas las rutas relativas (ESM).

## 2. Aplicación — caso de uso + DTOs

- **DTOs** en `src/application/dto.ts`: `interface <Verbo><Nombre>Input` (strings sin validar) y un
  `Output` con tipos del dominio. No se devuelve nunca la entidad cruda.
- **Caso de uso** en `src/application/use-cases/<VerboNombre>.ts`:

  ```ts
  export interface <VerboNombre>Deps {
    <repos>: <Entidad>Repository;
    ai?: AIProvider;          // si genera contenido
    newId: IdGenerator;       // de application/ports.ts
    now: Clock;               // de application/ports.ts
  }

  export class <VerboNombre> {
    constructor(private readonly deps: <VerboNombre>Deps) {}
    async execute(input: <VerboNombre>Input): Promise<<Nombre>Output> {
      // 1. buscar dependencias (NotFoundError si falta)
      // 2. validar reglas de negocio (DomainError)
      // 3. construir entidad / llamar ai
      // 4. persistir vía repo
      // 5. devolver DTO de salida
    }
  }
  ```

  Inyecta **interfaces del dominio + puertos** (`IdGenerator`, `Clock` de `application/ports.ts`),
  nunca implementaciones de infraestructura. Lanza `DomainError` / `NotFoundError` / `ConflictError`.

- **Test del caso de uso** en `test/application/<verbo-nombre>.test.ts` (Vitest). Sin IO: usa los
  dobles in-memory y los generadores deterministas de `test/support/doubles.ts`
  (`InMemory<Entidad>Repository`, `secuencialIdGenerator`, `relojFijo`, `MockProvider` para `ai`).
  Cubre: flujo feliz, errores esperados y el efecto en el repo (`repo.items.size`). Si necesitas un
  nuevo doble in-memory, añádelo a `test/support/doubles.ts` implementando la interfaz tal cual.

## 3. Infraestructura — repositorio Prisma

- En `src/infrastructure/repositories/Prisma<Entidad>Repository.ts`: clase que **implementa** la
  interfaz del dominio (no crea una propia), recibe `PrismaClient` por constructor, y mapea
  ORM↔entidad con una función privada `to<Entidad>(row)`. Sin lógica de negocio.
- Si la entidad es nueva, añade su modelo a `prisma/schema.prisma` y genera la migración.
- Cablea el repo en `src/infrastructure/composition.ts` (`buildProductionDeps`) y añade el campo a
  `AppDeps` en `src/dependencies.ts`. Refleja el mismo campo en `makeInMemoryDeps` de
  `test/support/server.ts`.

## 4. Ruta Fastify + test de integración

- En `src/routes/<entidad>.ts`: función `<entidad>Routes(app: FastifyInstance, deps: AppDeps): void`.
  Valida el body con **JSON Schema** (objeto literal `as const`, **no Zod**), usando enums de los
  vocabularios (`[...TEMAS]`, `[...IDIOMAS]`) y límites de value-objects (`Edad.MIN`/`Edad.MAX`).
  Instancia el caso de uso con `new <VerboNombre>(deps)`, responde con `reply.code(2xx).send(output)`,
  y registra el `AuditLog` / `InteractionEvent` que corresponda como side effect.
- Registra la ruta en `buildServer()` (`src/server.ts`).
- Los errores los traduce a HTTP el handler global (`src/routes/errorHandler.ts`): no captures ahí
  los `DomainError` salvo que necesites algo a medida.
- **Test de integración** en `test/routes/<entidad>.test.ts` con `app.inject()` (sin abrir puerto),
  usando `buildTestServer` + `makeInMemoryDeps`. Cubre códigos 2xx, 400 (validación de schema), 404
  y los side effects (audit/eventos).

## 5. Cierra el gate

Antes de dar por hecho el slice:

```bash
pnpm check    # typecheck + lint + format:check + test
```

Si el lint bloquea un import entre capas, **mueve la dependencia** — no toques la regla. Cuando la
feature complete, ciérrala con la skill **cerrar-feature**.

## Checklist del slice

- [ ] Interfaz `<Entidad>Repository` en `domain/repositories` (sin imports de infra).
- [ ] DTOs en `application/dto.ts`; caso de uso con `Deps` y `execute()`.
- [ ] Test del caso de uso con dobles in-memory (sin IO), cubriendo errores.
- [ ] `Prisma<Entidad>Repository` + modelo/migración Prisma si la entidad es nueva.
- [ ] Cableado en `composition.ts`, `dependencies.ts` y `test/support/server.ts`.
- [ ] Ruta con JSON Schema + registro en `buildServer()`.
- [ ] Test de integración con `app.inject()` (2xx/400/404 + side effects).
- [ ] `pnpm check` verde.
