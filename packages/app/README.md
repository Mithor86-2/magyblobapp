# @magyblob/app

App móvil **"Aprendizaje Mágico"** (Expo SDK 56 + React Navigation + Zustand).

Cubre el producto completo: **onboarding y sesión** (alta/login del adulto con JWT,
multi-perfil), pestañas **Inicio · Actividades · Cuentos · Historial**, **modo anónimo**,
**zona de adultos tras gate parental**, **narración** por voz y **portadas** de imagen,
con interfaz **bilingüe ES/EN**. Es agnóstica del proveedor de IA: el modo (mock | local
| cloud) lo decide el backend. Visión de conjunto y despliegue en el [README raíz](../../README.md).

## Arrancar

Necesitas el backend levantado (ver el README raíz). Para la demo con IA local:

```bash
pnpm up:local                 # backend + PostgreSQL + Ollama (AI_PROVIDER=local)
# (una vez) pnpm ollama:setup  # baja gemma:2b al contenedor de Ollama
```

Luego, la app. Desde `packages/app`, con un **development build** (Expo Go ya no sirve: la app
usa módulos nativos —`expo-navigation-bar`/`expo-system-ui`, tema claro/oscuro US-66— que Expo Go
no incluye):

```bash
cp .env.example .env          # crea el .env local
# Fija EXPO_PUBLIC_API_URL en packages/app/.env SEGÚN el destino:
#   Emulador Android:  EXPO_PUBLIC_API_URL=http://10.0.2.2:3000   (localhost = el emulador, NO tu PC)
#   Simulador iOS:     EXPO_PUBLIC_API_URL=http://localhost:3000
#   Móvil físico:      EXPO_PUBLIC_API_URL=http://<IP-LAN-de-tu-PC>:3000   (móvil en el mismo wifi)

cd packages/app
npx expo run:android          # compila e instala el dev build en emulador/dispositivo Android
npx expo run:ios              # (macOS + Xcode) compila e instala en simulador/dispositivo iOS
```

> **Por qué `expo run:*` y no `expo start`/Expo Go:** al añadir módulos nativos el cliente Expo Go
> no puede cargarlos; hace falta un dev build propio. `expo run:android`/`run:ios` hacen el prebuild,
> compilan y lanzan Metro. Tras la primera compilación puedes iterar con Metro ya activo.
>
> **`EXPO_PUBLIC_*` se incrusta en build-time:** si cambias `.env`, **relanza** `expo run:*` (no basta
> recargar). Si sale "no se puede conectar al servidor": revisa `EXPO_PUBLIC_API_URL` (emulador Android
> = `10.0.2.2`, no `localhost`) y que el backend responda (`curl http://localhost:3000/health` → 200).

Para **producción** (URL del backend de Render, export web y EAS Build), ver
[Desplegar la app en producción](../../README.md#desplegar-la-app-en-producción-expo) en el README raíz.

## Estructura (Clean Architecture ligera)

Dependencias hacia dentro: `presentation → domain ← infrastructure`. El composition
root (`src/composition.ts`) es el único módulo que conoce la implementación concreta.

```text
App.tsx               navegación (native-stack) + fuentes + hidratación del store
src/domain/           modelos, vocabularios, interfaces de gateway y ApiError (sin framework)
src/infrastructure/   adaptador HTTP (createApiGateways) + storage (AsyncStorage) + test
src/composition.ts    composition root: api = createApiGateways() (tipado como domain)
src/presentation/
  theme/tokens.ts     design system (paleta coral/menta, Quicksand, tap targets ≥64px)
  store/              estado Zustand (guardianId persistido; perfil de sesión)
  components/         Screen, BubblyButton, SelectableChip, AvatarPicker, TextField… (+ *.test.tsx co-locados)
  screens/            ConsentScreen, CreateProfileScreen, StoryGeneratorScreen
  labels.ts           presentación con acentos de los vocabularios
  navigation.ts       tipos del native-stack
```

## Pruebas y gate

```bash
pnpm --filter @magyblob/app typecheck   # tsc --noEmit
pnpm --filter @magyblob/app test        # vitest: cliente HTTP + componentes
```

El `pnpm check` de la raíz cubre la app en typecheck, formato y tests. El ESLint
raíz ignora `packages/app/**` (toolchain RN aparte).

### Tests user-centric de componentes (US-30)

Los componentes se prueban **como lo haría una persona usuaria**, siguiendo la _Query
Priority_ de Testing Library: `getByRole` → `getByLabelText` → `getByText` (y `testID`
solo como último recurso). Cada test localiza el elemento por su **rol accesible** o su
**texto** y simula la interacción (`fireEvent`), nunca por estructura ni estilos. Hoy
cubren 11 componentes (`BubblyButton`, `ParentalGate`, `TextField`, `SelectableChip`,
`StarRating`, `AvatarPicker`, `AuthorBadge`, `ActivityCard`, `NarrationControls`,
`Screen`, `DialogProvider`).

**Arnés de render** (todo en `devDependencies`, sin impacto en runtime): se renderiza
con `@testing-library/react` sobre `jsdom` aliasando `react-native` → `react-native-web`
(ver [`vitest.config.ts`](vitest.config.ts)). RN-web traduce las props de accesibilidad
a su equivalente ARIA (`accessibilityRole`→`role`, `accessibilityLabel`→`aria-label`,
`accessibilityState`→`aria-*`), que es justo lo que consultan las queries. El entorno
por defecto es `node` (para el test del cliente HTTP); cada test de componente declara
`// @vitest-environment jsdom` en su cabecera. Los matchers de
`@testing-library/jest-dom` se cargan en [`vitest.setup.ts`](vitest.setup.ts).

**Convenciones y límites:**

- Los tests viven co-locados (`Componente.test.tsx` junto al componente).
- El wrapper `Icon` no se prueba directamente: `lucide-react-native` no es importable
  bajo Vitest (módulo ESM incompatible), así que se sustituye por un doble
  (`vi.mock('./Icon', …)`) en los tests que lo arrastran. Su contrato lo cubre US-29.
- Las dependencias pesadas o de IO se mockean (p. ej. `useNarration`, `react-native-safe-area-context`).
