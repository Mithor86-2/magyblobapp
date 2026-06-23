# Plan — Feature 33: Observer para telemetría y auditoría

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

Petición: optimizar el código aplicando patrones (Strategy, Factory, Observer, Command) **donde sea
necesario**. La auditoría del repo concluye que **Strategy, Factory y Decorator ya están
implementados** en la capa AI (`AIProvider` + `Mock`/`Ollama`/`CloudProvider`, `createAIProvider`,
`FallbackProvider`/`HotSwapAIProvider`) y que **Command** está implícito en los casos de uso. Aplicar
más patrones "por completitud" iría contra el YAGNI documentado del proyecto.

El único patrón que falta y **paga su coste** es **Observer**: hoy la emisión de `InteractionEvent`
(telemetría) y `AuditLog` (auditoría) está **duplicada y mezclada dentro de 6 handlers HTTP**
(`new XEvent({ id: deps.newId(), …, creadoEn: deps.now() }); save(…)`). Un bus de eventos en proceso
desacopla "qué pasó" de "cómo se registra": el suscriptor de telemetría y el de auditoría se
registran una vez en el composition root, y añadir métricas/cumplimiento futuro será añadir un
suscriptor sin tocar rutas.

Decisión acordada con el usuario: enfoque **pragmático** (solo refactor con duplicación/acoplamiento
real), alcance backend + app. La **app no necesita refactor** (Factory ya presente en
`createApiGateways`; Zustand ya es un Observable; mapeos de 3-4 entradas → YAGNI).

**Sin cambio de comportamiento ni de esquema**: se persisten exactamente los mismos eventos.
[../modelo-datos.md](../modelo-datos.md) y el `schema.prisma` no cambian.

✅ ya existe · ❌ pendiente:

- ✅ Entidades `InteractionEvent` / `AuditLog`, repos y vocabularios cerrados.
- ✅ Emisión funcionando, pero acoplada a rutas (lo que este plan desacopla).
- ❌ Puerto `EventBus`, implementación in-memory, suscriptores y cableado.

## Historias cubiertas

- US-17 — Logs y tracking de primera parte ([épica F](../historias-usuario/epic-f-plataforma.md)).
  Refactor interno: mejora la implementación sin alterar criterios de aceptación.

## Tareas

- [ ] ❌ Domain: `domain/events/DomainEvent.ts` (unión discriminada por `tipo`) + `domain/events/EventBus.ts` (puerto).
- [ ] ❌ Infra: `infrastructure/events/InMemoryEventBus.ts` (espera suscriptores en serie, propaga errores).
- [ ] ❌ Infra: `infrastructure/events/subscribers.ts` → `wireDomainEvents(bus, deps)` (suscriptor telemetría + suscriptor auditoría).
- [ ] ❌ Tests unitarios: `InMemoryEventBus` (N suscriptores; propaga error) y `wireDomainEvents` (cada `tipo` → entidad esperada). Sin IO.
- [ ] ❌ Cablear `bus: EventBus` en `AppDeps`, en `composition.ts` y en el helper de tests (dobles in-memory).
- [ ] ❌ Migrar las 4 rutas (`stories`, `activities`, `guardians`, `profiles`) a `deps.bus.publish(...)`; conservar el condicional de narración (solo si `sintetizado`).
- [ ] ❌ Docs: decisión + rationale en [../memory.md](../memory.md); nota en [../lecciones-aprendidas.md](../lecciones-aprendidas.md) si surge gotcha; CHANGELOG backend (`Changed`); bump SemVer minor backend.
- [ ] ❌ Gate (`pnpm check`) verde + pruebas con el usuario → confirmación → `cerrar-feature`.

## Verificación

- `pnpm check` en verde (typecheck + lint + format:check + test).
- Integración de rutas: tras `POST /stories`, `/activities/:id/complete`, `/guardians`,
  `/guardians/login`, `/profiles` se persisten los mismos eventos/auditoría (ahora vía suscriptores).
- `no-restricted-imports`: `domain/events` no importa infraestructura.
- E2E manual: `docker compose up` → crear perfil y generar cuento → comprobar `AuditLog`/`InteractionEvent`.
