# Estrategia de pruebas

Cómo se prueba magyblobApp: los **niveles** de prueba (la pirámide), qué cubre cada uno, **cómo
ejecutarlos** (local y CI) y la **guía de TDD** (dónde se hace test-first y dónde no, y por qué).

Es el complemento práctico de las [historias de usuario](historias-usuario/README.md) (la fuente de
los criterios del DoD) y del gate del [CLAUDE.md](../CLAUDE.md). Origen: US-32 (Fase 6).

## La pirámide del proyecto

```
            ╱ E2E ╲            pocos, lentos, alta fidelidad (flujo real de punta a punta)
          ╱─────────╲
        ╱ Integración ╲        medios: BD real, HTTP real
      ╱─────────────────╲
    ╱     Unitarios       ╲     muchos, rápidos, sin IO (dominio + aplicación + componentes)
  ╱─────────────────────────╲
```

| Nivel                          | Qué prueba                                                  | IO real                        | Dónde viven                                                     | Runner / cómo                                |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------- | -------------------------------------------- |
| **Unitario**                   | Reglas de dominio, casos de uso (con dobles in-memory)      | No                             | `packages/backend/{src,test}/**/*.test.ts` (dominio/aplicación) | Vitest (`pnpm test`)                         |
| **Unitario UI**                | Componentes de la app por comportamiento accesible (US-30)  | No (jsdom)                     | `packages/app/src/presentation/components/*.test.tsx`           | Vitest + RN Testing Library                  |
| **Integración (rutas)**        | Endpoints HTTP con dobles in-memory (`app.inject`)          | No (sin BD)                    | `packages/backend/test/routes/*.test.ts`                        | Vitest (`pnpm test`)                         |
| **Integración (persistencia)** | Los `Prisma*Repository` contra **Postgres real**            | Sí (Postgres)                  | `packages/backend/test/integration-db/*.test.ts`                | Vitest + Testcontainers (`test:integration`) |
| **E2E backend**                | Servidor real por **HTTP real** + Postgres real (modo mock) | Sí (Postgres, HTTP)            | `packages/backend/test/e2e/*.e2e.test.ts`                       | Vitest + Testcontainers (`test:e2e`)         |
| **E2E app (web)**              | App Expo web en navegador contra el backend real (mock)     | Sí (navegador, HTTP, Postgres) | `packages/app/e2e/*.spec.ts`                                    | Playwright + Chromium (`test:e2e`)           |
| **E2E app (nativo)**           | App nativa en simulador/emulador (audio, voz, nav. nativa)  | Sí (simulador, HTTP)           | `packages/app/.maestro/*.yaml`                                  | Maestro (`maestro test`) — job de CI aparte  |

**Principio de cumplimiento.** Todas las pruebas corren con `AI_PROVIDER=mock`: sin red, sin IA
externa ni SDKs de terceros (ver [cumplimiento-menores.md](cumplimiento-menores.md)). Las
dependencias añadidas (Testcontainers, Playwright) son **solo de desarrollo/CI**.

## Cómo ejecutar cada nivel

Desde la raíz del repo. Los niveles con IO real **requieren Docker en marcha**.

```bash
# Gate diario (rápido, sin Docker): typecheck + lint + format:check + unitarios + integración de rutas
pnpm check

# Solo los tests unitarios/rutas de cada paquete
pnpm test

# Integración de persistencia (Prisma ↔ Postgres real, Testcontainers) — requiere Docker
pnpm --filter @magyblob/backend test:integration

# E2E de backend (servidor real por HTTP + Postgres real, mock) — requiere Docker
pnpm --filter @magyblob/backend test:e2e

# E2E de app (Playwright sobre Expo web contra backend real mock) — requiere Docker + navegador
pnpm --filter @magyblob/app e2e:install   # una vez: descarga Chromium
pnpm --filter @magyblob/app test:e2e
```

**Por qué la integración y el E2E van aparte del `pnpm test`.** Necesitan Docker (Testcontainers
levanta `postgres:16-alpine`), así que se aíslan en sus propias configuraciones de Vitest
(`vitest.integration.config.ts`, `vitest.e2e.config.ts`) para que el gate del día a día siga siendo
rápido y sin dependencias de infraestructura. En **CI** sí se ejecutan siempre.

### En CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) corre en cada `push` (a `main`/`develop`)
y `pull_request`, con tres jobs que reproducen exactamente los comandos de arriba:

1. **gate** — `pnpm check` (sin Docker).
2. **integración + E2E backend** — `test:integration` y `test:e2e` (Testcontainers; Docker viene en
   el runner `ubuntu-latest`).
3. **E2E app** — Playwright/Chromium sobre Expo web contra el backend real en mock.

El pipeline **falla** si cualquier job falla: es el DoD hecho cumplir de forma automática.

## E2E web (Playwright) vs E2E nativo (Maestro)

Hay **dos niveles de E2E de la app**, complementarios. No se sustituyen: cada uno cubre algo que el
otro no puede. La decisión de adoptar Maestro frente a Detox para el nativo está en el
[ADR 0005](ADR/0005-e2e-nativo-maestro.md).

| Aspecto           | **E2E web — Playwright** (US-32/US-36)                       | **E2E nativo — Maestro** (US-35)                                                 |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Qué ejecuta       | El **export web** de Expo (`react-native-web`) en Chromium   | La **app nativa** (development build) en iOS Simulator / Android Emulator        |
| Qué cubre bien    | Lógica de pantallas, navegación, formularios, flujo de datos | Lo **solo nativo**: audio (`expo-audio`), voz (`expo-speech`), navegación nativa |
| Qué **no** cubre  | Nada nativo (Playwright no maneja el iOS Simulator)          | (Es complementario; no reemplaza la cobertura web)                               |
| Localización      | Rol/etiqueta accesible (no por estructura)                   | id/etiqueta accesible (no por estructura)                                        |
| Dónde vive        | `packages/app/e2e/*.spec.ts`                                 | `packages/app/.maestro/*.yaml`                                                   |
| Coste / velocidad | Bajo: navegador headless, rápido                             | Alto: levantar simulador/emulador es lento (iOS exige macOS)                     |
| En CI             | **En el gate de cada push/PR** (job `e2e-app`)               | **Job separado, nightly/manual — NO en el gate de PR** (por coste)               |

