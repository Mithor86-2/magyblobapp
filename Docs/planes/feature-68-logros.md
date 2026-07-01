# Feature US-68 — Recompensas y logros del niño (gamificación)

**Objetivo:** el niño gana **medallas/pegatinas** al leer cuentos y completar actividades, y
las ve en una pantalla "Mis logros". Motiva el hábito de lectura/actividad. Todo **local**,
sobre datos que ya se persisten, sin PII nueva ni terceros → cumplimiento intacto.

**Rama (al abrir):** `feature/<id>-logros` desde `develop`. **Versionado diferido.**

> **Estado:** ✅ implementado en la rama `feature/80-logros-ensenanza` (junto con US-69); `pnpm check`
> verde (backend 357 + app 203). Pendiente: pruebas del usuario y cierre (`finish` tras confirmación).
>
> **Desviación de diseño (respecto al plan):** en vez del EventBus + evento `cuento_leido`, la
> persistencia se **reconcilia en la lectura** (`GetAchievements` calcula el estado y persiste los
> desbloqueos nuevos de forma idempotente). Motivo: mínima superficie; el endpoint sigue siendo `GET`
> y el estado mostrado es correcto aunque la persistencia falle (sale del cálculo). No se añadió el
> evento `cuento_leido` ni se tocó `MarkStoryRead`/subscribers.

## Decisiones (confirmadas)

- **Persistido en BD:** nueva entidad `Achievement` (logro desbloqueado por perfil), con
  `desbloqueadoEn` para trazar el momento y poder destacar los recientes.
- **Catálogo inicial (4 categorías):**
  - `cuentos_leidos` — hitos por nº de cuentos con `estado = 'leido'`. Umbrales **1, 5, 10, 25**.
  - `actividades_completadas` — hitos por nº de actividades con `completadaEn`. Umbrales **1, 5, 10, 25**.
  - `racha_dias` — días **seguidos** con actividad (cuento leído o actividad completada).
    Umbrales **3, 7**. Se calcula sobre las fechas ya persistidas.
  - `explorar_temas` — leer ≥1 cuento de un tema. **Un logro por tema** (`animales`, `espacio`,
    `magia`, `aventuras`, `musica`) = 5 logros.
- **Reconciliación por EventBus (patrón Observer, US-17):** al ocurrir un evento relevante se
  recalculan y **persisten** los logros recién desbloqueados. El endpoint es **solo lectura**
  (no muta en un GET). Requiere publicar un evento `cuento_leido` (hoy `MarkStoryRead` no
  emite ninguno).

## Diseño técnico (resumen)

- **Dominio nuevo — catálogo puro** `domain/logros.ts`: define `LOGROS` (clave, categoria,
  umbral, `tema?`), una función pura `computeStatsLogros(stories, activities)` (nº leídos, nº
  completadas, racha de días, set de temas leídos) y `evaluarLogros(stats): clave[]`. Sin IO.
- **Entidad + repo:** `domain/entities/Achievement.ts` y
  `domain/repositories/AchievementRepository.ts` (`findByProfile`, `unlock` idempotente por
  `(profileId, clave)`).
- **Esquema Prisma:** modelo `Achievement` con cascada por perfil (GDPR) y `@@unique([profileId, clave])`.

```prisma
model Achievement {
  id             String       @id @default(uuid())
  profileId      String
  profile        ChildProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  clave          String
  desbloqueadoEn DateTime     @default(now())
  @@unique([profileId, clave])
  @@index([profileId])
  @@map("achievements")
}
```

- **Casos de uso:** `EvaluateAchievements` (recalcula + `unlock` de los nuevos; lo dispara el
  bus) y `GetAchievements` (read-model: catálogo + estado desbloqueado/progreso para pintar).
- **App:** gateway `achievements.get(profileId)`, pantalla `AchievementsScreen` ("Mis logros")
  con rejilla de medallas (`Icon`, estado bloqueado/desbloqueado + progreso), entrada desde
  `HomeScreen`, i18n ES/EN, validación de respuesta en `schemas.ts`.

---

## Fases y tareas

Leyenda: ❌ pendiente · 🔄 en curso · ✅ hecha

### Fase 0 — Apertura

- ❌ Crear rama/worktree `feature/<id>-logros` desde `develop` (skill `abrir-feature`).
- ❌ Crear **US-68** con criterios Gherkin (épica de progreso/gamificación) + fila en la tabla
  de trazabilidad de [../historias-usuario/README.md](../historias-usuario/README.md).
