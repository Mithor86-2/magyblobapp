# Plan — Feature 38: E2E nativo de la app en simuladores con Maestro (US-38)

> Alcance global en [../plan-ejecucion-master.md](../plan-ejecucion-master.md); estado por fase en
> [../phases.md](../phases.md). Aquí va el **cómo** se trocea y ejecuta.
>
> Rama: `feature/38-e2e-nativo-maestro` (desde `develop`). Historia: **US-38**. Solo app/tests/CI.

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

- US-38 — E2E nativo de la app en simuladores (iOS/Android) con Maestro
  ([épica F](../historias-usuario/epic-f-plataforma.md#us-38))

## Tareas

- [x] ✅ Redactar **ADR 0005** con la decisión Maestro vs Detox (contexto, decisión, alternativas,
      consecuencias) y registrarlo en [../ADR/README.md](../ADR/README.md).
      → [../ADR/0005-e2e-nativo-maestro.md](../ADR/0005-e2e-nativo-maestro.md). **0005** confirmado
      como siguiente número libre (existían 0001–0004).
- [x] ✅ Instalar/configurar **Maestro** y el **build de desarrollo** de Expo (iOS/Android) necesario
      para ejecutar los _flows_ sobre simulador/emulador. Ejecutado en una máquina con Xcode/iOS
      Simulator (ver "Actualización 2026-06-25"); el entorno headless de andamiaje no podía correrlo,
      por eso los pasos quedaron documentados (flow + estrategia-pruebas + esqueleto CI).
- [x] ✅ Escribir el **_flow_ YAML** del happy path: onboarding → crear perfil → generar cuento →
      narración (+ actividades e historial), localizando por identificador/etiqueta accesible.
      → [../../packages/app/.maestro/onboarding.yaml](../../packages/app/.maestro/onboarding.yaml).
      **Endurecido (2026-06-25)** tras leer las pantallas reales: selectores alineados con el E2E web
      (`onboarding.spec.ts`, `actividades-historial.spec.ts`). Resueltos los `# TODO`:
  - **Puerta parental:** NO es un campo de texto, son **tres chips** (respuesta + 2 distractores
    barajados). Se resuelve con `copyTextFrom` del `testID` `parental-pregunta`, se parsean los
    operandos con `evalScript` (`maestro.copiedText.match(/\d+/g)`), se suma y se toca el chip con
    `tapOn: ${output.suma}` (mismo enfoque que el E2E web traducido a Maestro).
  - **Campos del alta:** localizados por `testID` (`alta-nombre` / `alta-apellidos` / `alta-email`).
  - Añadido el recorrido de **Actividades** (generar → "Realizado" → estrellas → "¡Hecha!") e
    **Historial** ("Cuentos mágicos" + nombre del niño).
- [x] ✅ Añadir **`testID`** aditivos y seguros (no cambian render ni textos visibles; los E2E web van
      por rol/nombre accesible, no por testID): `parental-pregunta` en el reto de la puerta parental
      (components/ParentalGate.tsx) y `alta-nombre`/`alta-apellidos`/`alta-email` en los TextField del
      alta (screens/ConsentScreen.tsx, vía una prop `testID` opcional nueva en components/TextField.tsx).
- [x] ✅ Ejecutar el _flow_ sobre el **iOS Simulator** y verificar el recorrido (incluida la capacidad
      solo nativa con efecto observable). **Hecho el 2026-06-25** (iPhone 17 Pro, iOS 26.4, **Expo Go**,
      Maestro 2.6.1): **pasada completa en verde** de bienvenida → historial, incluida la narración
      nativa `expo-speech` («Escuchar» → «Pausar» + «Parar» → reposo). No hizo falta development build:
      `expo-speech` degrada a la voz nativa y **Expo Go la incluye**. Verificar destapó **7 correcciones**
      en el flow (aplicadas a `onboarding.yaml`) + 1 ajuste de entorno:
  - **Puerta parental:** el `testID` de un `<Text>` **no** se expone como `id` en iOS →
    `copyTextFrom` por **texto** (regex `\d+ \+ \d+ = \?`), no por `id: parental-pregunta`.
  - **`hideKeyboard` falla en iOS** → cerrar teclado **tocando el título** (no interactivo;
    `keyboardShouldPersistTaps="handled"`). Sin esto, el Email se concatena en el campo anterior.
  - **Chips Parentesco/consentimiento e interés** quedan bajo el footer fijo / fuera de pantalla →
    `scrollUntilVisible` + **`centerElement: true`** (si no, el tap lo intercepta el footer y el
    elemento no se selecciona → botón deshabilitado).
  - **Asserts tras navegación** → `extendedWaitUntil` (no `assertVisible`, de timeout corto).
  - **Pestañas:** iOS las expone como `"Cuentos, tab, 3 of 4"` y Maestro hace **match completo** →
    selector regex `'Cuentos, tab.*'` (ídem Actividades/Historial).
  - **Asserts de subcadena** (nombre del niño) → regex `'.*Mateo.*'` (mismo motivo de match completo).
  - **Sin `launchApp`/`clearState` en Expo Go:** `clearState` borra Expo Go y dispara su **dev menu**,
    que tapa la UI; el flow arranca con sesión limpia. (En **dev build** `clearState` sí es fiable.)
  - **Entorno (no es bug del flow):** pese a `AI_PROVIDER=mock`, por US-14 el HotSwap servía con
    **Groq** (`ai.cloud` activa + `GROQ_API_KEY` en `.env`) → cuento no determinista. Para E2E
    determinista, backend con **claves cloud vacías** (o `ai.cloud` desactivada).
- [ ] 🔄 Ejecutar el _flow_ sobre el **Android Emulator** y verificar paridad de plataformas.
      _Pendiente de tu máquina_: requiere Android SDK + AVD + development build.
- [x] ✅ Documentar en [../estrategia-pruebas.md](../estrategia-pruebas.md) **cuándo Maestro vs
      Playwright**, cómo ejecutarlo en local (simulador/emulador) y enlazar el ADR.
      → nueva sección «E2E web (Playwright) vs E2E nativo (Maestro)» + fila en la pirámide.
- [x] ✅ Job de **CI separado** (nightly/manual) para el E2E nativo, **fuera** del gate de cada PR, con
      la nota de su omisión deliberada en PR.
      → [../../.github/workflows/e2e-native.yml](../../.github/workflows/e2e-native.yml)
      (`workflow_dispatch` + `schedule`, **sin** push/PR). **Esqueleto**: los pasos de build dev +
      arranque de simulador/emulador + `maestro test` quedan como `# TODO` a validar en runner real.
- [x] ✅ Docs + cierre con **`cerrar-feature`** (gate verde, versión SemVer, CHANGELOG por paquete,
      tracking docs) → pruebas con el usuario → confirmación → `finish`. Cerrada y mergeada a `develop`
      (app `0.16.0` / raíz `0.23.0`). _Queda pendiente solo la paridad Android (ver arriba)._

## Estado de la automatización (2026-06-25)

Implementado en este entorno (headless, sin simuladores ni build de Expo): **ADR 0005**, **flow
Maestro endurecido** (selectores reales, puerta parental resuelta por chips, actividades+historial),
**`testID`** aditivos en la app, **doc de estrategia** y **esqueleto de CI** (job separado).
Integrado `develop` (root 0.21.1, app 0.14.1; US-35/36/37/39).

**Actualización 2026-06-25 (ejecución real en simulador):** el _flow_ se **ejecutó y pasó en verde**
sobre el **iOS Simulator (iPhone 17 Pro, iOS 26.4) con Expo Go** (Maestro 2.6.1), recorrido completo
incluida la narración nativa. La verificación destapó **7 correcciones de selectores/timing** (ya
aplicadas a `onboarding.yaml`; detalle en la tarea de arriba y en `lecciones-aprendidas.md`) y un
**ajuste de entorno** (backend en mock real con claves cloud vacías). Queda pendiente solo:
**Android Emulator** (paridad de plataformas) y el **cierre** (versión + CHANGELOG + `finish`).

## Notas / riesgos

- **Coste de CI**: levantar simuladores/emuladores es lento y caro; por eso el job va separado
  (nightly/manual), no en cada PR. Documentar la omisión para no dar falsa cobertura.
- **Complementario, no sustituto**: el E2E web (Playwright) sigue cubriendo la lógica de pantallas; el
  E2E nativo añade lo que solo existe en nativo (audio, voz, navegación nativa).
- **Cumplimiento de menores**: dependencias solo de desarrollo/CI, modo `mock` por defecto (sin red ni
  IA externa ni SDKs de terceros en runtime); no se altera el arranque reproducible (US-06).
- **Sin implementación todavía**: este documento es solo el andamiaje de seguimiento; la configuración
  real de Maestro es trabajo posterior.