**Cuándo usar cuál.** Para validar la **lógica de un flujo o pantalla** (la mayoría de los casos),
basta el E2E web: es rápido y corre en cada PR. Reserva el E2E nativo para verificar que el flujo del
MVP funciona **de verdad en el dispositivo** y, en particular, las **capacidades solo nativas** con un
efecto observable (p. ej. al tocar «Escuchar» el control pasa a «Pausar» y aparece «Parar»: la voz
está sonando vía `expo-speech`), algo que el render web no puede ejercitar.

> **El E2E nativo NO corre en el gate de PR.** Se omite a propósito por el coste de levantar
> simuladores en CI; corre en un job aparte (nightly/manual). Se documenta aquí para no dar **falsa
> sensación de cobertura**: un PR en verde no implica que el nativo se haya probado.

### Cómo ejecutar el E2E nativo (Maestro) en local

Requiere un **development build** de Expo (no Expo Go, por los módulos nativos) y un simulador/emulador
arrancado. Desde `packages/app` salvo donde se indique:

```bash
# 1. Instalar el CLI de Maestro (una vez)
curl -fsSL https://get.maestro.mobile.dev | bash

# 2. Backend en modo mock (desde la raíz del repo; sin red ni IA externa)
docker compose up        # AI_PROVIDER=mock por defecto

# 3. Development build de Expo + instalación en el simulador/emulador
#    (apuntando la app al backend mock vía EXPO_PUBLIC_API_URL)
npx expo run:ios         # iOS Simulator (requiere macOS + Xcode)
#   ó
npx expo run:android     # Android Emulator (requiere Android SDK + un AVD arrancado)

# 4. Ejecutar el flow (con el simulador/emulador arrancado y la app dev instalada)
maestro test packages/app/.maestro/onboarding.yaml
```

El _flow_ ([`.maestro/onboarding.yaml`](../packages/app/.maestro/onboarding.yaml)) recorre el happy
path del MVP: bienvenida → puerta parental → alta del adulto → consentimiento → crear perfil → generar
cuento (mock) → narrarlo. Lleva en cabecera los requisitos y la nota sobre el `appId` del development
build (Expo lo deriva del slug si `app.json` no declara `bundleIdentifier`/`package`).

### Job de CI propuesto (E2E nativo)

Pendiente de un **runner con simulador** (macOS para iOS). El esqueleto vive en
[`.github/workflows/e2e-native.yml`](../.github/workflows/e2e-native.yml): se dispara **manual
(`workflow_dispatch`) y/o nocturno (`schedule`)**, **nunca** en push/PR. Es un esqueleto con pasos
`# TODO` a completar (build dev de Expo + arranque de simulador + `maestro test`), no una integración
terminada.

## Guía de TDD

El ciclo **Red → Green → Refactor** es el camino natural en este proyecto porque la arquitectura ya
separa lo testeable-sin-IO (dominio/aplicación) de la infraestructura. El criterio Gherkin de la
US-NN **es** el primer test en rojo.

1. 🔴 **Red** — define la interfaz/DTO y escribe el test (con dobles in-memory) **antes** de la
   lógica. Falla porque aún no hay implementación.
2. 🟢 **Green** — implementa lo mínimo hasta que pasa.
3. 🔵 **Refactor** — limpia con la red de tests en verde.

Para un caso de uso nuevo, la skill [`nuevo-caso-uso`](../.claude/skills/nuevo-caso-uso/SKILL.md)
andamia el slice; el test del caso de uso se escribe primero.

### Dónde se aplica test-first y dónde no (YAGNI)

Coherente con el principio YAGNI del proyecto: el TDD se exige donde aporta (lógica y contratos), no
donde el coste supera el valor (presentación visual, adaptadores de IO no deterministas).

| Test-first (obligatorio)                                 | Test-after o sin test                                                      |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| Casos de uso y reglas de dominio (aplicación/dominio)    | Maquetación puramente visual, tokens de tema                               |
| Contrato de rutas (status, schema, side effects)         | `Prisma*Repository` (se cubre por integración, no unit)                    |
| `MockProvider` / `FallbackProvider` (lógica de fallback) | `OllamaProvider`/`ElevenLabsProvider` reales (IO externo, no determinista) |
| Adaptador HTTP y stores de la app                        | Pantallas como composición visual                                          |

- Los repos Prisma **no** se prueban unitariamente: su valor está en el SQL real, así que se cubren
  en la **integración** contra Postgres.
- Los proveedores reales (Ollama, ElevenLabs) **no** se prueban en el gate: dependen de servicios
  externos no deterministas; hay _smoke tests_ manuales aparte (`pnpm ai:smoke`).
- La narración (ElevenLabs) queda **fuera** del E2E en mock: es un servicio externo; el E2E de
  backend solo comprueba que sin clave no se sirve audio (límite documentado).

## Referencias

- Niveles y dobles: [test/support/](../packages/backend/test/support/) (in-memory, `db.ts`,
  `fixtures.ts`).
- Historias de usuario (criterios = tests del DoD): [historias-usuario/](historias-usuario/README.md).
- Plan de la Fase 6 (cómo se construyó esto): [planes/fase-6.md](planes/fase-6.md).
