# ADR 0005 — Maestro para E2E nativo en simuladores (frente a Detox)

- **Estado:** **Aceptada** (2026-06-24)
- **Fecha:** 2026-06-24
- **Relacionada con:** [ADR 0001](0001-arquitectura-limpia-monorepo.md) · US-38 ·
  US-32/US-36 (E2E web con Playwright)

## Contexto

El E2E actual de la app ([US-32](../historias-usuario/epic-f-plataforma.md#us-32)) recorre la app
con **Playwright** sobre el **export web** de Expo (`react-native-web`). Eso valida la lógica de
pantallas, pero **no** es la app nativa: Playwright no maneja el iOS Simulator (la emulación de
viewport ni siquiera está disponible sobre el protocolo de inspección de iOS) y su soporte Android es
experimental (WebView). Por tanto no cubre lo que **solo existe en nativo**: audio (`expo-audio`),
lectura en voz alta (`expo-speech`) y la navegación nativa (React Navigation native-stack).

Queremos un **nivel complementario, no sustituto**: pruebas end-to-end de la app **nativa** sobre el
**iOS Simulator** y el **Android Emulator** que recorran el happy path del MVP (onboarding → crear
perfil → generar cuento → narrarlo) y ejerciten al menos una capacidad solo nativa con un efecto
observable. El proyecto manda **YAGNI por encima de completitud**: no añadir más herramienta ni
configuración de la imprescindible para un TFM, y justificar por escrito.

## Decisión

Adoptar **[Maestro](https://maestro.mobile.dev/)** como herramienta de E2E nativo sobre simuladores,
con los _flows_ escritos en **YAML declarativo** y los elementos localizados por
**identificador/etiqueta accesible** (coherente con US-30/US-32), no por estructura ni estilos.

- El _flow_ vive en [`packages/app/.maestro/`](../../packages/app/.maestro/) (convención de Maestro:
  carpeta `.maestro` por proyecto).
- Requiere un **development build** de Expo (no Expo Go: la app usa módulos nativos —`expo-audio`,
  `expo-speech`— que Expo Go no incluye), un **simulador/emulador arrancado** y el **backend en modo
  `mock`** (sin red ni IA externa).
- En CI corre en un **job separado** (nightly/manual), **no** en el gate de cada PR, por el coste de
  levantar simuladores (lento y caro; iOS exige runner macOS). La omisión en PR se documenta para no
  dar falsa sensación de cobertura.

## Alternativas consideradas

- **Detox** (gray-box, Wix). Se sincroniza con el _run loop_ de la app (menos esperas _flaky_) pero a
  cambio de un **coste de configuración y mantenimiento mayor**: requiere instrumentar la app, ligarse
  a versiones de RN/Expo y mantener un _runner_ de Jest propio. Sobredimensionado para un TFM con un
  único happy path. **Descartada por YAGNI.**
- **Appium.** Estándar amplio y multiplataforma, pero pesado de configurar (servidor, _drivers_,
  capabilities) frente a lo que necesitamos. Descartada.
- **Solo Playwright (web).** Es lo que ya tenemos; por definición no cubre lo nativo (audio, voz,
  navegación nativa). No resuelve la necesidad; se mantiene como nivel **complementario**.

## Consecuencias

**Positivas**

- Setup mínimo: instalar el CLI de Maestro y escribir un YAML; sin instrumentar la app ni mantener un
  _runner_ de pruebas propio.
- _Flows_ declarativos y legibles que documentan el recorrido del MVP en las plataformas objetivo.
- Cubre lo que el E2E web no puede (capacidad solo nativa con efecto observable), cerrando el hueco de
  fidelidad de plataforma.

**Costes / riesgos**

- Requiere un **development build** de Expo (no Expo Go) por los módulos nativos; es un paso de
  preparación documentado, no automático.
- Levantar simuladores/emuladores es **lento y caro**; por eso el E2E nativo va en un **job de CI
  separado** (nightly/manual), fuera del gate de PR. El gate de PR sigue cubriendo unitarios +
  integración de rutas + E2E web.
- **No sustituye** al E2E web (Playwright, US-32/US-36): lo **complementa**. La lógica de pantallas se
  sigue validando en web; lo nativo añade audio/voz/navegación nativa.

**Cumplimiento de menores**

- Dependencias **solo de desarrollo/CI**, modo `mock` por defecto (sin red ni IA externa ni SDKs de
  terceros en runtime); no se altera el arranque reproducible
  ([US-06](../historias-usuario/epic-f-plataforma.md#us-06)). Ver
  [cumplimiento-menores.md](../cumplimiento-menores.md).
