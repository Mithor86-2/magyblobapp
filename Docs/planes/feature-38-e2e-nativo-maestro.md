# Plan — Feature 38: E2E nativo de la app en simuladores con Maestro (US-35)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Rama: `feature/38-e2e-nativo-maestro` (desde `develop`). Historia: **US-35**. Solo app/tests/CI.

## Contexto

Qué hay ya (✅) y qué falta (❌):

- ✅ E2E de la app con **Playwright** sobre el export **web** de Expo (`react-native-web`), contra el
  backend real en modo `mock` (US-32, `packages/app` v0.11.0).
- ✅ Capacidades solo nativas ya implementadas en la app: audio (`expo-audio`), lectura en voz alta
  (`expo-speech`) y navegación nativa (React Navigation native-stack).
- ✅ Documento [estrategia-pruebas.md](../estrategia-pruebas.md) con los niveles de prueba (unitario /
  integración / E2E) y la guía de TDD (introducido en US-32).
- ❌ No hay E2E sobre la app **nativa**: Playwright no maneja el iOS Simulator (viewport no disponible
  sobre el protocolo de inspección de iOS) y su soporte Android es experimental/web-WebView.
- ❌ No hay herramienta de E2E nativo configurada (Maestro), ni _flow_ YAML, ni build de desarrollo.
- ❌ La estrategia de pruebas no distingue **cuándo** aplica E2E nativo (Maestro) vs E2E web
  (Playwright).
- ❌ No hay job de CI para el E2E nativo (ni la nota de su omisión deliberada en PR).
- ❌ No hay ADR que registre la decisión **Maestro vs Detox**.

Decisiones tomadas con el usuario (2026-06-24):

- **Maestro** frente a Detox por **YAGNI**: setup mínimo, _flows_ en YAML, integra con Expo
  dev/development build. Detox se descarta por mayor coste de configuración. Se justifica en un ADR
  (siguiente número libre: **0005**).
- E2E nativo como **nivel complementario, no sustituto** del E2E web de Playwright.
- Localizar elementos por **identificador/etiqueta accesible**, no por estructura (coherente con
  US-30/US-32).
- Ejercitar al menos una capacidad **solo nativa** (`expo-speech`/`expo-audio`) con un efecto
  observable que el E2E web no cubre.
- CI: el E2E nativo corre en un **job separado** (nightly/manual), **no** en el gate de cada PR; la
  omisión en PR queda documentada (sin falsa sensación de cobertura).
- Dependencias **solo de desarrollo/CI**, modo `mock` por defecto, sin alterar el arranque
  reproducible (US-06).

## Historias cubiertas

- US-35 — E2E nativo de la app en simuladores (iOS/Android) con Maestro
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-35))

## Tareas

- [ ] ❌ Redactar **ADR 0005** con la decisión Maestro vs Detox (contexto, decisión, alternativas,
      consecuencias) y registrarlo en [../ADR/README.md](../ADR/README.md).
- [ ] ❌ Instalar/configurar **Maestro** y el **build de desarrollo** de Expo (iOS/Android) necesario
      para ejecutar los _flows_ sobre simulador/emulador.
- [ ] ❌ Escribir el **_flow_ YAML** del happy path: onboarding → crear perfil → generar cuento →
      narración, localizando por identificador/etiqueta accesible.
- [ ] ❌ Ejecutar el _flow_ sobre el **iOS Simulator** y verificar el recorrido (incluida la capacidad
      solo nativa con efecto observable).
- [ ] ❌ Ejecutar el _flow_ sobre el **Android Emulator** y verificar paridad de plataformas.
- [ ] ❌ Documentar en [../estrategia-pruebas.md](../estrategia-pruebas.md) **cuándo Maestro vs
      Playwright**, cómo ejecutarlo en local (simulador/emulador) y enlazar el ADR.
- [ ] ❌ Job de **CI separado** (nightly/manual) para el E2E nativo, **fuera** del gate de cada PR, con
      la nota de su omisión deliberada en PR.
- [ ] ❌ Docs + cierre con **`cerrar-feature`** (gate verde, versión SemVer, CHANGELOG por paquete,
      tracking docs) → pruebas con el usuario → confirmación → `finish`.

## Notas / riesgos

- **Coste de CI**: levantar simuladores/emuladores es lento y caro; por eso el job va separado
  (nightly/manual), no en cada PR. Documentar la omisión para no dar falsa cobertura.
- **Complementario, no sustituto**: el E2E web (Playwright) sigue cubriendo la lógica de pantallas; el
  E2E nativo añade lo que solo existe en nativo (audio, voz, navegación nativa).
- **Cumplimiento de menores**: dependencias solo de desarrollo/CI, modo `mock` por defecto (sin red ni
  IA externa ni SDKs de terceros en runtime); no se altera el arranque reproducible (US-06).
- **Sin implementación todavía**: este documento es solo el andamiaje de seguimiento; la configuración
  real de Maestro es trabajo posterior.
