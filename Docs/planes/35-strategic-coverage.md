# Plan — Feature 35: Cobertura estratégica por riesgo de negocio (100/80/0)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.

## Contexto

El gate (`pnpm check`) verifica que los tests **pasan**, pero no mide **qué cubren**: no hay
configuración de coverage ni umbrales en ningún paquete (✅ buena malla de tests; ❌ sin red de
seguridad medible sobre lo crítico). El riesgo no es el % global, sino que código **CORE** quede sin
cubrir. La auditoría detectó un hueco CORE real:
[`parseResponse.ts`](../../packages/backend/src/infrastructure/ai/parseResponse.ts) (saneo de la
salida del LLM antes de mostrarla a un niño) **sin test propio**.

Se adopta **Strategic Coverage 100/80/0**: clasificar por riesgo de negocio y fijar umbrales por
_glob_ en Vitest (provider `v8`), haciéndolos cumplir en CI. **Decisión con el usuario:** análisis +
cerrar gaps CORE con tests + umbrales por tier, en **backend y app**. El gate diario sigue rápido
(sin coverage); el umbral lo fuerza el CI (coherente con cómo integración/E2E ya son CI-enforced).

Niveles: **CORE 100%** (rompe negocio/cumplimiento) · **IMPORTANT 80%** (frustra al usuario) ·
**INFRASTRUCTURE 0%** (TypeScript valida → excluido de la medición, junto con lo cubierto por otras
suites: repos Prisma → integración, ElevenLabs → E2E/manual).

## Historias cubiertas

- US-35 — Cobertura estratégica por riesgo de negocio (100/80/0) ([épica F](../historias-usuario/epic-f-plataforma.md#us-35))

## Tareas

### Fase A — Configuración de coverage por tier

- [x] ✅ Añadir `@vitest/coverage-v8@^2.1.8` (devDependency) a `packages/backend` y `packages/app`.
- [x] ✅ `packages/backend/vitest.config.ts`: bloque `coverage` (provider v8, `include: ['src/**']`,
      `exclude` del tier 0% + repos Prisma + db + ElevenLabs + cloudPresets/aiLog + dto + config/server/index + generated).
- [x] ✅ `packages/backend/vitest.config.ts`: `thresholds` global 80 + globs CORE a 100
      (`ai/{parseResponse,FallbackProvider,createAIProvider,MockProvider}`, `use-cases/**`,
      `value-objects/**`, `entities/**`).
- [x] ✅ `packages/app/vitest.config.ts`: bloque `coverage` análogo (exclude `domain/**`, labels,
      theme, navigation, composition, storage); CORE a 100 (`http`, `sanitizeForSpeech`, `useAppStore`).
- [x] ✅ Scripts: `test:coverage` en ambos `package.json` + `coverage` en la raíz.

### Fase B — Cerrar gaps CORE (tests)

- [x] ✅ `backend/test/infrastructure/parse-response.test.ts` — saneo LLM (título/cuerpo vacío,
      categoría inventada, nivel/duración fuera de rango, array vacío, recorte a cantidad, proveedor).
- [x] ✅ `backend/test/domain/entities.test.ts` — invariantes hasta 100% (`Guardian`, `Activity`,
      `Story`, `StoryNarration`, `InteractionEvent`, `AuditLog`).
- [x] ✅ `app/.../hooks/sanitizeForSpeech.test.ts` — paridad con el backend.
- [x] ✅ `app/.../store/useAppStore.test.ts` — sesión, partialize, migración v0→v1, acciones.

### Fase C — Tests IMPORTANT (hasta el 80%)

- [x] ✅ `app/.../hooks/useNarration.test.ts` — estados + degradación a voz nativa (dobles de
      `expo-audio`/`expo-speech`/`fetch`).
- [x] ✅ Validación de pantallas: `CreateProfileScreen` y `ConsentScreen` (habilitación de botón).

### Fase D — CI y cierre

- [x] ✅ `.github/workflows/ci.yml`: el job del gate ejecuta `pnpm coverage`.
- [x] ✅ Gate verde: `pnpm check` + `pnpm coverage` (exit 0); prueba de que el umbral muerde.
- [x] ✅ Docs: estrategia-pruebas (sección 100/80/0), phases.md, memory.md, CHANGELOG por paquete.
- [x] ✅ Pruebas con el usuario → confirmación → cierre con `cerrar-feature`.