- ❌ Sección `## [Unreleased]` lista en el CHANGELOG del backend y del app.

### Fase 1 — Dominio (catálogo puro + entidad + puerto)

- ❌ `domain/logros.ts`: `LOGROS`, `computeStatsLogros`, `evaluarLogros` (funciones puras).
- ❌ `domain/entities/Achievement.ts`.
- ❌ `domain/repositories/AchievementRepository.ts` (`findByProfile`, `unlock`).
- ❌ Documentación `/** */` en español (skill `documentar`).
- ❌ **Tests:** catálogo puro — umbrales de cuentos/actividades, cálculo de **racha de días**
  (con casos límite: hoy, ayer, hueco), y temas explorados.

### Fase 2 — Aplicación (casos de uso + DTOs)

- ❌ DTOs en `application/dto.ts`: `AchievementOutput` (clave, categoria, meta, progreso,
  desbloqueado, `desbloqueadoEn?`).
- ❌ `EvaluateAchievements` (recalcula desde stories/activities + `unlock` idempotente de nuevos).
- ❌ `GetAchievements` (read-model: cruza catálogo con lo persistido; incluye progreso).
- ❌ Mapper entidad→`AchievementOutput`.
- ❌ **Tests** de ambos casos de uso con repos in-memory (idempotencia de `unlock`;
  read-model coherente; sin IO).

### Fase 3 — Infraestructura (Prisma) + evento

- ❌ Modelo `Achievement` en `schema.prisma` + relación en `ChildProfile` + **migración**
  (coordinada con US-69, ver [coordinacion](coordinacion-logros-ensenanza.md)).
- ❌ `PrismaAchievementRepository` (upsert idempotente por `@@unique`).
- ❌ `TIPOS_EVENTO += 'cuento_leido'` en `vocabulary.ts`; `MarkStoryRead`/ruta publica
  `cuento_leido` en el bus (y persiste el `InteractionEvent`, coherente con US-17).
- ❌ Suscriptor `wireAchievements(bus, deps)` en `infrastructure/events/subscribers.ts`:
  ante `cuento_leido` y `actividad_completada` → `EvaluateAchievements`.
- ❌ Actualizar [../modelo-datos.md](../modelo-datos.md) (nuevo `Achievement` en el ER + prosa).

### Fase 4 — Ruta HTTP

- ❌ `routes/achievements.ts` (o dentro de `history.ts`): `GET /profiles/:id/achievements`
  con `authenticate` y validación Zod de params; registra la ruta en `server.ts`.
- ❌ **Test de integración** de la ruta (`app.inject`, repos in-memory): perfil sin logros →
  catálogo todo bloqueado; con datos → desbloqueos correctos.

### Fase 5 — App (gateway + pantalla)

- ❌ `domain/types.ts` + `domain/gateways.ts`: tipos `Achievement`/catálogo + `AchievementGateway`;
  añadir a `Api`.
- ❌ `infrastructure/http.ts` + `infrastructure/schemas.ts`: implementación y validación de
  respuesta (`ApiError('malformed')` ante forma inesperada, patrón US-44).
- ❌ `presentation/screens/AchievementsScreen.tsx`: rejilla de medallas (bloqueado/desbloqueado
  - barra de progreso), estados carga/error/reintento; tokens de tema (claro/oscuro).
- ❌ Entrada "Mis logros" en `HomeScreen` (zona infantil) + registro en `navigation.ts`.
- ❌ i18n ES/EN de títulos/descripciones de los logros (`i18n/locales/es.ts` y `en.ts`).
- ❌ **Tests de componente** (render user-centric, patrón US-30) + test del gateway HTTP.

### Fase 6 — Cierre

- ❌ Gate `pnpm check` verde (backend + app) y `expo export`.
- ❌ Entradas de CHANGELOG (Unreleased) por paquete; actualizar [../phases.md](../phases.md).
- ❌ **Pruebas con el usuario** (leer cuentos/completar actividades y ver el desbloqueo).
- ❌ `git flow feature finish` **solo tras confirmación** (versionado diferido al integrar).

## Cumplimiento

- Todo el cálculo es **local**, sobre datos ya minimizados; ninguna llamada externa ni SDK
  nuevo. Borrado en cascada del `Achievement` con el perfil/guardián (C-1). Sin PII en la
  medalla (referida por `profileId`).
